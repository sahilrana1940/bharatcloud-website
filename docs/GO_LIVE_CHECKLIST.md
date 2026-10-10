# BharatCloud Go-Live Checklist (आपको Supabase/Vercel पर करना है)

## Supabase SQL (order)
1. `005_saas_columns.sql` … `010_master_course.sql`
2. Storage: confirm **5 buckets PRIVATE** (no public)
3. `team_members` / `team_members_email` में company users sync करें

## Vercel env
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (Vercel Cron → `/api/cron/archive` + `/api/cron/plan-expiry`)
- `RAZORPAY_KEY_ID` + secret (live payments)
- `BC_PIN_SALT`

## Demo flows (no Google keys)
| Button | URL |
|--------|-----|
| B2B | `/api/auth/google/demo?email=admin@rjadam.com` |
| B2C Personal | `/api/auth/google/demo?email=demo.user@gmail.com&mode=b2c` |
| Super Admin | `/api/auth/google/demo?email=admin@bharatcloud.store` |

## Mumbai VPS (later)
Point `NEXT_PUBLIC_SUPABASE_URL` to self-hosted API when ready.
