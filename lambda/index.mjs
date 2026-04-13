/**
 * Picasso Config Manager Lambda Function
 * Handles S3-based CRUD operations for tenant configurations
 *
 * Runtime: Node.js 20.x
 * Handler: index.handler
 */

import {
  listTenantConfigs,
  loadConfig,
  getTenantMetadata,
  saveConfig,
  deleteConfig,
  deleteTenantCompletely,
  listBackups,
  generateTenantHash,
  createTenantMapping,
} from './s3Operations.mjs';

import {
  putTenantRecord,
  updateTenantTimestamp,
  updateTenantStatus,
} from './registryOperations.mjs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const demoTemplate = require('./demo-template.json');

import {
  mergeConfigSections,
  extractEditableSections,
  validateEditedSections,
  getSectionInfo,
  generateConfigDiff,
} from './mergeStrategy.mjs';

/**
 * Main Lambda handler
 * Routes requests to appropriate functions based on HTTP method and path
 * Supports both API Gateway and Lambda Function URL event formats
 */
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle both API Gateway and Function URL event formats
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath || event.requestContext?.http?.path;
  const body = event.body;
  const queryStringParameters = event.queryStringParameters;

  // Check if this is a Function URL request (which handles CORS automatically)
  const isFunctionUrl = event.requestContext?.http?.method !== undefined;

  // Only add CORS headers for API Gateway (not Function URLs)
  const headers = {
    'Content-Type': 'application/json',
    ...(!isFunctionUrl && {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }),
  };

  try {
    // OPTIONS for CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    // Health check
    if (httpMethod === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          service: 'picasso-config-manager',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /config/tenants - List all tenant configs
    if (httpMethod === 'GET' && path === '/config/tenants') {
      const tenants = await listTenantConfigs();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tenants }),
      };
    }

    // GET /config/{tenantId}/metadata - Get tenant metadata only
    if (httpMethod === 'GET' && path.match(/^\/config\/([^/]+)\/metadata$/)) {
      const tenantId = path.match(/^\/config\/([^/]+)\/metadata$/)[1];
      const metadata = await getTenantMetadata(tenantId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ metadata }),
      };
    }

    // GET /config/{tenantId}/backups - List backups for tenant
    if (httpMethod === 'GET' && path.match(/^\/config\/([^/]+)\/backups$/)) {
      const tenantId = path.match(/^\/config\/([^/]+)\/backups$/)[1];
      const backups = await listBackups(tenantId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ backups }),
      };
    }

    // GET /config/{tenantId} - Load full tenant config
    if (httpMethod === 'GET' && path.match(/^\/config\/([^/]+)$/)) {
      const tenantId = path.match(/^\/config\/([^/]+)$/)[1];
      const editableOnly = queryStringParameters?.editable_only === 'true';

      const config = await loadConfig(tenantId);

      if (editableOnly) {
        const editableConfig = extractEditableSections(config);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ config: editableConfig }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ config }),
      };
    }

    // PUT /config/{tenantId} - Save tenant config
    if (httpMethod === 'PUT' && path.match(/^\/config\/([^/]+)$/)) {
      const tenantId = path.match(/^\/config\/([^/]+)$/)[1];
      const requestBody = JSON.parse(body);

      const {
        config: editedConfig,
        merge = true,
        create_backup = true,
        validate_only = false,
      } = requestBody;

      // Only validate sections if merge=true (section-based editing)
      // When merge=false, full config replacement is allowed
      if (merge) {
        const validation = validateEditedSections(editedConfig);
        if (!validation.isValid) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Invalid edited sections',
              details: validation.errors,
            }),
          };
        }
      }

      // If validation only, return without saving
      if (validate_only) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            valid: true,
            message: 'Configuration is valid',
          }),
        };
      }

      let finalConfig = editedConfig;

      // If merge is enabled, load base config and merge
      if (merge) {
        try {
          const baseConfig = await loadConfig(tenantId);
          finalConfig = mergeConfigSections(baseConfig, editedConfig);

          // Generate diff for logging
          const diff = generateConfigDiff(baseConfig, finalConfig);
          console.log('Config diff:', JSON.stringify(diff, null, 2));
        } catch (error) {
          // If config doesn't exist, use edited config as-is
          if (error.message.includes('not found')) {
            console.log('Creating new config (no existing config found)');
            finalConfig = editedConfig;
          } else {
            throw error;
          }
        }
      }

      // Save the config
      const result = await saveConfig(tenantId, finalConfig, create_backup);

      // Update registry timestamp (non-blocking — don't fail the request)
      try {
        await updateTenantTimestamp(tenantId);
      } catch (registryErr) {
        console.warn('Registry timestamp update failed (non-blocking):', registryErr.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...result,
        }),
      };
    }

    // DELETE /config/{tenantId} - Delete tenant config
    // Use ?full=true to permanently delete all files (config, backups, mapping)
    if (httpMethod === 'DELETE' && path.match(/^\/config\/([^/]+)$/)) {
      const tenantId = path.match(/^\/config\/([^/]+)$/)[1];
      const fullDelete = queryStringParameters?.full === 'true';

      const result = fullDelete
        ? await deleteTenantCompletely(tenantId)
        : await deleteConfig(tenantId);

      // Update registry status (non-blocking — don't fail the request)
      try {
        if (fullDelete) {
          // Hard delete: mark churned and null out s3ConfigPath (files are gone)
          await updateTenantStatus(tenantId, 'churned', { s3ConfigPath: null });
        } else {
          // Soft delete: mark churned, preserve s3ConfigPath (config archived to backup)
          await updateTenantStatus(tenantId, 'churned');
        }
      } catch (registryErr) {
        console.warn('Registry status update failed (non-blocking):', registryErr.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...result,
        }),
      };
    }

    // GET /sections - Get section information
    if (httpMethod === 'GET' && path === '/sections') {
      const info = getSectionInfo();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sections: info }),
      };
    }

    // POST /config - Create new tenant
    if (httpMethod === 'POST' && path === '/config') {
      const requestBody = JSON.parse(body);
      const {
        org_name,
        tenant_id,
        chat_title,
        chat_subtitle,
        subscription_tier,
        primary_color,
        welcome_message,
        knowledge_base_id,
        use_template = true,
        tenant_type = 'demo',
      } = requestBody;

      // Validate tenant_id
      if (!tenant_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'tenant_id is required',
          }),
        };
      }

      if (!/^[A-Za-z0-9_-]+$/.test(tenant_id) || tenant_id.length > 50) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'tenant_id must be alphanumeric (hyphens/underscores allowed), max 50 characters',
          }),
        };
      }

      // Check if tenant already exists
      try {
        await loadConfig(tenant_id);
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Conflict',
            message: `Tenant ${tenant_id} already exists`,
          }),
        };
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw error;
        }
        // Config not found = good, tenant doesn't exist yet
      }

      // Generate tenant hash
      const tenant_hash = generateTenantHash(tenant_id);

      // Build config from template or minimal defaults
      let config;
      if (use_template) {
        config = JSON.parse(JSON.stringify(demoTemplate));
      } else {
        config = {
          tenant_type: 'demo',
          subscription_tier: 'Free',
          branding: {},
          features: { streaming: true },
          programs: {},
          conversational_forms: {},
          cta_definitions: {},
          conversation_branches: {},
          cta_settings: { fallback_branch: null },
        };
      }

      // Apply provided overrides
      config.tenant_id = tenant_id;
      config.tenant_hash = tenant_hash;
      config.tenant_type = tenant_type;
      if (org_name) config.org_name = org_name;
      config.generated_at = Math.floor(Date.now() / 1000);
      config.version = '1.0';

      if (chat_title) config.chat_title = chat_title;
      if (chat_subtitle) config.chat_subtitle = chat_subtitle;
      if (subscription_tier) config.subscription_tier = subscription_tier;
      if (welcome_message) config.welcome_message = welcome_message;
      if (knowledge_base_id) {
        config.aws = config.aws || {};
        config.aws.knowledge_base_id = knowledge_base_id;
      }
      if (primary_color) {
        config.branding = config.branding || {};
        config.branding.primary_color = primary_color;
        config.branding.header_background_color = primary_color;
        config.branding.widget_background_color = primary_color;
      }

      // Save config to S3 (no backup needed for new tenant)
      await saveConfig(tenant_id, config, false);

      // Create hash mapping
      await createTenantMapping(tenant_id, tenant_hash);

      // Seed tenant registry record (non-blocking — don't fail the request)
      try {
        await putTenantRecord({
          tenantId: tenant_id,
          tenantHash: tenant_hash,
          companyName: org_name || chat_title || tenant_id,
          s3ConfigPath: `tenants/${tenant_id}/${tenant_id}-config.json`,
          subscriptionTier: subscription_tier || 'free',
          status: 'active',
          onboardedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          networkId: null,
          networkName: null,
          clerkOrgId: '',
          stripeCustomerId: '',
        });
      } catch (registryErr) {
        console.warn('Registry seed failed (non-blocking):', registryErr.message);
      }

      // Build embed code
      const embedCode = `<script src="https://chat.myrecruiter.ai/widget.js" data-tenant="${tenant_hash}" async></script>`;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          tenant_id,
          tenant_hash,
          embed_code: embedCode,
          config,
        }),
      };
    }

    // 404 - Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route not found: ${httpMethod} ${path}`,
      }),
    };

  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};
