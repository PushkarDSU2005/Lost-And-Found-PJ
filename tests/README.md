# Test Suite Documentation

## Overview

This Lost & Found platform has comprehensive test coverage across unit, integration, and end-to-end tests.

**Total Test Count:** 462+ tests (as of 2026-10-17)
- **Unit tests:** 234 tests
- **Integration tests:** Database queries, RLS policies, server actions
- **E2E tests:** 228 tests (114 scenarios × 2 viewports)

---

## Quick Start

```bash
# Run all unit tests (watch mode)
pnpm test

# Run all unit tests once with coverage
pnpm test:ci --coverage

# Run integration tests (requires Supabase)
pnpm test:integration

# Run E2E tests (both Desktop + Mobile viewports)
pnpm test:e2e

# Run E2E tests with interactive UI
pnpm exec playwright test --ui

# List all E2E tests
pnpm exec playwright test --list
```

---

## Test Structure

```
tests/
├── unit/              # Unit tests (Vitest + React Testing Library)
│   ├── browse.test.ts
│   ├── claimStateMachine.test.ts
│   ├── matching.test.ts
│   ├── sanitize.test.ts
│   ├── HomePage.axe.test.tsx
│   ├── ReportForm.test.tsx
│   └── ...
├── integration/       # Integration tests (Vitest + Supabase client)
│   ├── rls.test.ts
│   ├── auth.test.ts
│   ├── actions.test.ts
│   ├── admin.test.ts
│   └── ...
├── e2e/              # End-to-end tests (Playwright)
│   ├── admin-panel.spec.ts
│   ├── accessibility.spec.ts
│   ├── browse.spec.ts
│   ├── claim-flow.spec.ts
│   ├── dashboard.spec.ts
│   ├── error-boundaries.spec.ts
│   ├── image-upload.spec.ts
│   ├── item-detail.spec.ts
│   ├── messaging.spec.ts
│   └── report-item.spec.ts
├── fixtures/         # Test fixtures (e.g., minimal test images)
└── setup.ts          # Test environment setup
```

---

## Unit Tests

**Framework:** Vitest 3.2.4 + React Testing Library + jsdom

**Location:** `tests/unit/` and `lib/**/*.test.ts`

### Running Unit Tests

```bash
# Watch mode (default)
pnpm test

# Run once (CI mode)
pnpm test:ci

# With coverage report
pnpm test:ci --coverage

# Run specific test file
pnpm test browse.test.ts

# Run tests matching pattern
pnpm test --grep "claim"

# Update snapshots
pnpm test -u
```

### Coverage Configuration

Coverage reports track `/lib` directory only:

**Thresholds:**
- Lines: 30%
- Functions: 50%
- Branches: 50%
- Statements: 30%

**Output formats:**
- Console (text)
- LCOV (`coverage/lcov.info`)
- HTML (`coverage/index.html`)

**Excluded from coverage:**
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`, `types.ts`)
- Mocks (`__mocks__/`)

### Writing Unit Tests

```typescript
import { describe, test, expect } from 'vitest'

