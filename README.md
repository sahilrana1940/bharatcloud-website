# bharatcloud-website

Next.js site (B2C view-only + **B2B Private Drive** at `/b2b`).

## B2B Private Drive

| Route | Purpose |
| --- | --- |
| `/b2b` | Pricing — ₹999+GST / ₹2199+GST plans |
| `/b2b/signup` | Razorpay checkout stub |
| `/b2b/login` | Admin OTP (demo OTP: `123456`) |
| `/b2b/dashboard` | Google Drive–style company admin UI |

### Configure

Copy `.env.example` → `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_S3_*` (bucket default: `bharatcloud-vault`)
- `RAZORPAY_KEY`

Run SQL: `supabase/migrations/001_b2b_vault.sql`

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
