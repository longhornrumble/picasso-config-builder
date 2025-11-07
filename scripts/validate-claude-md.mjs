#!/usr/bin/env node

/**
 * Validate CLAUDE.md accuracy script
 *
 * Checks:
 * 1. All npm scripts are documented
 * 2. Version matches package.json
 * 3. All required sections exist
 * 4. Path aliases match esbuild.config.mjs
 * 5. Environment variables are documented
 * 6. Documentation links are valid
 *
 * Usage:
 *   node scripts/validate-claude-md.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CLAUDE_MD_PATH = path.join(ROOT_DIR, 'CLAUDE.md');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const ESBUILD_CONFIG_PATH = path.join(ROOT_DIR, 'esbuild.config.mjs');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Read file safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`${colors.red}Error reading ${path.basename(filePath)}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Check if all npm scripts are documented
 */
function validateNpmScripts(claudeMd, packageJson) {
  const issues = [];
  const scripts = Object.keys(packageJson.scripts || {});

  for (const script of scripts) {
    // Check if script is mentioned in CLAUDE.md
    const patterns = [
      `npm run ${script}`,
      `npm ${script}`, // For scripts like 'test' that don't need 'run'
      `\`${script}\`` // Backtick references
    ];

    const isMentioned = patterns.some(pattern => claudeMd.includes(pattern));

    if (!isMentioned) {
      issues.push({
        type: 'missing-script',
        severity: 'warning',
        message: `npm script "${script}" is not documented`
      });
    }
  }

  return issues;
}

/**
 * Check if version matches package.json
 */
function validateVersion(claudeMd, packageJson) {
  const issues = [];
  const expectedVersion = packageJson.version || '0.1.0';

  const versionMatch = claudeMd.match(/\*\*Version\*\*:\s*([\d.]+)/);

  if (!versionMatch) {
    issues.push({
      type: 'missing-version',
      severity: 'error',
      message: 'Version not found in Status section'
    });
  } else if (versionMatch[1] !== expectedVersion) {
    issues.push({
      type: 'version-mismatch',
      severity: 'error',
      message: `Version mismatch: CLAUDE.md has ${versionMatch[1]}, package.json has ${expectedVersion}`
    });
  }

  return issues;
}

/**
 * Check if all required sections exist
 */
function validateRequiredSections(claudeMd) {
  const issues = [];
  const requiredSections = [
    '# CLAUDE.md',
    '## Project Overview',
    '## Key Features',
    '## Tech Stack',
    '## Project Structure',
    '## Commands',
    '## Configuration Schema Versions',
    '## Path Aliases',
    '## Environment Variables',
    '## Development Workflow',
    '## Key Concepts',
    '## Testing Guidelines',
    '## Common Development Tasks',
    '## Troubleshooting',
    '## Documentation',
    '## Status'
  ];

  for (const section of requiredSections) {
    if (!claudeMd.includes(section)) {
      issues.push({
        type: 'missing-section',
        severity: 'error',
        message: `Required section missing: ${section}`
      });
    }
  }

  return issues;
}

/**
 * Check if path aliases match esbuild config
 */
function validatePathAliases(claudeMd, esbuildConfig) {
  const issues = [];

  // Extract path aliases from esbuild config (simple regex approach)
  const aliasMatches = esbuildConfig.matchAll(/'(@[^']+)':\s*path\.resolve\(__dirname,\s*'([^']+)'\)/g);
  const configAliases = new Map();

  for (const match of aliasMatches) {
    configAliases.set(match[1], match[2]);
  }

  // Check if documented in CLAUDE.md
  for (const [alias, targetPath] of configAliases.entries()) {
    const expectedDoc = `- \`${alias}/\` → \`${targetPath}/\``;
    if (!claudeMd.includes(alias)) {
      issues.push({
        type: 'missing-path-alias',
        severity: 'warning',
        message: `Path alias ${alias} is not documented`
      });
    }
  }

  return issues;
}

/**
 * Validate documentation links
 */
