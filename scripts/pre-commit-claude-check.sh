#!/bin/bash

# Pre-commit hook to check if CLAUDE.md needs updating
#
# Install:
#   ln -s ../../scripts/pre-commit-claude-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or use: npm run setup:hooks

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Checking if CLAUDE.md needs updating...${NC}"

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

# Files that should trigger CLAUDE.md update check
TRIGGER_FILES=(
  "package.json"
  "esbuild.config.mjs"
  "tsconfig.json"
  ".env.local"
)

# Check if any trigger files are staged
NEEDS_CHECK=false
for file in "${TRIGGER_FILES[@]}"; do
  if echo "$STAGED_FILES" | grep -q "^${file}$"; then
    NEEDS_CHECK=true
    break
  fi
done

# Check if new directories were added to src/
if echo "$STAGED_FILES" | grep -q "^src/.*/$"; then
  NEEDS_CHECK=true
fi

# If trigger files were modified but CLAUDE.md wasn't
if [ "$NEEDS_CHECK" = true ]; then
  if ! echo "$STAGED_FILES" | grep -q "^CLAUDE.md$"; then
    echo ""
    echo -e "${YELLOW}⚠ Warning: You modified files that may require CLAUDE.md updates:${NC}"

    for file in "${TRIGGER_FILES[@]}"; do
      if echo "$STAGED_FILES" | grep -q "^${file}$"; then
        echo -e "  - ${file}"
      fi
    done

    echo ""
    echo -e "${CYAN}Consider running:${NC}"
    echo -e "  ${GREEN}npm run docs:update${NC}  # Update CLAUDE.md automatically"
    echo -e "  ${GREEN}npm run docs:validate${NC} # Validate CLAUDE.md accuracy"
    echo ""
    echo -e "Or add CLAUDE.md to your commit if you've already updated it:"
    echo -e "  ${GREEN}git add CLAUDE.md${NC}"
    echo ""

    # Ask user if they want to continue
    read -p "Continue with commit anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Commit aborted.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}✓ CLAUDE.md is included in this commit${NC}"
  fi
fi

# Run CLAUDE.md validation if it's being committed
if echo "$STAGED_FILES" | grep -q "^CLAUDE.md$"; then
  echo -e "${CYAN}Running CLAUDE.md validation...${NC}"

  if node scripts/validate-claude-md.mjs; then
    echo -e "${GREEN}✓ CLAUDE.md validation passed${NC}"
  else
    echo -e "${RED}✗ CLAUDE.md validation failed${NC}"
    echo ""
    read -p "Continue with commit anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Commit aborted.${NC}"
      exit 1
    fi
  fi
fi

echo -e "${GREEN}✓ Pre-commit check complete${NC}"
exit 0
