# bharatcloud-website

Next.js **B2B SaaS** site — landing at `/`, company login at `/login`, dashboard at `/b2b/dashboard`.

## B2B SaaS routes

| Route | Purpose |
| --- | --- |
| `/` | B2B landing + pricing |
| `/login`, `/b2b/login` | Company register / login |
| `/b2b/dashboard` | Org admin — members, storage, plan |
| `/b2b/super` | Super admin (owner email only) |

### Configure

Copy `.env.example` → `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `WASABI_*` or `E2E_S3_*` (bucket default: `bharatcloud-vault`) — see [Hostinger + Wasabi](docs/hostinger-wasabi.md)
- `RAZORPAY_KEY`

Run SQL: `supabase/migrations/001_b2b_vault.sql` and `002_organizations.sql`

```bash
npm ci
npm run dev
```

Flutter mobile app lives in `/flutter` (renamed from `/app` so Next.js `src/app` is not shadowed).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
