# Database

## Fresh install

Run the full script in the SQL editor:

- [`schema.sql`](./schema.sql) — all tables from migrations `001`–`015`

Or apply migrations one-by-one from [`migrations/`](./migrations/) in numeric order.

## Multi-tenant model

- **`companies`** — one row per customer org (`id` = `company_id` everywhere)
- **`company_users`** — maps `email` → `company_id`, roles, backup flags
- App resolves tenant via [`src/lib/tenant.ts`](../src/lib/tenant.ts) (validates cookie against `company_users`)

Child tables should always include `company_id` and filter queries by it.
