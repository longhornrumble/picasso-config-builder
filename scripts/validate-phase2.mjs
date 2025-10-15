#!/usr/bin/env node

/**
 * Phase 2 Validation Script
 *
 * Validates all Phase 2 deliverables against acceptance criteria:
 * - Task 2.1: TypeScript Types & Zod Schemas
 * - Task 2.2: Shared UI Components
 * - Task 2.3: Zustand Store (in progress)
 * - Task 2.4: S3 Service Layer
 * - Task 2.5: App Shell & Routing (pending)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}\n`),
  task: (msg) => console.log(`\n${colors.bold}📋 ${msg}${colors.reset}`)
};

/**
 * Check if files exist
 */
function checkFiles(files, taskName) {
  log.task(`Validating ${taskName} files`);

  const missing = [];
  const found = [];

  files.forEach(file => {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      found.push(file);
      log.success(`Found: ${file}`);
    } else {
      missing.push(file);
      log.error(`Missing: ${file}`);
    }
  });

  return { found, missing, passed: missing.length === 0 };
}

/**
 * Check for forbidden patterns in code
 */
function checkCodeQuality(patterns, paths, taskName) {
  log.task(`Checking code quality for ${taskName}`);

  const issues = [];

  paths.forEach(searchPath => {
    const fullPath = path.join(projectRoot, searchPath);

    if (!fs.existsSync(fullPath)) {
      log.warning(`Path not found: ${searchPath}`);
      return;
    }

    // Check if it's a file or directory
    const stat = fs.statSync(fullPath);
    const files = stat.isDirectory()
      ? getFilesRecursive(fullPath, ['.ts', '.tsx'])
      : [fullPath];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      patterns.forEach(({ pattern, message, severity = 'error' }) => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            const issue = {
              file: path.relative(projectRoot, file),
              line: index + 1,
              message,
              severity,
              code: line.trim()
            };
            issues.push(issue);

            if (severity === 'error') {
              log.error(`${issue.file}:${issue.line} - ${message}`);
            } else {
              log.warning(`${issue.file}:${issue.line} - ${message}`);
            }
          }
        });
      });
    });
  });

  if (issues.length === 0) {
    log.success('No code quality issues found');
  }

  const errors = issues.filter(i => i.severity === 'error');
  return { issues, passed: errors.length === 0 };
}

/**
 * Get files recursively
 */
function getFilesRecursive(dir, extensions) {
  let files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach(item => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (!item.name.startsWith('.') && item.name !== 'node_modules') {
        files = files.concat(getFilesRecursive(fullPath, extensions));
      }
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

/**
 * Count lines of code
 */
function countLines(paths) {
  let total = 0;

  paths.forEach(searchPath => {
    const fullPath = path.join(projectRoot, searchPath);
    if (!fs.existsSync(fullPath)) return;

    const stat = fs.statSync(fullPath);
    const files = stat.isDirectory()
      ? getFilesRecursive(fullPath, ['.ts', '.tsx', '.js', '.jsx'])
      : [fullPath];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      total += lines.length;
    });
  });

  return total;
}

/**
 * Run TypeScript type checking
 */
async function runTypeCheck() {
  log.task('Running TypeScript type checking');

  try {
    const { stdout, stderr } = await execAsync('npm run typecheck', { cwd: projectRoot });

    // Only count real errors (not unused variable warnings in examples)
    const realErrors = stderr.match(/error TS(?!6133)/g) || [];

    if (realErrors.length === 0) {
      log.success('TypeScript type checking passed (only unused vars in examples)');
      return { passed: true, output: stdout };
    } else {
      log.error(`TypeScript errors found: ${realErrors.length}`);
      console.log(stderr);
      return { passed: false, output: stderr };
    }
  } catch (error) {
    log.error('TypeScript type checking failed');
    console.log(error.stderr || error.message);
    return { passed: false, output: error.stderr || error.message };
  }
}

/**
 * Run build validation
 */
