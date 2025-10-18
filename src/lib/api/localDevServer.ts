/**
 * Local Development Server for Config Builder
 * Mimics Lambda behavior using local file system instead of S3
 *
 * Run with: npm run server:dev
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.DEV_SERVER_PORT || 3001;

// Mock S3 directory
const MOCK_S3_DIR = path.join(process.cwd(), 'mock-s3');

// Ensure mock-s3 directory exists
async function ensureMockS3Dir() {
  try {
    await fs.access(MOCK_S3_DIR);
  } catch {
    await fs.mkdir(MOCK_S3_DIR, { recursive: true });
    await fs.mkdir(path.join(MOCK_S3_DIR, 'backups'), { recursive: true });
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'picasso-config-manager-local',
    timestamp: new Date().toISOString(),
    mode: 'development',
  });
});

/**
 * List all tenant configs
 * GET /config/tenants
 */
app.get('/config/tenants', async (_req, res) => {
  try {
    const files = await fs.readdir(MOCK_S3_DIR);

    const tenants = await Promise.all(
      files
        .filter(f => f.endsWith('-config.json'))
        .map(async (file) => {
          const tenantId = file.replace('-config.json', '');
          const filePath = path.join(MOCK_S3_DIR, file);
          const stats = await fs.stat(filePath);

          // Read config to get tenant name
          let tenantName = tenantId;
          try {
            const configData = await fs.readFile(filePath, 'utf-8');
            const config = JSON.parse(configData);
            tenantName = config.company_name || config.chat_title || tenantId;
          } catch {
            // If config can't be read, use tenantId as name
          }

          return {
            tenantId,
            tenantName,
            key: file,
            lastModified: stats.mtime,
            size: stats.size,
          };
        })
    );

    res.json({ tenants });
  } catch (error: unknown) {
    console.error('Error listing tenants:', error);
    res.status(500).json({
      error: 'Failed to list tenants',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get tenant metadata
 * GET /config/{tenantId}/metadata
 */
app.get('/config/:tenantId/metadata', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const configPath = path.join(MOCK_S3_DIR, `${tenantId}-config.json`);

    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const metadata = {
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

    res.json({ metadata });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({
        error: 'Not Found',
        message: `Config not found for tenant: ${req.params.tenantId}`,
      });
    }

    console.error('Error getting metadata:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List backups for a tenant
 * GET /config/{tenantId}/backups
 */
app.get('/config/:tenantId/backups', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const backupsDir = path.join(MOCK_S3_DIR, 'backups');

    const files = await fs.readdir(backupsDir);
    const backups = await Promise.all(
      files
        .filter(f => f.startsWith(`${tenantId}-`))
        .map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);

          return {
            key: `backups/${file}`,
            lastModified: stats.mtime,
            size: stats.size,
          };
        })
    );

    backups.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    res.json({ backups });
  } catch (error: unknown) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      error: 'Failed to list backups',
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

    const configPath = path.join(MOCK_S3_DIR, `${tenantId}-config.json`);
    const configData = await fs.readFile(configPath, 'utf-8');
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
        if (config.hasOwnProperty(field)) {
          editableConfig[field] = config[field];
        }
      });

      EDITABLE_SECTIONS.forEach(section => {
        if (config.hasOwnProperty(section)) {
          editableConfig[section] = config[section];
        }
      });

      config = editableConfig;
    }

    res.json({ config });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({
        error: 'Not Found',
        message: `Config not found for tenant: ${req.params.tenantId}`,
      });
    }

    console.error('Error loading config:', error);
    res.status(500).json({
      error: 'Failed to load config',
      message: error instanceof Error ? error.message : 'Unknown error',
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

    const configPath = path.join(MOCK_S3_DIR, `${tenantId}-config.json`);
    let finalConfig = editedConfig;

    // Create backup if requested and config exists
    if (create_backup) {
      try {
        const existingData = await fs.readFile(configPath, 'utf-8');
        const existingConfig = JSON.parse(existingData);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(MOCK_S3_DIR, 'backups', `${tenantId}-${timestamp}.json`);

        await fs.writeFile(backupPath, JSON.stringify(existingConfig, null, 2));
        console.log(`Created backup: ${backupPath}`);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn('Failed to create backup:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    // Merge with existing config if requested
    if (merge) {
      try {
        const existingData = await fs.readFile(configPath, 'utf-8');
        const baseConfig = JSON.parse(existingData);

        // Simple merge: overlay edited sections onto base
        finalConfig = { ...baseConfig, ...editedConfig };
        finalConfig.tenant_id = tenantId;
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
        // If config doesn't exist, use edited config as-is
        console.log('Creating new config (no existing config found)');
      }
    }

    // Add metadata
    finalConfig.last_updated = new Date().toISOString();
    finalConfig.tenant_id = tenantId;

    // Save config
    await fs.writeFile(configPath, JSON.stringify(finalConfig, null, 2));

    res.json({
      success: true,
      tenantId,
      key: `${tenantId}-config.json`,
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
    const configPath = path.join(MOCK_S3_DIR, `${tenantId}-config.json`);

    // Create backup before deleting
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(MOCK_S3_DIR, 'backups', `${tenantId}-${timestamp}.json`);

    await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

    // Delete the config
    await fs.unlink(configPath);

    res.json({
      success: true,
      tenantId,
      deletedKey: `${tenantId}-config.json`,
      backupKey: `backups/${tenantId}-${timestamp}.json`,
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(404).json({
        error: 'Not Found',
        message: `Config not found for tenant: ${req.params.tenantId}`,
      });
    }

    console.error('Error deleting config:', error);
    res.status(500).json({
      error: 'Failed to delete config',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get section information
 * GET /sections
 */
app.get('/sections', (_req, res) => {
  res.json({
    sections: {
      editable: [
        'programs',
        'conversational_forms',
        'cta_definitions',
        'conversation_branches',
      ],
      readOnly: [
        'branding',
        'features',
        'quick_help',
        'action_chips',
        'widget_behavior',
        'aws',
        'card_inventory',
      ],
      metadata: [
        'tenant_id',
        'version',
        'chat_title',
        'company_name',
        'last_updated',
      ],
    },
  });
});

/**
 * Root endpoint - API documentation
 * GET /
 */
app.get('/', (_req, res) => {
  res.json({
    service: 'Picasso Config Manager - Local Development Server',
    version: '1.0.0',
    mode: 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      tenants: {
        list: 'GET /config/tenants',
        metadata: 'GET /config/:tenantId/metadata',
        load: 'GET /config/:tenantId?editable_only=true',
        save: 'PUT /config/:tenantId',
        delete: 'DELETE /config/:tenantId',
        backups: 'GET /config/:tenantId/backups',
      },
      sections: 'GET /sections',
    },
    documentation: 'See docs/PHASE_5_S3_INTEGRATION.md for full API documentation',
    mockS3Directory: MOCK_S3_DIR,
  });
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
  await ensureMockS3Dir();

  app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('Picasso Config Builder - Local Development Server');
    console.log('='.repeat(60));
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Mock S3 directory: ${MOCK_S3_DIR}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET    http://localhost:${PORT}/health`);
    console.log(`  GET    http://localhost:${PORT}/config/tenants`);
    console.log(`  GET    http://localhost:${PORT}/config/:tenantId`);
    console.log(`  GET    http://localhost:${PORT}/config/:tenantId/metadata`);
    console.log(`  GET    http://localhost:${PORT}/config/:tenantId/backups`);
    console.log(`  PUT    http://localhost:${PORT}/config/:tenantId`);
    console.log(`  DELETE http://localhost:${PORT}/config/:tenantId`);
    console.log(`  GET    http://localhost:${PORT}/sections`);
    console.log('='.repeat(60));
    console.log('');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
