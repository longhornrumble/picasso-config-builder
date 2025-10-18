/**
 * Mock Server for E2E Tests
 * Provides a lightweight mock backend for testing without S3 dependency
 */

import express, { Express } from 'express';
import { MOCK_TENANT_LIST, MOCK_TEST001_CONFIG } from './test-data';

let app: Express | null = null;
let server: any = null;

/**
 * In-memory storage for configs during tests
 */
const configStore = new Map<string, any>([
  ['TEST001', JSON.parse(JSON.stringify(MOCK_TEST001_CONFIG))],
]);

/**
 * Start mock server
 */
export function startMockServer(port = 3001): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      console.log('Mock server already running');
      resolve();
      return;
    }

    app = express();
    app.use(express.json({ limit: '10mb' }));

    // CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        return res.status(200).json({ message: 'OK' });
      }

      next();
    });

    // Logging
    app.use((req, _res, next) => {
      console.log(`[MOCK] ${req.method} ${req.path}`);
      next();
    });

    // Root endpoint
    app.get('/', (_req, res) => {
      res.json({
        service: 'Picasso Config Manager - Mock Server',
        version: '1.0.0',
        mode: 'test',
        timestamp: new Date().toISOString(),
      });
    });

    // Health check
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'picasso-config-manager-mock',
        timestamp: new Date().toISOString(),
      });
    });

    // List tenants
    app.get('/config/tenants', (_req, res) => {
      res.json({
        tenants: MOCK_TENANT_LIST,
        count: MOCK_TENANT_LIST.length,
      });
    });

    // Get tenant metadata
    app.get('/config/:tenantId/metadata', (req, res) => {
      const { tenantId } = req.params;
      const tenant = MOCK_TENANT_LIST.find(t => t.tenantId === tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId,
        });
      }

      res.json(tenant);
    });

    // Load config
    app.get('/config/:tenantId', (req, res) => {
      const { tenantId } = req.params;
      const config = configStore.get(tenantId);

      if (!config) {
        return res.status(404).json({
          error: 'Configuration not found',
          tenantId,
        });
      }

      // Return only editable sections if requested
      if (req.query.editable_only === 'true') {
        const { programs, conversational_forms, ctas, branches, content_showcase, form_settings } = config;
        return res.json({
          version: config.version,
          tenantId: config.tenantId,
          programs: programs || {},
          conversational_forms: conversational_forms || {},
          ctas: ctas || {},
          branches: branches || {},
          content_showcase: content_showcase || [],
          form_settings: form_settings || {},
        });
      }

      res.json(config);
    });

    // Save config
    app.put('/config/:tenantId', (req, res) => {
      const { tenantId } = req.params;
      const config = req.body;

      // Validate config has required fields
      if (!config.version || !config.tenantId) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: 'Missing required fields: version, tenantId',
        });
      }

      // Store config
      configStore.set(tenantId, {
        ...config,
        metadata: {
          ...config.metadata,
          lastModified: new Date().toISOString(),
          modifiedBy: 'test-user',
        },
      });

      res.json({
        success: true,
        message: 'Configuration saved successfully',
        tenantId,
        timestamp: new Date().toISOString(),
      });
    });

    // Delete config (for testing)
    app.delete('/config/:tenantId', (req, res) => {
      const { tenantId } = req.params;

      if (!configStore.has(tenantId)) {
        return res.status(404).json({
          error: 'Configuration not found',
          tenantId,
        });
      }

      configStore.delete(tenantId);

      res.json({
        success: true,
        message: 'Configuration deleted successfully',
        tenantId,
      });
    });

    // Get sections info
    app.get('/sections', (_req, res) => {
      res.json({
        sections: [
          { id: 'programs', name: 'Programs', description: 'Manage programs' },
          { id: 'forms', name: 'Forms', description: 'Manage conversational forms' },
          { id: 'ctas', name: 'CTAs', description: 'Manage call-to-action buttons' },
          { id: 'branches', name: 'Branches', description: 'Manage conversation branches' },
          { id: 'content_showcase', name: 'Content Showcase', description: 'Manage content cards' },
        ],
      });
    });

    // Reset endpoint for tests
    app.post('/test/reset', (_req, res) => {
      configStore.clear();
      configStore.set('TEST001', JSON.parse(JSON.stringify(MOCK_TEST001_CONFIG)));

      res.json({
        success: true,
        message: 'Mock server reset to initial state',
      });
    });

    // Start server
    server = app.listen(port, () => {
      console.log(`Mock server running on http://localhost:${port}`);
      resolve();
    });

    server.on('error', (error: Error) => {
      reject(error);
    });
  });
}

/**
 * Stop mock server
 */
export function stopMockServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Mock server stopped');
        server = null;
        app = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Reset mock server state
 */
export async function resetMockServer() {
  if (!app) {
    throw new Error('Mock server not running');
  }

  configStore.clear();
  configStore.set('TEST001', JSON.parse(JSON.stringify(MOCK_TEST001_CONFIG)));
}

/**
 * Get config from store (for test assertions)
 */
export function getConfigFromStore(tenantId: string) {
  return configStore.get(tenantId);
}
