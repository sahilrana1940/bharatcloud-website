# Deploy BharatCloud (new Supabase + Vercel)

Step-by-step for a **fresh** multi-tenant install. No customer-specific names in config — each org is a row in `companies` with `company_id` everywhere.

---

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Note **Project URL** and **service_role** key (Settings → API).  
   Do not expose `service_role` in the browser.

### 1.1 Run database schema

1. Open **SQL Editor** → **New query**.
2. Paste the full file [`supabase/schema.sql`](./supabase/schema.sql).
3. **Run** (may take 30–60 seconds).
4. Confirm tables exist: `companies`, `company_users`, `drive_files`, `personal_vault`, `payments`, `company_backup_jobs`.

### 1.2 PostgREST cache

If you alter tables later:

```sql
notify pgrst, 'reload schema';
```

### 1.3 Storage buckets

`schema.sql` creates buckets including:

| Bucket ID | Purpose |
|-----------|---------|
| `company-files` | B2B company uploads (alias / new deploys) |
| `bharatcloud-company-hot` | **Default in app code** for Drive/vault hot storage |
| `bharatcloud-personal-hot` | B2C personal hot |
| `bharatcloud-vault` | Locked vault mirror |
| `bharatcloud-cold` | Cold tier |
| `bharatcloud-thumbs` | Thumbnails |
| `bharatcloud-backups` | Legacy backup bucket name |

Google Drive **long-term archive** uses external S3 (`ARCHIVE_S3_BUCKET`), not Supabase storage.

### 1.4 First company (manual seed)

```sql
insert into companies (domain, admin_email, plan_name, storage_limit_gb, subscription_status)
values ('acme.example.com', 'owner@acme.example.com', 'starter', 100, 'trial')
returning id;

insert into company_users (company_id, email, role, saas_role, is_company_owner, is_backup_enabled)
values (
  '<company-uuid-from-above>',
  'owner@acme.example.com',
  'admin',
  'company_owner',
  true,
  true
);

insert into company_settings (company_id) values ('<company-uuid>');
```

Match `organizations.owner_email` if you use password signup (`/api/b2b/auth/register`).

---

## 2. Vercel project

1. Import the GitHub repo at [vercel.com](https://vercel.com).
2. Framework: **Next.js** (default).
3. Add **Environment Variables** (Production **and** Preview):

Copy from [`.env.example`](./.env.example). Minimum for B2B backup:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only |
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `https://www.yourdomain.com` |
| `BC_PIN_SALT` | Yes | Random long string |
| `CRON_SECRET` | Yes | Random string; Vercel Cron auth |
| `GOOGLE_CLIENT_ID` | For Drive backup | Google Cloud OAuth |
| `GOOGLE_CLIENT_SECRET` | For Drive backup | |
| `GOOGLE_REDIRECT_URI` | For Drive backup | `{APP_URL}/api/auth/google/drive/callback` |
| `WASABI_*` or `E2E_S3_*` | For archive | S3-compatible |
| `ARCHIVE_S3_BUCKET` | For archive | e.g. `bharatcloud-archiver` |
| `NEXT_PUBLIC_UPI_ID` | Billing | UPI VPA |
| `PAYMENT_AUTO_APPROVE` | Optional | `1` = instant approve UPI test payments |
| `RESEND_API_KEY` | Optional | Recovery email |

4. **Deploy**.

### 2.1 Google OAuth redirect URIs

In Google Cloud Console → OAuth client → **Authorized redirect URIs**:

- `https://<your-domain>/api/auth/google/drive/callback` (settings + employee Gmail connect)
- `https://<your-domain>/api/auth/google/callback` (team / workspace login link)
- Legacy (optional): `https://<your-domain>/api/auth/callback/google`
- Each Vercel preview URL if you test previews (same paths on `*.vercel.app`)

Enable APIs: **Google Drive**, **Gmail** (if using mail backup).

### 2.2 Custom domain

Vercel → Domains → add `www.yourdomain.com`.  
Update `NEXT_PUBLIC_APP_URL` and `GOOGLE_REDIRECT_URI` → **Redeploy**.

---

## 3. Vercel Cron jobs

Defined in [`vercel.json`](./vercel.json). Requires **Vercel Pro** (or compatible plan) for cron.

| Path | Schedule (UTC) | Purpose |
|------|----------------|---------|
| `/api/cron/archive` | `0 3 * * *` (daily 03:00) | Move old **vault** rows from hot → cold storage (`COLD_AFTER_DAYS`) |
| `/api/cron/plan-expiry` | `0 4 * * *` (daily 04:00) | Downgrade expired **B2C** `personal_users` plans to `free` |

Both routes expect:

```http
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron sends this automatically when `CRON_SECRET` is set in the project.

**Manual test:**

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<your-domain>/api/cron/archive"
```

There are **no other** cron routes under `src/app/api/cron/` in this repo.

---

## 4. Smoke test (B2B)

1. **Signup** `/signup` or login with seeded company owner.
2. **Billing** → I have paid (with `PAYMENT_AUTO_APPROVE=1` or admin-approved payment).
3. **Team & backup** → Connect Google Drive → automatic backup starts.
4. **My Vault** → upload HD test file.
5. **Drive** → BharatCloud Safe Drive lists backed-up files.

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Bucket not found | Re-run storage section at end of `schema.sql` |
| RLS / insert errors on Drive | Set `SUPABASE_SERVICE_ROLE_KEY` on Vercel (not anon key) |
| Google connect 503 | `GOOGLE_CLIENT_ID` / `SECRET` missing or wrong redirect URI |
| Cron 401 | `CRON_SECRET` mismatch |
| `company_id` errors | Run migration `015` or full `schema.sql` |

More detail: [`docs/GOOGLE_DRIVE_CONNECT.md`](./docs/GOOGLE_DRIVE_CONNECT.md).

---

## 6. Repo layout

| Path | Use |
|------|-----|
| `supabase/schema.sql` | Full DB + RLS + buckets |
| `supabase/migrations/` | Incremental upgrades on existing DBs |
| `src/lib/tenant.ts` | `company_id` resolution for APIs |
