# CLAUDE.md Automation Scripts

This directory contains automation scripts to keep CLAUDE.md accurate and up-to-date.

## Scripts

### 1. `update-claude-md.mjs`

Automatically updates CLAUDE.md with current project information.

**What it updates:**
- Commands section (synced from package.json scripts)
- Version number (from package.json)
- Last Updated date (current date)

**Usage:**

```bash
# Update CLAUDE.md
npm run docs:update

# Dry run (see changes without applying)
npm run docs:update:dry-run

# Direct usage
node scripts/update-claude-md.mjs
node scripts/update-claude-md.mjs --dry-run
node scripts/update-claude-md.mjs --verify-only
```

**When to run:**
- After adding/removing/renaming npm scripts
- Before releasing a new version
- After major documentation changes
- As part of version bump workflow

### 2. `validate-claude-md.mjs`

Validates CLAUDE.md accuracy and completeness.

**What it checks:**
- All npm scripts are documented
- Version matches package.json
- All required sections exist
- Path aliases match esbuild.config.mjs
- Documentation links are valid
- Documentation freshness (warns if >90 days old)
- Common issues (TODO markers, placeholders)

**Usage:**

```bash
# Validate CLAUDE.md
npm run docs:validate

# Direct usage
node scripts/validate-claude-md.mjs
```

**Exit codes:**
- `0` - All validations passed
- `1` - Validation failed with errors

**When to run:**
- Before committing CLAUDE.md changes
- In CI/CD pipeline
- As part of pre-deployment checks
- During code reviews

### 3. `pre-commit-claude-check.sh`

Git pre-commit hook that reminds you to update CLAUDE.md.

**What it does:**
- Detects changes to package.json, esbuild.config.mjs, etc.
- Reminds you to update CLAUDE.md if needed
- Validates CLAUDE.md if included in commit
- Allows you to proceed or abort the commit

**Trigger files:**
- `package.json`
- `esbuild.config.mjs`
- `tsconfig.json`
- `.env.local`
- New directories in `src/`

**Installation:**

```bash
# Automatic setup
npm run setup:hooks

# Manual setup
ln -s ../../scripts/pre-commit-claude-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**To disable:**

```bash
rm .git/hooks/pre-commit
```

**To bypass for a single commit:**

```bash
git commit --no-verify -m "message"
```

### 4. `setup-hooks.mjs`

Installs the pre-commit hook automatically.

**Usage:**

```bash
npm run setup:hooks
```

**What it does:**
- Creates `.git/hooks` directory if needed
- Backs up existing pre-commit hook (if any)
- Installs pre-commit-claude-check.sh
- Makes the hook executable

## Workflow Examples

### Standard Development Workflow

```bash
# 1. Make changes to package.json (add new script)
# 2. Update CLAUDE.md
npm run docs:update

# 3. Validate changes
npm run docs:validate

# 4. Commit
git add package.json CLAUDE.md
git commit -m "feat: Add new build script"
# Pre-commit hook runs automatically
```

### Version Release Workflow

```bash
# 1. Bump version in package.json
npm version minor  # or major, patch

# 2. Update CLAUDE.md
npm run docs:update

# 3. Validate
npm run docs:validate

# 4. Commit
git add package.json CLAUDE.md
git commit -m "chore: Release v0.2.0"
```

### First-Time Setup

```bash
# Install git hooks
npm run setup:hooks

# Validate current state
npm run docs:validate

# Fix any issues
npm run docs:update
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate CLAUDE.md
  run: npm run docs:validate
```

Or in package.json:

```json
{
  "scripts": {
    "validate": "npm run typecheck && npm run docs:validate && npm run build:production"
  }
}
```

## Troubleshooting

### Hook not running

```bash
# Re-install hooks
npm run setup:hooks

# Check hook exists
ls -la .git/hooks/pre-commit

# Check hook is executable
chmod +x .git/hooks/pre-commit
```

### Validation fails

```bash
# See what's wrong
npm run docs:validate

# Auto-fix what can be fixed
npm run docs:update

# Validate again
npm run docs:validate
```

### Script permission errors

```bash
# Make scripts executable
chmod +x scripts/*.mjs scripts/*.sh
```

## Advanced Usage

### Custom validation

Edit `validate-claude-md.mjs` to add custom checks:

```javascript
function validateCustomRequirement(claudeMd) {
  const issues = [];

  // Your custom validation logic

  return issues;
}
```

### Custom update logic

Edit `update-claude-md.mjs` to add custom update logic:

```javascript
function updateCustomSection(content) {
  // Your custom update logic

  return content;
}
```

### Selective hook triggers

Edit `pre-commit-claude-check.sh` to change trigger files:

```bash
TRIGGER_FILES=(
  "package.json"
  "esbuild.config.mjs"
  "your-custom-file.json"
)
```

## Maintenance

### Quarterly tasks (every 3 months)

```bash
# 1. Validate current state
npm run docs:validate

# 2. Update if needed
npm run docs:update

# 3. Manual review of CLAUDE.md
# - Check for outdated information
# - Update examples if needed
# - Add new sections if needed
```

### After major changes

```bash
# Update and validate
npm run docs:update && npm run docs:validate
```

## Best Practices

1. **Update CLAUDE.md in the same commit** as the change it documents
2. **Run validation before committing** CLAUDE.md changes
3. **Use the pre-commit hook** to catch missed updates
4. **Review automation output** - don't blindly accept changes
5. **Keep scripts up to date** - update validation rules as project evolves

## Future Enhancements

Potential improvements:

- [ ] Auto-detect new environment variables from .env files
- [ ] Extract documentation from JSDoc comments
- [ ] Generate project structure diagram automatically
- [ ] Check for broken internal links in documentation
- [ ] Suggest improvements based on git history
- [ ] Integration with issue tracker for TODO items

## Support

For issues with automation scripts:

1. Check this README
2. Review script output messages
3. Try `--dry-run` or `--verify-only` flags
4. Check file permissions
5. Ensure Node.js 20+ is installed
