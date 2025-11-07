#!/usr/bin/env node

/**
 * Update CLAUDE.md automation script
 *
 * Features:
 * 1. Syncs npm scripts from package.json to Commands section
 * 2. Updates version number from package.json
 * 3. Updates "Last Updated" timestamp
 * 4. Validates CLAUDE.md structure
 *
 * Usage:
 *   node scripts/update-claude-md.mjs [--dry-run] [--verify-only]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CLAUDE_MD_PATH = path.join(ROOT_DIR, 'CLAUDE.md');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerifyOnly = args.includes('--verify-only');

/**
 * Read and parse package.json
 */
function readPackageJson() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error reading package.json:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Read CLAUDE.md
 */
function readClaudeMd() {
  try {
    return fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
  } catch (error) {
    console.error(`${colors.red}Error reading CLAUDE.md:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Write CLAUDE.md
 */
function writeClaudeMd(content) {
  try {
    fs.writeFileSync(CLAUDE_MD_PATH, content, 'utf8');
  } catch (error) {
    console.error(`${colors.red}Error writing CLAUDE.md:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Categorize npm scripts
 */
function categorizeScripts(scripts) {
  const categories = {
    development: [],
    building: [],
    testing: [],
    validation: [],
    quality: [],
    other: []
  };

  for (const [name, command] of Object.entries(scripts)) {
    if (name === 'dev' || name.startsWith('server:')) {
      categories.development.push({ name, command });
    } else if (name === 'build' || name.startsWith('build:')) {
      categories.building.push({ name, command });
    } else if (name === 'test' || name.startsWith('test:')) {
      categories.testing.push({ name, command });
    } else if (name === 'validate' || name.startsWith('validate:') || name === 'typecheck') {
      categories.validation.push({ name, command });
    } else if (name === 'lint' || name === 'format') {
      categories.quality.push({ name, command });
    } else {
      categories.other.push({ name, command });
    }
  }

  return categories;
}

/**
 * Generate Commands section markdown
 */
function generateCommandsSection(packageJson) {
  const categories = categorizeScripts(packageJson.scripts);

  let markdown = '## Commands\n\n';

  // Development
  if (categories.development.length > 0) {
    markdown += '### Development\n\n```bash\n';
    markdown += '# Install dependencies\n';
    markdown += 'npm install\n\n';

    for (const { name, command } of categories.development) {
      const description = getScriptDescription(name, command);
      markdown += `# ${description}\n`;
      markdown += `npm run ${name}`;
      if (name === 'dev') {
        markdown += '                    # Runs on http://localhost:3000';
      } else if (name === 'server:dev') {
        markdown += '             # S3-backed dev server on http://localhost:3001';
      } else if (name === 'server:dev:mock') {
        markdown += '        # Mock dev server (no S3 access)';
      }
      markdown += '\n';
    }
    markdown += '```\n\n';
  }

  // Building
  if (categories.building.length > 0) {
    markdown += '### Building\n\n```bash\n';
    for (const { name, command } of categories.building) {
      const description = getScriptDescription(name, command);
      markdown += `# ${description}\n`;
      markdown += `npm run ${name}`;

      // Add inline comments for key build commands
      const padding = ' '.repeat(Math.max(1, 30 - name.length));
      if (name === 'build') {
        markdown += `${padding}# Build for production`;
      } else if (name === 'build:production') {
        markdown += `${padding}# Explicit production build`;
      } else if (name === 'build:dev') {
        markdown += `${padding}# Build for development`;
      } else if (name === 'build:staging') {
        markdown += `${padding}# Build for staging`;
      } else if (name === 'build:analyze') {
        markdown += `${padding}# Build with bundle analysis`;
      }
      markdown += '\n';
    }
    markdown += '```\n\n';
  }

  // Testing
  if (categories.testing.length > 0) {
    markdown += '### Testing\n\n```bash\n';
    markdown += '# Unit/Integration tests (Vitest)\n';

    const vitestCommands = categories.testing.filter(s => !s.name.includes('e2e'));
    for (const { name, command } of vitestCommands) {
      const description = getScriptDescription(name, command);
      const padding = ' '.repeat(Math.max(1, 30 - name.length));
      markdown += `npm ${name === 'test' ? 'test' : `run ${name}`}${padding}# ${description}\n`;
    }

    markdown += '\n# E2E tests (Playwright)\n';
    const e2eCommands = categories.testing.filter(s => s.name.includes('e2e'));
    for (const { name, command } of e2eCommands) {
      const description = getScriptDescription(name, command);
      const padding = ' '.repeat(Math.max(1, 30 - name.length));
      markdown += `npm run ${name}${padding}# ${description}\n`;
    }

    if (categories.testing.find(s => s.name === 'test:all')) {
      markdown += '\n# All tests\n';
      markdown += 'npm run test:all               # Run all tests (unit + E2E)\n';
    }

    markdown += '```\n\n';
  }

  // Validation
  if (categories.validation.length > 0) {
    markdown += '### Validation\n\n```bash\n';
    for (const { name, command } of categories.validation) {
      const description = getScriptDescription(name, command);
      const padding = ' '.repeat(Math.max(1, 30 - name.length));
      markdown += `npm run ${name}${padding}# ${description}\n`;
    }
    markdown += '```\n\n';
  }

  // Code Quality
  if (categories.quality.length > 0) {
    markdown += '### Code Quality\n\n```bash\n';
    for (const { name, command } of categories.quality) {
      const description = getScriptDescription(name, command);
      const padding = ' '.repeat(Math.max(1, 30 - name.length));
      markdown += `npm run ${name}${padding}# ${description}\n`;
    }
    markdown += '```\n\n';
  }

  return markdown;
}

/**
 * Get human-readable description for a script
 */
function getScriptDescription(name, command) {
  const descriptions = {
    // Development
    'dev': 'Start development server',
    'server:dev': 'Start API dev server',
    'server:dev:mock': 'Start mock API server',
    'server:prod': 'Start production server',

    // Building
    'build': 'Build for production',
    'build:dev': 'Build for development',
    'build:staging': 'Build for staging',
    'build:production': 'Build for production',
    'build:analyze': 'Build with bundle analysis',

    // Testing
    'test': 'Run tests in watch mode',
    'test:ui': 'Run tests with Vitest UI',
    'test:run': 'Run tests once',
    'test:coverage': 'Generate coverage report',
    'test:e2e': 'Run all E2E tests',
    'test:e2e:headed': 'Run E2E tests with browser visible',
    'test:e2e:ui': 'Run E2E tests with Playwright UI',
    'test:e2e:chromium': 'Run E2E tests in Chromium only',
    'test:e2e:firefox': 'Run E2E tests in Firefox only',
    'test:e2e:webkit': 'Run E2E tests in WebKit only',
    'test:e2e:report': 'Show E2E test report',
    'test:all': 'Run all tests',

    // Validation
    'validate': 'Full validation (TypeCheck + Production build)',
    'validate:quick': 'Quick validation (TypeCheck + Dev build)',
    'validate:phase2': 'Validate Phase 2 components',
    'validate:phase3': 'Validate Phase 3 components',
    'validate:phase5': 'Validate Phase 5 S3 integration',
    'typecheck': 'TypeScript type checking only',

    // Quality
    'lint': 'ESLint code checking',
    'format': 'Format code with Prettier'
  };

  return descriptions[name] || command;
}

/**
 * Update version and last updated date
 */
function updateVersionAndDate(content, packageJson) {
  const version = packageJson.version || '0.1.0';
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Update version
  content = content.replace(
    /\*\*Version\*\*:\s*[\d.]+/,
    `**Version**: ${version}`
  );

  // Update last updated date
  content = content.replace(
    /\*\*Last Updated\*\*:\s*[\d-]+/,
    `**Last Updated**: ${currentDate}`
  );

  return content;
}

/**
 * Update Commands section in CLAUDE.md
 */
function updateCommandsSection(content, packageJson) {
  const commandsSection = generateCommandsSection(packageJson);

  // Find the Commands section and replace it
  const commandsRegex = /## Commands\n\n[\s\S]*?(?=\n## |$)/;

  if (!commandsRegex.test(content)) {
    console.warn(`${colors.yellow}Warning: Could not find Commands section in CLAUDE.md${colors.reset}`);
    return content;
  }

  return content.replace(commandsRegex, commandsSection);
}

/**
 * Verify CLAUDE.md structure
 */
function verifyStructure(content) {
  const requiredSections = [
    '# CLAUDE.md',
    '## Project Overview',
    '## Commands',
    '## Project Structure',
    '## Development Workflow',
    '## Status'
  ];

  const issues = [];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`Missing section: ${section}`);
    }
  }

  return issues;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}CLAUDE.md Update Script${colors.reset}\n`);

  // Read files
  const packageJson = readPackageJson();
  let claudeMdContent = readClaudeMd();

  // Verify structure
  const structureIssues = verifyStructure(claudeMdContent);
  if (structureIssues.length > 0) {
    console.error(`${colors.red}Structure verification failed:${colors.reset}`);
    structureIssues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
  console.log(`${colors.green}✓${colors.reset} CLAUDE.md structure verified`);

  if (isVerifyOnly) {
    console.log(`\n${colors.green}Verification complete - no issues found${colors.reset}`);
    return;
  }

  // Track changes
  const changes = [];

  // Update Commands section
  const originalContent = claudeMdContent;
  claudeMdContent = updateCommandsSection(claudeMdContent, packageJson);
  if (claudeMdContent !== originalContent) {
    changes.push('Commands section');
  }

  // Update version and date
  const beforeVersionUpdate = claudeMdContent;
  claudeMdContent = updateVersionAndDate(claudeMdContent, packageJson);
  if (claudeMdContent !== beforeVersionUpdate) {
    changes.push('Version and date');
  }

  // Report changes
  if (changes.length === 0) {
    console.log(`\n${colors.green}No changes needed - CLAUDE.md is up to date${colors.reset}`);
    return;
  }

  console.log(`\n${colors.blue}Changes detected:${colors.reset}`);
  changes.forEach(change => console.log(`  - ${change}`));

  if (isDryRun) {
    console.log(`\n${colors.yellow}Dry run - no files modified${colors.reset}`);
    console.log(`Run without --dry-run to apply changes`);
    return;
  }

  // Write updated content
  writeClaudeMd(claudeMdContent);
  console.log(`\n${colors.green}✓ CLAUDE.md updated successfully${colors.reset}`);
}

// Run the script
main();
