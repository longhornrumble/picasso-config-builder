# E2E Tests - Quick Start Guide

## 🚀 Run Tests in 3 Steps

### 1. Install (First Time Only)
```bash
cd /Users/chrismiller/Desktop/Working_Folder/picasso-config-builder
npm install
npx playwright install chromium firefox webkit
```

### 2. Run All Tests
```bash
npm run test:e2e
```

### 3. View Results
```bash
npm run test:e2e:report
```

---

## ✨ Popular Commands

```bash
# See tests run in browser (great for debugging)
npm run test:e2e:headed

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Run specific browser
npm run test:e2e:chromium    # Chrome
npm run test:e2e:firefox     # Firefox
npm run test:e2e:webkit      # Safari
```

---

## 📊 What's Tested?

✅ **135 total tests** across 5 browsers (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)

### 5 Critical Paths:
1. **Form Creation** (3 tests) - Create forms with fields, triggers, validation
2. **CTA & Branch** (3 tests) - Create CTAs and assign to branches
3. **Dependencies** (3 tests) - Dependency warnings when deleting
4. **Validation** (5 tests) - Validation errors block deployment
5. **Cross-Browser** (16 tests) - Compatibility across all browsers

---

## 🎯 Test Files

```
e2e/
├── form-creation.spec.ts         # Form creation workflow
├── branch-editor.spec.ts          # CTA and branch tests
├── dependency-warnings.spec.ts    # Dependency checking
├── validation.spec.ts             # Validation system
└── cross-browser.spec.ts          # Cross-browser compatibility
```

---

## 🐛 Debug a Failing Test

```bash
# Run in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test e2e/form-creation.spec.ts --debug

# View trace of failed test
npx playwright show-trace test-results/trace.zip
```

---

## 📚 Need More Help?

- **Quick Reference**: `e2e/README.md`
- **Full Documentation**: `E2E_TEST_DOCUMENTATION.md`
- **Completion Report**: `TASK_6.3_E2E_TEST_COMPLETION_REPORT.md`

---

## 🔧 Common Issues

**Tests timeout?**
```bash
# Increase timeout in playwright.config.ts
timeout: 90000  # 90 seconds
```

**Port already in use?**
```bash
killall node  # Stop dev server
```

**Browser not found?**
```bash
npx playwright install --with-deps
```

---

## ✅ CI/CD

Tests automatically run on:
- Push to `main` or `develop`
- All pull requests

See `.github/workflows/e2e-tests.yml`

---

**Ready to test!** Run `npm run test:e2e` to get started.
