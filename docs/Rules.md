# Development Rules & Guidelines

**Lost & Found Platform — AI & Human Developer Boundaries**

---

## Purpose

This document establishes **clear boundaries** for AI-assisted development on the Lost & Found project. It defines what libraries, patterns, and practices are allowed, what is forbidden, and how to handle common scenarios. These rules ensure consistency, maintainability, and alignment with project architecture.

---

## Table of Contents

1. [Core Technology Stack](#core-technology-stack)
2. [Allowed Libraries & Packages](#allowed-libraries--packages)
3. [Forbidden Libraries & Patterns](#forbidden-libraries--patterns)
4. [Code Style & Conventions](#code-style--conventions)
5. [Error Handling Rules](#error-handling-rules)
6. [Database & Data Rules](#database--data-rules)
7. [Testing Requirements](#testing-requirements)
8. [Security Rules](#security-rules)
9. [Performance Guidelines](#performance-guidelines)
10. [AI Assistant Boundaries](#ai-assistant-boundaries)

---

## 1. Core Technology Stack

### ✅ Required Stack (DO NOT change without approval)

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| **Framework** | Next.js | 15.3.3 | App Router only |
| **React** | React | 19.x | Server Components by default |
| **Language** | TypeScript | 5.x | Strict mode enabled |
| **Styling** | Tailwind CSS | v4 | No custom CSS files |
| **Database** | PostgreSQL | 15+ | via Supabase |
| **Auth** | Supabase Auth | latest | Email + OAuth |
| **Storage** | Supabase Storage | latest | 2 buckets configured |
| **Deployment** | Vercel | latest | Main branch auto-deploy |

---

## 2. Allowed Libraries & Packages

### ✅ UI Components (Current)
```bash
lucide-react          # Icons only
@radix-ui/*          # Headless primitives
class-variance-authority  # CVA for variant patterns
clsx                 # Conditional classes
```

### ✅ Data & State
```bash
@supabase/supabase-js  # Official client
zod                    # Schema validation
react-hook-form        # Form handling (if needed)
```

### ✅ Dev & Testing
```bash
vitest                 # Unit tests
@testing-library/*     # React testing
playwright             # E2E tests
@faker-js/faker        # Test data generation
msw                    # API mocking
prettier               # Code formatting
eslint                 # Linting
```

### ⚠️ Conditional Approval Required
These require explicit user approval before adding:
- **shadcn/ui components** (prefer custom + Radix primitives)
- **Chart libraries** (recharts, chart.js)
- **Date pickers** (react-day-picker)
- **Rich text editors** (Tiptap, Slate)
- **Image upload widgets** (react-dropzone)

**Process**: Propose the library, explain why current solution is insufficient, wait for approval.

---

## 3. Forbidden Libraries & Patterns

### ❌ Absolutely Forbidden

| Category | Forbidden | Reason |
|----------|-----------|--------|
| **UI Frameworks** | Material-UI, Ant Design, Chakra UI | Conflicts with Tailwind v4 |
| **State Management** | Redux, MobX, Zustand | Use React Server Components + URL state |
| **Routing** | React Router, Tanstack Router | Next.js App Router is built-in |
| **CSS Solutions** | styled-components, Emotion, CSS Modules | Tailwind v4 only |
| **Data Fetching** | Axios, React Query, SWR | Use native `fetch` + Server Components |
| **Form Libraries** | Formik | Use react-hook-form if needed |
| **Date Libraries** | Moment.js | Use native `Intl.DateTimeFormat` or date-fns |

### ❌ Forbidden Patterns
- **Pages Router** — Do not create `/pages` directory
- **`getServerSideProps` / `getStaticProps`** — Use Server Components
- **Client-side data fetching** — Fetch in Server Components, pass as props
- **Global CSS files** (except globals.css for Tailwind imports)
- **Inline styles** — Use Tailwind classes
- **`useEffect` for data fetching** — Fetch in Server Component
- **REST API routes** — Use Server Actions for mutations

---

## 4. Code Style & Conventions

### File Naming
```
pages:        page.tsx, layout.tsx, loading.tsx, error.tsx
components:   kebab-case.tsx (e.g., item-card.tsx)
lib utilities: kebab-case.ts (e.g., format-date.ts)
types:        PascalCase (e.g., Database, Item, Claim)
```

### Component Patterns
```typescript
// ✅ Good: Server Component (default)
export default async function ItemListPage() {
  const items = await fetchItems();
  return <ItemList items={items} />;
}

// ✅ Good: Client Component (explicit)
'use client';
export function ItemFilterBar({ onFilter }: Props) {
  const [search, setSearch] = useState('');
  return <input value={search} onChange={e => setSearch(e.target.value)} />;
}

// ❌ Bad: Client component fetching data
'use client';
export function ItemList() {
  const [items, setItems] = useState([]);
  useEffect(() => { fetchItems().then(setItems); }, []);
  return <>{items.map(...)}</>;
}
```

### TypeScript Rules
```typescript
// ✅ Use Database type from database.types.ts
import type { Database } from '@/lib/database.types';
type Item = Database['public']['Tables']['items']['Row'];

// ✅ Strict null checks
function getItemTitle(item: Item | null): string {
  return item?.title ?? 'Untitled';
}

// ❌ No 'any' types (use 'unknown' if truly dynamic)
function process(data: any) { ... }  // FORBIDDEN

// ✅ Use 'unknown' and type guards
function process(data: unknown) {
  if (isItem(data)) { ... }
}
```

---

## 5. Error Handling Rules

### Server Components & Actions
```typescript
// ✅ Good: Return error objects
export async function createItem(data: ItemInput): Promise<Result<Item>> {
  try {
    const { data: item, error } = await supabase.from('items').insert(data).single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: item };
  } catch (err) {
    console.error('createItem failed:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ❌ Bad: Throwing errors in Server Actions
export async function createItem(data: ItemInput) {
  const { data, error } = await supabase.from('items').insert(data);
  if (error) throw new Error(error.message);  // DON'T
  return data;
}
```

### Client Components
```typescript
// ✅ Good: Try-catch with user-friendly messages
'use client';
export function ItemForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await createItem(formData);
    if (!result.success) {
      setError(result.error ?? 'Failed to create item');
      return;
    }
    router.push('/items');
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-600">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

### Error Messages
- **User-facing**: Plain English, actionable, no stack traces
- **Logs**: Include context (user ID, item ID, operation)
- **Never expose**: Database errors, file paths, API keys

---

## 6. Database & Data Rules

### Supabase Client Usage
```typescript
// ✅ Good: Server-side (no RLS bypass)
import { createClient } from '@/lib/supabase/server';

export async function getItems() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('items').select('*');
  // RLS policies apply (user sees only what they're allowed to)
  return data ?? [];
}

// ✅ Good: Client-side (user context)
import { createClient } from '@/lib/supabase/client';

export function useItems() {
  const supabase = createClient();
  // RLS policies apply based on auth.uid()
}

// ❌ Bad: Service role client in client-side code
const supabase = createClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
```

### Query Patterns
```typescript
// ✅ Good: Select specific columns
const { data } = await supabase
  .from('items')
  .select('id, title, status, reporter:profiles(full_name)')
  .eq('status', 'open');

// ❌ Bad: Select * when you need 3 fields
const { data } = await supabase.from('items').select('*');

// ✅ Good: Use indexes (see ARCHITECTURE.md)
// Query leverages idx_items_type_status_created
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('report_type', 'lost')
  .eq('status', 'open')
  .order('created_at', { ascending: false });
```

### Mutation Rules
- **Never bypass RLS** (don't use service role for user operations)
- **Validate inputs** (use Zod schemas before DB calls)
- **Handle unique violations** (check error codes, show friendly messages)
- **Use transactions** when updating multiple tables (wrap in `.rpc()` if needed)

---

## 7. Testing Requirements

### Coverage Targets
- **Unit tests**: 80% coverage (functions, utilities, components)
- **Integration tests**: All RLS policies, all Server Actions
- **E2E tests**: Critical user flows (report item, search, claim)

### Test File Locations
```
tests/unit/          # Vitest tests (lib/*.ts, components/*.tsx)
tests/integration/   # Supabase RLS, Server Actions
tests/e2e/           # Playwright tests
```

### What to Test
```typescript
// ✅ Always test:
// - RLS policies (anon, student, admin personas)
// - Server Actions (success, validation errors, auth errors)
// - Utility functions (formatDate, truncateText, etc.)
// - Client components with user interaction (forms, modals)

// ⚠️ Optionally test:
// - Server Components (usually integration-tested via E2E)
// - Simple presentational components (if logic-heavy)

// ❌ Don't test:
// - Third-party libraries (Supabase client, Radix components)
// - Tailwind class application
```

### Running Tests
```bash
# Before every commit
npm run test              # Run all unit tests
npm run test:integration  # Run RLS + Server Action tests
npm run test:e2e          # Run Playwright (local or CI)

# Pre-push
npm run lint              # ESLint + TypeScript check
npm run build             # Ensure production build succeeds
```

---

## 8. Security Rules

### Authentication
```typescript
// ✅ Good: Check auth in Server Components
export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <div>Welcome {user.email}</div>;
}

// ✅ Good: Check auth in Server Actions
export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  // Proceed with deletion (RLS ensures user can only delete their items)
}

// ❌ Bad: Client-side auth check only
'use client';
export function DeleteButton({ itemId }: Props) {
  const { user } = useUser();
  if (!user) return null;  // Attacker can bypass this in browser
  return <button onClick={() => deleteItem(itemId)}>Delete</button>;
}
```

### Input Validation
```typescript
// ✅ Good: Validate with Zod
import { z } from 'zod';

const itemSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(['electronics', 'clothing', ...]),
  date_occurred: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function createItem(input: unknown) {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }
  // Use parsed.data (type-safe and validated)
}
```

### File Upload
```typescript
// ✅ Good: Validate file type and size
export async function uploadImage(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only JPEG, PNG, and WebP allowed' };
  }
  if (file.size > maxSize) {
    return { success: false, error: 'File must be under 5MB' };
  }
  
  // Upload to Supabase Storage
}
```

### Environment Variables
- **Never commit** `.env.local` (in `.gitignore`)
- **Prefix public vars** with `NEXT_PUBLIC_` (exposed to browser)
- **Keep secrets server-side** (Supabase service role key, etc.)

---

## 9. Performance Guidelines

### Image Optimization
```tsx
// ✅ Good: Use next/image
import Image from 'next/image';

<Image 
  src={item.imageUrl} 
  alt={item.title}
  width={400}
  height={300}
  className="object-cover"
/>

// ❌ Bad: <img> tag (no optimization)
<img src={item.imageUrl} alt={item.title} />
```

### Data Fetching
```typescript
// ✅ Good: Fetch in parallel
export async function DashboardPage() {
  const [items, stats, locations] = await Promise.all([
    fetchItems(),
    fetchStats(),
    fetchLocations(),
  ]);
  return <Dashboard items={items} stats={stats} locations={locations} />;
}

// ❌ Bad: Sequential fetches (slow waterfall)
export async function DashboardPage() {
  const items = await fetchItems();       // Wait 200ms
  const stats = await fetchStats();       // Wait 150ms
  const locations = await fetchLocations(); // Wait 100ms
  // Total: 450ms instead of 200ms
}
```

### Bundle Size
- **Lazy load** heavy components (`const Map = lazy(() => import('./map'))`)
- **Tree-shake** icon imports (`import { Search } from 'lucide-react'`)
- **Monitor** bundle size in CI (fail if >500KB first-load JS)

---

## 10. AI Assistant Boundaries

### ✅ AI Can Do (No Approval Needed)
- Fix bugs in existing code
- Add unit/integration tests
- Refactor code following these rules
- Update documentation (README, Architecture, etc.)
- Implement features from approved PROGRESS.md tasks
- Optimize queries, improve performance
- Add TypeScript types
- Format code with Prettier

### ⚠️ AI Should Ask First
- Add new npm packages (see [Section 2](#allowed-libraries--packages))
- Change database schema (migrations)
- Modify RLS policies
- Change authentication flow
- Add new API routes
- Deploy to production
- Delete files or folders
- Modify CI/CD configuration

### ❌ AI Must NOT Do (Forbidden)
- Change core tech stack (React, Next.js, Tailwind, Supabase)
- Bypass RLS with service role key in user-facing code
- Commit secrets or API keys
- Force push to main branch
- Delete production data
- Disable security features (HTTPS, CSP headers)
- Ignore test failures ("tests are broken, skipping")

### Decision Framework
**When unsure**, ask:
1. **Does it change architecture?** → Ask user
2. **Does it add dependencies?** → Check [Section 2](#allowed-libraries--packages)
3. **Does it affect security?** → Ask user
4. **Is it reversible?** → Probably safe to do
5. **Is it in PROGRESS.md?** → Go ahead if task is marked "ready"

---

## Enforcement

### Pre-Commit Checks
```bash
# Run automatically via husky (if configured)
npm run lint       # ESLint + TypeScript
npm run test       # Vitest unit tests
npm run format     # Prettier check
```

### PR Review Checklist
- [ ] Follows [Code Style](#code-style--conventions)
- [ ] No forbidden libraries/patterns
- [ ] Tests added/updated (coverage ≥80%)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Error handling follows [Section 5](#error-handling-rules)
- [ ] Security rules respected ([Section 8](#security-rules))
- [ ] Documentation updated (if public API changed)

---

## Exceptions

If you **must** break a rule:
1. **Document why** in PR description (e.g., "Using Moment.js because date-fns lacks timezone support we need")
2. **Get approval** from project lead
3. **Update this document** to reflect the new rule or exception

---

**Last Updated**: 2026-10-17  
**Document Owner**: Project Lead  
**Review Cadence**: After each major phase completion
