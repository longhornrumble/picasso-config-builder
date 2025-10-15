#!/usr/bin/env node
/**
 * Phase 5 Validation Script
 * Validates S3 integration implementation
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const REQUIRED_FILES = [
  // Lambda files
  'lambda/package.json',
  'lambda/index.mjs',
  'lambda/s3Operations.mjs',
  'lambda/mergeStrategy.mjs',
  'lambda/README.md',

  // Dev server
  'src/lib/api/localDevServer.ts',

  // Mock S3
  'mock-s3/TEST001-config.json',
  'mock-s3/TEST002-config.json',
  'mock-s3/backups/.gitkeep',

  // Documentation
  'docs/PHASE_5_S3_INTEGRATION.md',
];

const REQUIRED_LAMBDA_EXPORTS = [
  'listTenantConfigs',
  'loadConfig',
  'getTenantMetadata',
  'saveConfig',
  'deleteConfig',
  'createConfigBackup',
  'listBackups',
];

const REQUIRED_MERGE_EXPORTS = [
  'mergeConfigSections',
  'extractEditableSections',
  'validateEditedSections',
  'getSectionInfo',
  'generateConfigDiff',
];

const REQUIRED_NPM_SCRIPTS = [
  'server:dev',
  'server:prod',
];

let errors = 0;
let warnings = 0;

function error(message) {
  console.error(`❌ ERROR: ${message}`);
  errors++;
}

function warning(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  warnings++;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

console.log('');
console.log('='.repeat(60));
console.log('Phase 5: S3 Integration - Validation');
console.log('='.repeat(60));
console.log('');

// Check required files
info('Checking required files...');
for (const file of REQUIRED_FILES) {
  const filePath = join(rootDir, file);
  if (existsSync(filePath)) {
    success(`Found: ${file}`);
  } else {
    error(`Missing: ${file}`);
  }
}
console.log('');

// Check package.json scripts
info('Checking npm scripts...');
try {
  const packageJson = JSON.parse(
    await readFile(join(rootDir, 'package.json'), 'utf-8')
  );

  for (const script of REQUIRED_NPM_SCRIPTS) {
    if (packageJson.scripts[script]) {
      success(`Script found: ${script}`);
    } else {
      error(`Missing script: ${script}`);
    }
  }

  // Check for required dependencies
  const hasExpress = packageJson.devDependencies?.express || packageJson.dependencies?.express;
  const hasTsx = packageJson.devDependencies?.tsx || packageJson.dependencies?.tsx;

  if (hasExpress) {
    success('Express dependency found');
  } else {
    error('Express dependency missing');
  }

  if (hasTsx) {
    success('tsx dependency found');
  } else {
    warning('tsx dependency missing (needed for server:dev)');
  }
} catch (err) {
  error(`Failed to read package.json: ${err.message}`);
}
console.log('');

// Check Lambda exports
info('Checking Lambda s3Operations exports...');
try {
  const s3Ops = await readFile(join(rootDir, 'lambda/s3Operations.mjs'), 'utf-8');

  for (const exportName of REQUIRED_LAMBDA_EXPORTS) {
    if (s3Ops.includes(`export async function ${exportName}`) ||
        s3Ops.includes(`export function ${exportName}`)) {
      success(`Export found: ${exportName}`);
    } else {
      error(`Missing export: ${exportName}`);
    }
  }
} catch (err) {
  error(`Failed to read s3Operations.mjs: ${err.message}`);
}
console.log('');

// Check merge strategy exports
info('Checking mergeStrategy exports...');
try {
  const mergeStrat = await readFile(join(rootDir, 'lambda/mergeStrategy.mjs'), 'utf-8');

  for (const exportName of REQUIRED_MERGE_EXPORTS) {
    if (mergeStrat.includes(`export function ${exportName}`) ||
        mergeStrat.includes(`export const ${exportName}`)) {
      success(`Export found: ${exportName}`);
    } else {
      error(`Missing export: ${exportName}`);
    }
  }

  // Check for section constants
  if (mergeStrat.includes('EDITABLE_SECTIONS')) {
    success('EDITABLE_SECTIONS constant defined');
  } else {
    error('EDITABLE_SECTIONS constant missing');
  }

  if (mergeStrat.includes('READ_ONLY_SECTIONS')) {
    success('READ_ONLY_SECTIONS constant defined');
  } else {
    error('READ_ONLY_SECTIONS constant missing');
  }
} catch (err) {
  error(`Failed to read mergeStrategy.mjs: ${err.message}`);
}
console.log('');

// Check Lambda handler
info('Checking Lambda handler...');
try {
  const handler = await readFile(join(rootDir, 'lambda/index.mjs'), 'utf-8');

  if (handler.includes('export const handler')) {
    success('Lambda handler export found');
  } else {
    error('Lambda handler export missing');
  }

  const requiredRoutes = [
    '/health',
    '/config/tenants',
    '/config/{tenantId}',
    '/config/{tenantId}/metadata',
    '/config/{tenantId}/backups',
    '/sections',
  ];

  for (const route of requiredRoutes) {
    const routePattern = route.replace('{tenantId}', '(.+)');
    if (handler.includes(route) || handler.includes(routePattern)) {
      success(`Route found: ${route}`);
    } else {
      warning(`Route may be missing: ${route}`);
    }
  }
} catch (err) {
  error(`Failed to read index.mjs: ${err.message}`);
}
console.log('');

// Check sample configs
info('Checking sample tenant configs...');
try {
  const test001 = JSON.parse(
    await readFile(join(rootDir, 'mock-s3/TEST001-config.json'), 'utf-8')
  );

  if (test001.tenant_id === 'TEST001') {
    success('TEST001 config is valid');
  } else {
    error('TEST001 config has incorrect tenant_id');
  }

  // Check for required sections
  const requiredSections = ['programs', 'conversational_forms', 'cta_definitions', 'conversation_branches'];
  for (const section of requiredSections) {
    if (test001[section]) {
      success(`TEST001 has ${section} section`);
    } else {
      warning(`TEST001 missing ${section} section`);
    }
  }

  const test002 = JSON.parse(
    await readFile(join(rootDir, 'mock-s3/TEST002-config.json'), 'utf-8')
  );

  if (test002.tenant_id === 'TEST002') {
    success('TEST002 config is valid');
  } else {
    error('TEST002 config has incorrect tenant_id');
  }
} catch (err) {
  error(`Failed to validate sample configs: ${err.message}`);
}
console.log('');

// Check local dev server
info('Checking local development server...');
try {
  const devServer = await readFile(join(rootDir, 'src/lib/api/localDevServer.ts'), 'utf-8');

  if (devServer.includes('express()')) {
    success('Express app initialized');
  } else {
    error('Express app not initialized');
  }

  if (devServer.includes('app.listen')) {
    success('Server listen call found');
  } else {
    error('Server listen call missing');
  }

  const requiredEndpoints = [
    'app.get(\'/health\'',
    'app.get(\'/config/tenants\'',
    'app.get(\'/config/:tenantId\'',
    'app.put(\'/config/:tenantId\'',
    'app.delete(\'/config/:tenantId\'',
  ];

  for (const endpoint of requiredEndpoints) {
    if (devServer.includes(endpoint)) {
      success(`Endpoint found: ${endpoint}`);
    } else {
      warning(`Endpoint may be missing: ${endpoint}`);
    }
  }

  // Check CORS
  if (devServer.includes('Access-Control-Allow-Origin')) {
    success('CORS headers configured');
  } else {
    warning('CORS headers may not be configured');
  }
} catch (err) {
  error(`Failed to check local dev server: ${err.message}`);
}
console.log('');

// Summary
console.log('='.repeat(60));
console.log('Validation Summary');
console.log('='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Phase 5 implementation is complete.');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found`);
  }
  console.log('');
  console.log('Please address the issues above before proceeding.');
}

console.log('');

process.exit(errors > 0 ? 1 : 0);
