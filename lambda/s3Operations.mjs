/**
 * S3 Operations Module
 * Handles all S3 interactions for tenant configuration management
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

import crypto from 'crypto';

const BUCKET = process.env.S3_BUCKET || 'myrecruiter-picasso';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({ region: REGION });

/**
 * Stream to string helper
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * List all tenant configurations in the bucket
 * @returns {Promise<Array>} Array of tenant metadata
 */
export async function listTenantConfigs() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'tenants/',
      Delimiter: '/',
    });

    const response = await s3Client.send(command);

    if (!response.CommonPrefixes) {
      return [];
    }

    // List all tenant folders
    const tenantIds = response.CommonPrefixes.map(prefix => {
      const match = prefix.Prefix.match(/^tenants\/([^/]+)\/$/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Get metadata for each tenant
    const tenants = [];
    for (const tenantId of tenantIds) {
      try {
        const metadata = await getTenantMetadata(tenantId);
        tenants.push({
          tenantId,
          ...metadata,
        });
      } catch (error) {
        console.warn(`Could not load metadata for ${tenantId}:`, error.message);
      }
    }

    return tenants;
  } catch (error) {
    console.error('Error listing tenant configs:', error);
    throw new Error(`Failed to list tenant configs: ${error.message}`);
  }
}

/**
 * Load a tenant configuration from S3
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} The tenant configuration object
 */
export async function loadConfig(tenantId) {
  try {
    const key = `tenants/${tenantId}/${tenantId}-config.json`;
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    const configString = await streamToString(response.Body);
    const config = JSON.parse(configString);

    return config;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      throw new Error(`Config not found for tenant: ${tenantId}`);
    }
    console.error(`Error loading config for ${tenantId}:`, error);
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

/**
 * Get tenant metadata without loading full config
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Tenant metadata
 */
export async function getTenantMetadata(tenantId) {
  try {
    const config = await loadConfig(tenantId);

    return {
      tenant_id: config.tenant_id,
      version: config.version,
      chat_title: config.chat_title,
      company_name: config.company_name || config.chat_title,
      last_updated: config.last_updated || null,
      program_count: Object.keys(config.programs || {}).length,
      form_count: Object.keys(config.conversational_forms || {}).length,
      cta_count: Object.keys(config.cta_definitions || {}).length,
      branch_count: Object.keys(config.conversation_branches || {}).length,
    };
  } catch (error) {
    console.error(`Error getting metadata for ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Save a tenant configuration to S3
 * @param {string} tenantId - The tenant ID
 * @param {Object} config - The configuration object
 * @param {boolean} createBackup - Whether to create a backup before saving
 * @returns {Promise<Object>} Save result
 */
export async function saveConfig(tenantId, config, createBackup = true) {
  try {
    // Create backup if requested and config exists
    if (createBackup) {
      try {
        const existingConfig = await loadConfig(tenantId);
        await createConfigBackup(tenantId, existingConfig);
      } catch (error) {
        // If config doesn't exist, no backup needed
        if (!error.message.includes('not found')) {
          console.warn(`Failed to create backup: ${error.message}`);
        }
      }
    }

    // Add metadata
    config.last_updated = new Date().toISOString();
    config.tenant_id = tenantId;

    // Save to S3
    const key = `tenants/${tenantId}/${tenantId}-config.json`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);

    return {
      success: true,
      tenantId,
      key,
      timestamp: config.last_updated,
    };
  } catch (error) {
    console.error(`Error saving config for ${tenantId}:`, error);
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

/**
 * Create a backup of a tenant configuration
 * Backups are now stored in the tenant's folder for better organization
 * @param {string} tenantId - The tenant ID
 * @param {Object} config - The configuration object
 * @returns {Promise<string>} The backup key
 */
export async function createConfigBackup(tenantId, config) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // Store backup in tenant's folder instead of centralized backups/ folder
    const backupKey = `tenants/${tenantId}/${tenantId}-${timestamp}.json`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: backupKey,
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);

    return backupKey;
  } catch (error) {
    console.error(`Error creating backup for ${tenantId}:`, error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Delete a tenant configuration from S3
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteConfig(tenantId) {
  try {
    // Create backup before deleting
    const config = await loadConfig(tenantId);
    const backupKey = await createConfigBackup(tenantId, config);

    // Delete the config
    const key = `tenants/${tenantId}/${tenantId}-config.json`;
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
      tenantId,
      deletedKey: key,
      backupKey,
    };
  } catch (error) {
    console.error(`Error deleting config for ${tenantId}:`, error);
    throw new Error(`Failed to delete config: ${error.message}`);
  }
}

/**
 * Build the S3 key for a tenant's draft config
 * @param {string} tenantId
 * @returns {string}
 */
function draftKey(tenantId) {
  return `tenants/${tenantId}/${tenantId}-draft.json`;
}

/**
 * Load a tenant's draft config from S3.
 * Returns { hasDraft: false } when no draft exists (NoSuchKey is not an error).
 * @param {string} tenantId
 * @returns {Promise<{ hasDraft: boolean, config?: Object, lastSaved?: string }>}
 */
export async function loadDraft(tenantId) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: draftKey(tenantId),
    });
    const response = await s3Client.send(command);
    const configString = await streamToString(response.Body);
    const config = JSON.parse(configString);
    const lastSaved =
      response.LastModified instanceof Date
        ? response.LastModified.toISOString()
        : new Date().toISOString();
    return { hasDraft: true, config, lastSaved };
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return { hasDraft: false };
    }
    console.error(`Error loading draft for ${tenantId}:`, error);
    throw new Error(`Failed to load draft: ${error.message}`);
  }
}

/**
 * Persist a tenant's draft config to S3.
 * No backup is created — drafts are intermediate, last-write-wins.
 * @param {string} tenantId
 * @param {Object} config
 * @returns {Promise<{ success: true, lastSaved: string }>}
 */
export async function saveDraft(tenantId, config) {
  try {
    const lastSaved = new Date().toISOString();
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: draftKey(tenantId),
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
    });
    await s3Client.send(command);
    return { success: true, lastSaved };
  } catch (error) {
    console.error(`Error saving draft for ${tenantId}:`, error);
    throw new Error(`Failed to save draft: ${error.message}`);
  }
}

/**
 * Delete a tenant's draft config. Idempotent — missing key is not an error.
 * @param {string} tenantId
 * @returns {Promise<{ success: true }>}
 */
export async function deleteDraft(tenantId) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: draftKey(tenantId),
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return { success: true };
    }
    console.error(`Error deleting draft for ${tenantId}:`, error);
    throw new Error(`Failed to delete draft: ${error.message}`);
  }
}

/**
 * Permanently delete a tenant and all associated data
 * Removes config, all backups, and the hash mapping file
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Delete result summary
 */
export async function deleteTenantCompletely(tenantId) {
  try {
    // Regenerate the hash to find the mapping file
    const tenantHash = generateTenantHash(tenantId);

    // List ALL objects under tenants/{tenantId}/
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `tenants/${tenantId}/`,
    });
    const listResponse = await s3Client.send(listCommand);

    let deletedFiles = 0;

    // Batch-delete all tenant files (config + backups)
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
          Quiet: false,
        },
      });
      const deleteResult = await s3Client.send(deleteCommand);
      deletedFiles = deleteResult.Deleted?.length || 0;
      console.log(`Deleted ${deletedFiles} files from tenants/${tenantId}/`);
    }

    // Delete the hash mapping file
    const mappingKey = `mappings/${tenantHash}.json`;
    const deleteMappingCommand = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: mappingKey,
    });
    await s3Client.send(deleteMappingCommand);
    console.log(`Deleted mapping: ${mappingKey}`);

    return {
      success: true,
      tenantId,
      tenantHash,
      deletedFiles,
      deletedMapping: mappingKey,
    };
  } catch (error) {
    console.error(`Error completely deleting tenant ${tenantId}:`, error);
    throw new Error(`Failed to delete tenant completely: ${error.message}`);
  }
}

/**
 * List backups for a tenant
 * Reads backups from tenant's folder (new location)
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Array>} Array of backup metadata
 */
export async function listBackups(tenantId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `tenants/${tenantId}/`,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    // Filter to only backup files (exclude the main config file)
    // Backup files have format: tenantId-YYYY-MM-DDTHH-MM-SS-MMMZ.json
    // Main config has format: tenantId-config.json
    return response.Contents
      .filter(item => {
        const key = item.Key;
        return key.endsWith('.json') && !key.endsWith('-config.json');
      })
      .map(item => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
      }))
      .sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error(`Error listing backups for ${tenantId}:`, error);
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Generate a tenant hash from a tenant ID
 * Must produce identical output to deploy_tenant_stack/lambda_function.py:generate_tenant_hash
 * @param {string} tenantId - The tenant ID
 * @returns {string} The tenant hash (e.g., "de1a2b3c4d5e6f")
 */
export function generateTenantHash(tenantId) {
  const salt = 'picasso-2024-universal-widget';
  const hashInput = `${tenantId}${salt}`;
  const fullHash = crypto.createHash('sha256').update(hashInput, 'utf-8').digest('hex');
  const shortHash = fullHash.slice(0, 12);
  const prefix = tenantId.slice(0, 2).toLowerCase();
  return `${prefix}${shortHash}`;
}

/**
 * Create a tenant hash mapping file in S3
 * Maps tenant_hash → tenant_id for reverse lookup by the widget
 * @param {string} tenantId - The tenant ID
 * @param {string} tenantHash - The generated tenant hash
 * @returns {Promise<Object>} Result with mapping key
 */
export async function createTenantMapping(tenantId, tenantHash) {
  try {
    const mappingData = {
      tenant_id: tenantId,
      tenant_hash: tenantHash,
      created_at: Math.floor(Date.now() / 1000),
      created_by: 'config_manager',
      version: '1.0',
    };

    const mappingKey = `mappings/${tenantHash}.json`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: mappingKey,
      Body: JSON.stringify(mappingData, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);

    return {
      success: true,
      mappingKey,
    };
  } catch (error) {
    console.error(`Error creating mapping for ${tenantId}:`, error);
    throw new Error(`Failed to create tenant mapping: ${error.message}`);
  }
}
