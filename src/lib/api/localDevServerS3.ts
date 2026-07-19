/**
 * Local Development Server with Real S3 Integration
 * Uses AWS SDK to connect to real S3 bucket with ai-developer profile
 *
 * Run with: npm run server:dev
 */

import express from 'express';
import { fromIni } from '@aws-sdk/credential-providers';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const app = express();
const PORT = Number(process.env.DEV_SERVER_PORT) || 3001;
// Default to the STAGING bucket (born-in-staging authoring model). A local dev
// server has no business defaulting to the prod tenant-config bucket — set
// S3_BUCKET explicitly to target anything else.
const S3_BUCKET = process.env.S3_BUCKET || 'myrecruiter-picasso-staging';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_PROFILE = process.env.AWS_PROFILE || 'ai-developer';

// Only same-machine browser origins may call this dev server. This is the guard
// that stops a malicious web page (incl. DNS-rebinding to 127.0.0.1) from
// driving writes to the real S3 bucket — there is no auth on these routes.
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Initialize S3 client with profile
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: fromIni({ profile: AWS_PROFILE }),
});

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware — localhost origins only (see LOCAL_ORIGIN_RE above).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && LOCAL_ORIGIN_RE.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-Match');
  res.header('Access-Control-Expose-Headers', 'ETag');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  next();
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Root endpoint - API documentation
 */
app.get('/', (_req, res) => {
  res.json({
    service: 'Picasso Config Manager - Local Development Server (S3)',
    version: '1.0.0',
    mode: 'development',
    s3Bucket: S3_BUCKET,
    awsRegion: AWS_REGION,
    awsProfile: AWS_PROFILE,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      tenants: {
        list: 'GET /config/tenants',
        load: 'GET /config/:tenantId?editable_only=true',
        save: 'PUT /config/:tenantId',
        delete: 'DELETE /config/:tenantId',
      },
    },
    documentation: 'See docs/PHASE_5_S3_INTEGRATION.md for full API documentation',
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'picasso-config-manager-local-s3',
    timestamp: new Date().toISOString(),
    mode: 'development',
    s3Connected: true,
  });
});

/**
 * List all tenant configs from S3
 * GET /config/tenants
 */