describe('Feature', () => {
  test('does something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

**Best practices:**
- Test behavior, not implementation
- Use descriptive test names
- Keep tests isolated (no shared state)
- Mock external dependencies (Supabase, APIs)
- Use `axe-core/vitest-axe` for accessibility tests

---

## Integration Tests

**Framework:** Vitest 3.2.4 + Supabase JS client

**Location:** `tests/integration/`

**Requires:** Supabase project with seed data

### Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific file
pnpm exec vitest run tests/integration/rls.test.ts --config vitest.integration.config.ts
```

### Setup Requirements

1. Create `.env.local` with Supabase keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

2. Apply migrations and seed data:
   ```bash
   supabase migration up
   psql -h ... -f supabase/seed.sql
   ```

3. Set `SUPABASE_INTEGRATION_ENABLED=true` in CI

### Test Data (from seed.sql)

**Users:**
- `admin@campus.edu` (role: admin)
- `alice@campus.edu` (studentA)
- `bob@campus.edu` (studentB)
- `charlie@campus.edu` (studentC)

**Items:** 15 sample items (14 open, 1 resolved)

**Locations:** 12 locations (3 drop-points)

### Writing Integration Tests

```typescript
import { describe, test, expect, beforeAll } from 'vitest'
import { createBrowserClient } from '@/lib/supabase/client'

describe('Feature', () => {
  let supabase: ReturnType<typeof createBrowserClient>

  beforeAll(() => {
    supabase = createBrowserClient()
  })

  test('queries data', async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'open')
    
    expect(error).toBeNull()
    expect(data).toHaveLength(14)
  })
})
```

---

## E2E Tests

**Framework:** Playwright 1.52.0

**Location:** `tests/e2e/`

**Projects:** Desktop Chrome (1280×720) + Mobile Chrome (390×844)

### Running E2E Tests

```bash
# Run all E2E tests (both projects)
pnpm test:e2e

# Run with UI mode (interactive)
pnpm exec playwright test --ui

# Run specific test file
pnpm exec playwright test admin-panel.spec.ts

# Run specific project only
pnpm exec playwright test --project="Desktop Chrome"
pnpm exec playwright test --project="Mobile Chrome"

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Debug mode (pause on each step)
pnpm exec playwright test --debug

# Run tests matching pattern
pnpm exec playwright test -g "admin panel"

# Show test report
pnpm exec playwright show-report
```

### Test Utilities

**Authentication helper:**
```typescript
import { signInViaAPI } from '../helpers/auth'

test('authenticated flow', async ({ page }) => {
  await signInViaAPI(page, 'alice@campus.edu', 'password123')
  await page.goto('/dashboard')
  // ...
})
```

**Test users:**
```typescript
export const ADMIN = {
  email: 'admin@campus.edu',
  password: 'admin123',
  id: '00000000-0000-0000-0000-000000000001'
}

export const STUDENT_A = {
  email: 'alice@campus.edu',
  password: 'alice123',
  id: '00000000-0000-0000-0000-000000000002'
}

export const STUDENT_B = {
  email: 'bob@campus.edu',
  password: 'bob123',
  id: '00000000-0000-0000-0000-000000000003'
}
```

### Accessibility Testing

**Tool:** @axe-core/playwright

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('page has no a11y issues', async ({ page }) => {
  await page.goto('/browse')
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  
  expect(results.violations).toEqual([])
})
```

**Covered pages:**
- Home (`/`)
- Browse (`/browse`)
- Item detail (`/items/:id`)
- Report form (`/report/found`, `/report/lost`)
- Dashboard (`/dashboard`)

### Mobile Testing

Mobile Chrome project uses 390×844 viewport (Pixel 5):

```typescript
test('mobile layout', async ({ page }) => {
  // Viewport is already set by project config
  await page.goto('/browse')
  
  // Test mobile-specific features
  const mobileMenu = page.locator('[aria-label="Mobile menu"]')
  await expect(mobileMenu).toBeVisible()
})
```

### Screenshot on Failure

Screenshots are automatically captured on test failure:
```
test-results/
└── [test-name]/
    └── test-failed-1.png
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test('does something', async ({ page }) => {
    await page.goto('/path')
    
    // Interact with page
    await page.getByRole('button', { name: 'Submit' }).click()
    
    // Assert outcome
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

**Best practices:**
- Use `getByRole`, `getByLabel`, `getByText` over CSS selectors
- Wait for navigation/network with `page.waitForURL()` or `page.waitForResponse()`
- Test user flows, not implementation details
- Keep tests independent (no shared state between tests)
- Use `beforeEach` for common setup

---

## CI/CD Pipeline

**GitHub Actions:** `.github/workflows/ci.yml`

### Jobs

**1. Unit Tests + Coverage**
```yaml
- Lint (ESLint)
- Typecheck (tsc --noEmit)
- Run unit tests with coverage
- Upload coverage artifacts
```

**2. Integration Tests**
```yaml
- Run integration tests (when SUPABASE_INTEGRATION_ENABLED=true)
```

**3. E2E Tests**
```yaml
- Install Playwright browsers
- Run E2E tests (both projects)
- Upload playwright-report artifact
- Upload test-results artifact
```

### Artifacts

After CI run, artifacts are available for download:
- **coverage/** — LCOV + HTML coverage reports
- **playwright-report/** — Interactive HTML test report
- **test-results/** — JUnit XML for CI dashboards

### Running CI Locally

```bash
# Lint + typecheck + unit tests with coverage
pnpm lint && pnpm typecheck && pnpm test:ci --coverage

# Integration tests (requires Supabase)
pnpm test:integration

# E2E tests
pnpm test:e2e
```

---

## Test Coverage Summary

### By Feature Area

| Area | Unit | Integration | E2E | Status |
|------|------|-------------|-----|--------|
| **Authentication** | ✅ | ✅ | ✅ | Full |
| **Browse & Search** | ✅ | ✅ | ✅ | Full |
| **Item CRUD** | ✅ | ✅ | ✅ | Full |
| **Claim Flow** | ✅ | ✅ | ✅ | Full |
| **Messaging** | ✅ | ✅ | ✅ | Full |
| **Dashboard** | ✅ | ✅ | ✅ | Full |
| **Admin Panel** | ❌ | ✅ | ✅ | Partial (no unit tests) |
| **Image Upload** | ✅ | ✅ | ✅ | Full |
| **Error Handling** | ✅ | ❌ | ✅ | Partial (no integration) |
| **Accessibility** | ✅ | ❌ | ✅ | Full |
| **Email** | ✅ | ❌ | ❌ | Partial (unit only) |
| **Cron Jobs** | ✅ | ❌ | ❌ | Partial (unit only) |

### High Priority Missing Tests

1. **Email delivery** — Integration/E2E tests for Resend
2. **Sensitive item flow** — E2E test for private image handling
3. **Claim rejection flow** — Complete E2E coverage
4. **Match suggestions** — E2E validation of suggestion cards
5. **Dashboard My Claims tab** — E2E test scenarios

---

## Troubleshooting

### Tests Failing Locally

**Unit tests:**
```bash
# Clear cache and retry
rm -rf node_modules/.vite
pnpm test
```

**Integration tests:**
```bash
# Verify Supabase connection
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Re-run migrations
supabase db reset
```

**E2E tests:**
```bash
# Install/update browsers
pnpm exec playwright install chromium

# Run with debug logs
DEBUG=pw:api pnpm test:e2e

# Run single test in headed mode
pnpm exec playwright test admin-panel --headed --debug
```

### Coverage Not Generated

```bash
# Verify coverage plugin is installed
pnpm list @vitest/coverage-v8

# Ensure version matches vitest
# Should both be 3.2.4

# Force reinstall if mismatch
pnpm remove @vitest/coverage-v8
pnpm add -D @vitest/coverage-v8@3.2.4
```

### Playwright WebServer Timeout

If dev server doesn't start in 120s:
```bash
# Start server manually first
pnpm dev

# Then run tests (will reuse existing server)
pnpm test:e2e
```

### Accessibility Violations

If axe finds issues:
```bash
# Run specific test with verbose output
pnpm exec playwright test accessibility --headed

# Check the HTML report for details
pnpm exec playwright show-report
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

When adding new features, follow this test coverage checklist:

- [ ] Write unit tests for business logic in `/lib`
- [ ] Write integration tests for database queries and RLS policies
- [ ] Write E2E tests for user-facing flows
- [ ] Add accessibility tests with axe-core if adding new pages
- [ ] Test both Desktop (1280×720) and Mobile (390×844) viewports
- [ ] Verify all tests pass: `pnpm lint && pnpm typecheck && pnpm test:ci && pnpm test:e2e`
- [ ] Check coverage meets thresholds: `pnpm test:ci --coverage`

**Test-driven development is encouraged!** Write tests before implementation when possible.

---

Last updated: 2026-10-17 (Task 15b completion)
