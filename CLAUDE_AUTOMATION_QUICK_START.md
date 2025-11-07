# CLAUDE.md Automation - Quick Start

This guide shows you how to use the CLAUDE.md automation tools.

## One-Time Setup

Install git hooks to get automatic reminders:

```bash
npm run setup:hooks
```

This installs a pre-commit hook that reminds you to update CLAUDE.md when you modify:
- `package.json`
- `esbuild.config.mjs`
- `tsconfig.json`
- `.env.local`
- New directories in `src/`

## Daily Usage

### Scenario 1: Added a New npm Script

```bash
# 1. Add script to package.json
{
  "scripts": {
    "my:new:script": "node scripts/my-script.mjs"
  }
}

# 2. Update CLAUDE.md automatically
npm run docs:update

# 3. Commit both files
git add package.json CLAUDE.md
git commit -m "feat: Add new script"
```

### Scenario 2: Version Bump

```bash
# 1. Bump version
npm version patch  # or minor, major

# 2. Update CLAUDE.md
npm run docs:update

# 3. Commit
git add package.json package-lock.json CLAUDE.md
git commit -m "chore: Release v0.1.1"
```

### Scenario 3: Before Committing CLAUDE.md

```bash
# Validate CLAUDE.md
npm run docs:validate

# If validation fails, fix issues
npm run docs:update

# Validate again
npm run docs:validate
```

### Scenario 4: Preview Changes

```bash
# See what would change without applying
npm run docs:update:dry-run
```

## What Gets Updated Automatically

✅ **Automatically synced:**
- Commands section (from package.json scripts)
- Version number (from package.json)
- Last Updated date (current date)

❌ **Requires manual updates:**
- Project Overview
- Key Features
- Key Concepts
- Common Development Tasks
- Troubleshooting tips
- Documentation links

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run docs:update` | Update CLAUDE.md with latest info |
| `npm run docs:update:dry-run` | Preview changes without applying |
| `npm run docs:validate` | Check CLAUDE.md accuracy |
| `npm run setup:hooks` | Install git pre-commit hook |

## Validation Checks

`npm run docs:validate` checks for:

- ✓ All npm scripts are documented
- ✓ Version matches package.json
- ✓ All required sections exist
- ✓ Path aliases match esbuild config
- ✓ Documentation links work
- ✓ Documentation is fresh (<90 days old)
- ✓ No TODO/FIXME markers

## Git Hook Behavior

When you commit changes to `package.json`:

```bash
git commit -m "feat: Add new script"

# Hook runs and shows:
⚠ Warning: You modified files that may require CLAUDE.md updates:
  - package.json

Consider running:
  npm run docs:update  # Update CLAUDE.md automatically

Continue with commit anyway? (y/n)
```

**Options:**
- `y` - Continue without updating (not recommended)
- `n` - Abort commit, update CLAUDE.md, then commit again

**To bypass hook:**
```bash
git commit --no-verify -m "message"
```

## Troubleshooting

### Hook not running

```bash
# Re-install hooks
npm run setup:hooks

# Verify installation
ls -la .git/hooks/pre-commit
```

### Validation fails

```bash
# See specific issues
npm run docs:validate

# Auto-fix what's possible
npm run docs:update

# Check again
npm run docs:validate
```

### Scripts not executable

```bash
chmod +x scripts/*.mjs scripts/*.sh
```

## Best Practices

1. **Update CLAUDE.md in the same commit** as what it documents
2. **Run validation before committing** CLAUDE.md changes
3. **Use the pre-commit hook** - don't bypass it
4. **Review auto-generated changes** - don't blindly accept
5. **Keep manual sections current** - automation can't do everything

## Example Workflow

```bash
# Morning: Start new feature
git checkout -b feature/new-validation

# Add new npm script
vim package.json

# Update CLAUDE.md
npm run docs:update

# Validate
npm run docs:validate
# ✓ All validations passed!

# Commit
git add package.json CLAUDE.md
git commit -m "feat: Add validation script"
# Pre-commit hook runs
# ✓ CLAUDE.md is included in this commit
# ✓ CLAUDE.md validation passed
# ✓ Pre-commit check complete

# Push
git push origin feature/new-validation
```

## Advanced Usage

### Custom Validation Rules

Edit `scripts/validate-claude-md.mjs` to add custom checks.

### Custom Update Logic

Edit `scripts/update-claude-md.mjs` to add custom sections.

### Selective Hook Triggers

Edit `scripts/pre-commit-claude-check.sh` to change trigger files.

## More Information

- **Detailed docs**: `scripts/README.md`
- **Script source**: `scripts/` directory
- **CLAUDE.md**: Main documentation file

## Quick Tips

💡 **Tip 1**: Run `npm run docs:validate` in CI/CD pipelines

💡 **Tip 2**: Add to your release checklist:
```bash
npm run docs:update && npm run docs:validate
```

💡 **Tip 3**: Review CLAUDE.md quarterly (every 3 months)

💡 **Tip 4**: When explaining something to a teammate that's not in CLAUDE.md, add it!

## Support

Issues with automation? Check:

1. This quick start guide
2. `scripts/README.md` for detailed docs
3. Script output error messages
4. Ensure Node.js 20+ is installed