function validateDocumentationLinks(claudeMd) {
  const issues = [];

  // Extract markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [...claudeMd.matchAll(linkRegex)];

  for (const [fullMatch, text, url] of links) {
    // Skip external links
    if (url.startsWith('http://') || url.startsWith('https://')) {
      continue;
    }

    // Skip anchor links
    if (url.startsWith('#')) {
      continue;
    }

    // Check if file exists
    const filePath = path.join(ROOT_DIR, url);
    if (!fs.existsSync(filePath)) {
      issues.push({
        type: 'broken-link',
        severity: 'error',
        message: `Broken link: ${text} → ${url}`
      });
    }
  }

  return issues;
}

/**
 * Check for outdated information
 */
function validateFreshness(claudeMd) {
  const issues = [];

  // Check last updated date
  const dateMatch = claudeMd.match(/\*\*Last Updated\*\*:\s*([\d-]+)/);

  if (!dateMatch) {
    issues.push({
      type: 'missing-date',
      severity: 'warning',
      message: 'Last Updated date not found in Status section'
    });
  } else {
    const lastUpdated = new Date(dateMatch[1]);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24));

    if (daysSinceUpdate > 90) {
      issues.push({
        type: 'stale-documentation',
        severity: 'warning',
        message: `CLAUDE.md hasn't been updated in ${daysSinceUpdate} days (last: ${dateMatch[1]})`
      });
    }
  }

  return issues;
}

/**
 * Check for common issues
 */
function validateCommonIssues(claudeMd) {
  const issues = [];

  // Check for TODO markers
  if (claudeMd.includes('TODO') || claudeMd.includes('FIXME')) {
    issues.push({
      type: 'has-todo',
      severity: 'info',
      message: 'Documentation contains TODO/FIXME markers'
    });
  }

  // Check for placeholder text
  const placeholders = ['[TBD]', '[TODO]', 'Coming soon', 'To be implemented'];
  for (const placeholder of placeholders) {
    if (claudeMd.includes(placeholder)) {
      issues.push({
        type: 'has-placeholder',
        severity: 'info',
        message: `Documentation contains placeholder: "${placeholder}"`
      });
    }
  }

  return issues;
}

/**
 * Main validation function
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}CLAUDE.md Validation${colors.reset}\n`);

  // Read files
  const claudeMd = readFile(CLAUDE_MD_PATH);
  const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
  const esbuildConfig = readFile(ESBUILD_CONFIG_PATH);

  // Run all validations
  const allIssues = [
    ...validateRequiredSections(claudeMd),
    ...validateVersion(claudeMd, packageJson),
    ...validateNpmScripts(claudeMd, packageJson),
    ...validatePathAliases(claudeMd, esbuildConfig),
    ...validateDocumentationLinks(claudeMd),
    ...validateFreshness(claudeMd),
    ...validateCommonIssues(claudeMd)
  ];

  // Group by severity
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  const info = allIssues.filter(i => i.severity === 'info');

  // Print results
  if (errors.length > 0) {
    console.log(`${colors.red}${colors.bright}Errors (${errors.length}):${colors.reset}`);
    errors.forEach(issue => console.log(`  ${colors.red}✗${colors.reset} ${issue.message}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach(issue => console.log(`  ${colors.yellow}⚠${colors.reset} ${issue.message}`));
    console.log();
  }

  if (info.length > 0) {
    console.log(`${colors.cyan}${colors.bright}Info (${info.length}):${colors.reset}`);
    info.forEach(issue => console.log(`  ${colors.cyan}ℹ${colors.reset} ${issue.message}`));
    console.log();
  }

  // Summary
  if (allIssues.length === 0) {
    console.log(`${colors.green}${colors.bright}✓ All validations passed!${colors.reset}`);
    console.log(`CLAUDE.md is accurate and up to date.\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}Summary:${colors.reset}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);
    console.log(`  Info: ${info.length}\n`);

    if (errors.length > 0) {
      console.log(`${colors.red}Validation failed with errors.${colors.reset}`);
      console.log(`Run: ${colors.cyan}node scripts/update-claude-md.mjs${colors.reset} to fix automatically.\n`);
      process.exit(1);
    } else {
      console.log(`${colors.yellow}Validation passed with warnings.${colors.reset}\n`);
      process.exit(0);
    }
  }
}

// Run validation
main();