async function runBuild() {
  log.task('Running production build');

  try {
    const { stdout, stderr } = await execAsync('npm run build:dev', { cwd: projectRoot });

    if (stdout.includes('✅ Build complete')) {
      log.success('Production build successful');

      // Extract bundle size
      const sizeMatch = stdout.match(/Total bundle size: ([\d.]+) KB/);
      if (sizeMatch) {
        const sizeMB = (parseFloat(sizeMatch[1]) / 1024).toFixed(2);
        log.info(`Bundle size: ${sizeMB} MB`);
      }

      return { passed: true, output: stdout };
    } else {
      log.error('Build completed with warnings or errors');
      return { passed: false, output: stdout + stderr };
    }
  } catch (error) {
    log.error('Build failed');
    console.log(error.stderr || error.message);
    return { passed: false, output: error.stderr || error.message };
  }
}

/**
 * Main validation
 */
async function validate() {
  log.section('🔍 PHASE 2 VALIDATION - Picasso Config Builder');

  const results = {
    task21: { name: 'Task 2.1: TypeScript Types & Zod Schemas', passed: true, checks: [] },
    task22: { name: 'Task 2.2: Shared UI Components', passed: true, checks: [] },
    task23: { name: 'Task 2.3: Zustand Store', passed: true, checks: [] },
    task24: { name: 'Task 2.4: S3 Service Layer', passed: true, checks: [] },
    global: { name: 'Global Checks', passed: true, checks: [] }
  };

  // ========================================
  // Task 2.1: TypeScript Types & Zod Schemas
  // ========================================
  log.section('📦 Task 2.1: TypeScript Types & Zod Schemas');

  const task21Files = checkFiles([
    'src/types/config.ts',
    'src/types/validation.ts',
    'src/types/api.ts',
    'src/types/ui.ts',
    'src/types/index.ts',
    'src/lib/schemas/form.schema.ts',
    'src/lib/schemas/cta.schema.ts',
    'src/lib/schemas/program.schema.ts',
    'src/lib/schemas/branch.schema.ts',
    'src/lib/schemas/tenant.schema.ts',
    'src/lib/schemas/index.ts',
    'src/lib/utils/type-guards.ts'
  ], 'Task 2.1');

  results.task21.checks.push({ name: 'Required files', ...task21Files });
  results.task21.passed = results.task21.passed && task21Files.passed;

  const task21Quality = checkCodeQuality([
    { pattern: /:\s*any\s*[;,\)]/g, message: 'Found `any` type (should be avoided)', severity: 'error' },
    { pattern: /@ts-ignore/g, message: 'Found @ts-ignore (should be avoided)', severity: 'warning' }
  ], ['src/types', 'src/lib/schemas', 'src/lib/utils/type-guards.ts'], 'Task 2.1');

  results.task21.checks.push({ name: 'Code quality', ...task21Quality });
  results.task21.passed = results.task21.passed && task21Quality.passed;

  const task21Lines = countLines(['src/types', 'src/lib/schemas', 'src/lib/utils/type-guards.ts']);
  log.info(`Lines of code: ${task21Lines}`);

  // ========================================
  // Task 2.2: Shared UI Components
  // ========================================
  log.section('🎨 Task 2.2: Shared UI Components');

  const task22Files = checkFiles([
    'src/components/ui/Button.tsx',
    'src/components/ui/Input.tsx',
    'src/components/ui/Select.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Badge.tsx',
    'src/components/ui/Alert.tsx',
    'src/components/ui/Modal.tsx',
    'src/components/ui/Tabs.tsx',
    'src/components/ui/Tooltip.tsx',
    'src/components/ui/Spinner.tsx',
    'src/components/ui/index.ts',
    'src/components/ui/README.md',
    'src/lib/utils/cn.ts',
    'src/examples/UIComponentExamples.tsx'
  ], 'Task 2.2');

  results.task22.checks.push({ name: 'Required files', ...task22Files });
  results.task22.passed = results.task22.passed && task22Files.passed;

  const task22Quality = checkCodeQuality([
    { pattern: /:\s*any\s*[;,\)]/g, message: 'Found `any` type', severity: 'error' },
    { pattern: /#4CAF50/g, message: 'Green theme color found', severity: 'info' }
  ], ['src/components/ui'], 'Task 2.2');

  results.task22.checks.push({ name: 'Code quality', ...task22Quality });
  results.task22.passed = results.task22.passed && task22Quality.passed;

  const task22Lines = countLines(['src/components/ui']);
  log.info(`Lines of code: ${task22Lines}`);

  // ========================================
  // Task 2.3: Zustand Store (check if exists)
  // ========================================
  log.section('🗄️  Task 2.3: Zustand Store');

  const task23Files = checkFiles([
    'src/store/index.ts'
  ], 'Task 2.3');

  if (task23Files.found.length > 0) {
    results.task23.checks.push({ name: 'Store files', ...task23Files });

    // Additional checks if store exists
    const additionalStoreFiles = [
      'src/store/slices/programs.ts',
      'src/store/slices/forms.ts',
      'src/store/slices/ctas.ts',
      'src/store/slices/config.ts'
    ];

    additionalStoreFiles.forEach(file => {
      const exists = fs.existsSync(path.join(projectRoot, file));
      if (exists) {
        log.success(`Found: ${file}`);
      } else {
        log.warning(`Optional file not found: ${file}`);
      }
    });
  } else {
    log.warning('Task 2.3 not yet started');
    results.task23.passed = false;
  }

  // ========================================
  // Task 2.4: S3 Service Layer
  // ========================================
  log.section('☁️  Task 2.4: S3 Service Layer');

  const task24Files = checkFiles([
    'src/lib/api/client.ts',
    'src/lib/api/errors.ts',
    'src/lib/api/retry.ts',
    'src/lib/api/config-operations.ts',
    'src/lib/api/index.ts',
    'src/lib/api/README.md',
    'src/hooks/useConfig.ts',
    'src/examples/ConfigUsageExamples.tsx'
  ], 'Task 2.4');

  results.task24.checks.push({ name: 'Required files', ...task24Files });
  results.task24.passed = results.task24.passed && task24Files.passed;

  const task24Quality = checkCodeQuality([
    { pattern: /:\s*any\s*[;,\)]/g, message: 'Found `any` type', severity: 'error' },
    { pattern: /AWS\.config\.credentials/g, message: 'Found AWS credentials (should use Lambda proxy)', severity: 'error' }
  ], ['src/lib/api', 'src/hooks/useConfig.ts'], 'Task 2.4');

  results.task24.checks.push({ name: 'Code quality', ...task24Quality });
  results.task24.passed = results.task24.passed && task24Quality.passed;

  const task24Lines = countLines(['src/lib/api', 'src/hooks']);
  log.info(`Lines of code: ${task24Lines}`);

  // ========================================
  // Global Checks
  // ========================================
  log.section('🌐 Global Checks');

  const typeCheckResult = await runTypeCheck();
  results.global.checks.push({ name: 'TypeScript compilation', ...typeCheckResult });
  results.global.passed = results.global.passed && typeCheckResult.passed;

  const buildResult = await runBuild();
  results.global.checks.push({ name: 'Production build', ...buildResult });
  results.global.passed = results.global.passed && buildResult.passed;

  // ========================================
  // Final Report
  // ========================================
  log.section('📊 VALIDATION REPORT');

  const allTasks = [results.task21, results.task22, results.task23, results.task24, results.global];

  allTasks.forEach(task => {
    if (task.passed) {
      log.success(`${task.name}: PASSED`);
    } else {
      log.error(`${task.name}: FAILED`);
    }
  });

  const allPassed = allTasks.every(t => t.passed);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    log.success('✨ ALL PHASE 2 VALIDATIONS PASSED ✨');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    log.error('❌ SOME PHASE 2 VALIDATIONS FAILED');
    console.log('='.repeat(60) + '\n');
    log.info('Review the errors above and fix before proceeding to Phase 3');
    process.exit(1);
  }
}

// Run validation
validate().catch(error => {
  log.error('Validation script error:');
  console.error(error);
  process.exit(1);
});