app.get('/config/tenants', async (_req, res) => {
  try {
    // List all tenant folders in s3://myrecruiter-picasso/tenants/
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: 'tenants/',
      Delimiter: '/',
    });

    const response = await s3Client.send(command);

    // Extract tenant IDs from common prefixes (folders)
    const tenantPrefixes = response.CommonPrefixes || [];

    const tenants = await Promise.all(
      tenantPrefixes.map(async (prefix) => {
        // Extract tenant ID from prefix like "tenants/MYR384719/"
        const tenantId = prefix.Prefix?.replace('tenants/', '').replace('/', '') || '';

        // Get the config file for this tenant
        const configKey = `tenants/${tenantId}/${tenantId}-config.json`;

        try {
          // Get config to extract tenant name
          const configCommand = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: configKey,
          });

          const configResponse = await s3Client.send(configCommand);
          const configData = await configResponse.Body?.transformToString();
          const config = configData ? JSON.parse(configData) : {};

          return {
            tenantId,
            tenantName: config.company_name || config.chat_title || tenantId,
            key: configKey,
            lastModified: configResponse.LastModified,
            size: configResponse.ContentLength,
          };
        } catch (err) {
          // If config doesn't exist, return basic info
          console.warn(`Config not found for tenant ${tenantId}:`, err);
          return {
            tenantId,
            tenantName: tenantId,
            key: configKey,
            lastModified: new Date(),
            size: 0,
          };
        }
      })
    );

    res.json({ tenants: tenants.filter(t => t.tenantId) });
  } catch (error: unknown) {
    console.error('Error listing tenants:', error);
    res.status(500).json({
      error: 'Failed to list tenants',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Load tenant config
 * GET /config/{tenantId}?editable_only=true
 */
app.get('/config/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const editableOnly = req.query.editable_only === 'true';
    const configKey = `tenants/${tenantId}/${tenantId}-config.json`;

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: configKey,
    });

    const response = await s3Client.send(command);
    const configData = await response.Body?.transformToString();

    if (!configData) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Config not found for tenant: ${tenantId}`,
      });
    }

    let config = JSON.parse(configData);

    if (editableOnly) {
      // Extract only editable sections
      const EDITABLE_SECTIONS = [
        'programs',
        'conversational_forms',
        'cta_definitions',
        'conversation_branches',
      ];

      const METADATA_FIELDS = [
        'tenant_id',
        'version',
        'chat_title',
        'company_name',
        'last_updated',
      ];

      const editableConfig: Record<string, unknown> = {};

      METADATA_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(config, field)) {
          editableConfig[field] = config[field];
        }
      });

      EDITABLE_SECTIONS.forEach(section => {
        if (Object.prototype.hasOwnProperty.call(config, section)) {
          editableConfig[section] = config[section];
        }
      });

      config = editableConfig;
    }

    res.json({ config });
  } catch (error: unknown) {
    console.error('Error loading config:', error);
    res.status(404).json({
      error: 'Not Found',
      message: `Config not found for tenant: ${req.params.tenantId}`,
    });
  }
});

/**
 * Save tenant config
 * PUT /config/{tenantId}
 */
app.put('/config/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      config: editedConfig,
      merge = true,
      create_backup = true,
      validate_only = false,
    } = req.body;

    // If validation only, just return success
    if (validate_only) {
      return res.json({
        valid: true,
        message: 'Configuration is valid',
      });
    }

    const configKey = `tenants/${tenantId}/${tenantId}-config.json`;
    let finalConfig = editedConfig;

    // Create backup if requested
    if (create_backup) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: configKey,
        });
        const existingResponse = await s3Client.send(getCommand);
        const existingData = await existingResponse.Body?.transformToString();

        if (existingData) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupKey = `tenants/${tenantId}/backups/${tenantId}-${timestamp}.json`;

          const putBackupCommand = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: backupKey,
            Body: existingData,
            ContentType: 'application/json',
          });

          await s3Client.send(putBackupCommand);
          console.log(`Created backup: ${backupKey}`);
        }
      } catch (error) {
        console.warn('Failed to create backup:', error);
      }
    }

    // Merge with existing config if requested
    if (merge) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: configKey,
        });
        const existingResponse = await s3Client.send(getCommand);
        const existingData = await existingResponse.Body?.transformToString();

        if (existingData) {
          const baseConfig = JSON.parse(existingData);
          finalConfig = { ...baseConfig, ...editedConfig };
          finalConfig.tenant_id = tenantId;
        }
      } catch {
        console.log('Creating new config (no existing config found)');
      }
    }

    // Add metadata
    finalConfig.last_updated = new Date().toISOString();
    finalConfig.tenant_id = tenantId;

    // Save config to S3
    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: configKey,
      Body: JSON.stringify(finalConfig, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    res.json({
      success: true,
      tenantId,
      key: configKey,
      timestamp: finalConfig.last_updated,
    });
  } catch (error: unknown) {
    console.error('Error saving config:', error);
    res.status(500).json({
      error: 'Failed to save config',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete tenant config
 * DELETE /config/{tenantId}
 */
app.delete('/config/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const configKey = `tenants/${tenantId}/${tenantId}-config.json`;

    // Create backup before deleting
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: configKey,
    });
    const response = await s3Client.send(getCommand);
    const configData = await response.Body?.transformToString();

    if (configData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `tenants/${tenantId}/backups/${tenantId}-${timestamp}.json`;

      const putBackupCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: backupKey,
        Body: configData,
        ContentType: 'application/json',
      });

      await s3Client.send(putBackupCommand);

      // Delete the config
      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: configKey,
      });

      await s3Client.send(deleteCommand);

      res.json({
        success: true,
        tenantId,
        deletedKey: configKey,
        backupKey,
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: `Config not found for tenant: ${tenantId}`,
      });
    }
  } catch (error: unknown) {
    console.error('Error deleting config:', error);
    res.status(500).json({
      error: 'Failed to delete config',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

/**
 * Error handler
 */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

/**
 * Start server
 */
async function startServer() {
  // Bind to loopback only — never expose this unauthenticated, real-S3 server
  // to the LAN.
  app.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('Picasso Config Builder - Local Development Server (S3)');
    console.log('='.repeat(60));
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`S3 Bucket: ${S3_BUCKET}`);
    console.log(`AWS Region: ${AWS_REGION}`);
    console.log(`AWS Profile: ${AWS_PROFILE}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET    http://localhost:${PORT}/health`);
    console.log(`  GET    http://localhost:${PORT}/config/tenants`);
    console.log(`  GET    http://localhost:${PORT}/config/:tenantId`);
    console.log(`  PUT    http://localhost:${PORT}/config/:tenantId`);
    console.log(`  DELETE http://localhost:${PORT}/config/:tenantId`);
    console.log('='.repeat(60));
    console.log('');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
