# BharatCloud — production verify checklist

> **Note:** This repo does **not** use `BYPASS_PAID_CHECK`, `workspaces`, or `POST /api/workspace`.  
> Paid backup uses **`companies` + `payments`** (`companyHasPaidBackup`), not `organizations.is_paid`.

---

## Ek line

- **Develop:** zyada tar done (`main` on `bharatcloud-website`).
- **Bacha:** Vercel env + Supabase migrations + end-to-end smoke (login → pay/bypass → Google → backup).

---

## 1. ENV / DB confirm (~5 min)

### Vercel (Production)

| Variable | Prod value | Notes |
|----------|------------|--------|
| `PAYMENT_BYPASS` | **`0` or unset** | `1` = skip paid gate (dev only) |
| `PAYMENT_AUTO_APPROVE` | **`0`** unless UPI manual test | `1` = instant approve on “I have paid” |
| `SUPABASE_SERVICE_ROLE_KEY` | set | Not anon key |
| `ENCRYPTION_KEY` | set | OAuth tokens encrypted |
| `GOOGLE_CLIENT_ID` / `SECRET` | set | |
| `GOOGLE_REDIRECT_URI` | `…/api/auth/google/drive/callback` | |
| `NEXT_PUBLIC_UPI_ID` | e.g. `9469276461@idfcfirst` | Billing QR |
| `ARCHIVE_S3_BUCKET` + Wasabi keys | set | Drive archive |
| `RAZORPAY_KEY_ID` / `SECRET` | set if using Upgrade to Pro | + webhook → `/api/razorpay/webhook` |

**Not in this codebase:** `BYPASS_PAID_CHECK`, `TRANSCODER_ENABLED` (videos are pass-through; no ffmpeg worker).

### Supabase SQL

```sql
-- Workspace tenant (dashboard backup gate)
SELECT id, domain, subscription_status, plan_name, storage_limit_gb
FROM companies
WHERE domain = 'gorjrmcourier.com';

-- Payments (status must be approved/paid/active for unlock without bypass)
SELECT id, company_id, company_domain, amount, status, created_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- Google connected?
SELECT company_id, email, google_email, expiry
FROM google_oauth_tokens
WHERE email = 'info@gorjrmcourier.com';

-- Backup job pagination (6-year Drive = many ticks, not one request)
SELECT id, status, files_done, drive_page_token, error_message, updated_at
FROM company_backup_jobs
ORDER BY created_at DESC
LIMIT 3;
```

**`organizations` table:** used by **B2B signup/login** (`/b2b/*`), **not** for dashboard Team paid check.  
Do **not** rely on `organizations.plan` for Team & backup unlock.

---

## 2. Bypass status

| Env | Meaning |
|-----|--------|
| `PAYMENT_BYPASS=1` or `PAYMENT_AUTO_APPROVE=1` | Paid APIs behave as subscribed (testing) |
| Both **off** | Production: need `companies.subscription_status='active'` or approved `payments` |

**Current:** set on Vercel — you must confirm (Dashboard → Environment Variables).

### Agar bypass **OFF** (production mode)

1. **Unpaid company:** `GET /api/billing/status` → `active: false`  
   `POST /api/backup/start-auto` → **402** subscription required  
2. **Paid company:** After UPI + approve / Razorpay webhook → `billing/status` → `active: true`  
   `POST /api/backup/start-auto` → **200**, job created  
3. **Session / tenant:** Wrong or missing workspace cookies → **401** on APIs (not `x-org-id` header)  
4. **Drive chunk test:** `POST /api/backup/tick` repeatedly → `files_done` increases; job keeps `drive_page_token` until `status=completed` (not full Drive in one call)  
5. **Video:** Archive uploads original; no transcoder — check logs for archive skip/fail only  

### Agar bypass **ON** (dev mode)

1. `GET /api/billing/status` → `paymentBypass: true`, `active: true`  
2. Team page: no Pro lock; backup APIs work without payment  
3. **Before go-live:** set `PAYMENT_BYPASS=0`, redeploy  

---

## 3. Five-step browser test (logged in)

1. **Billing** — pick plan (999/2199/3499); QR `tn=Bharat Cloud {plan}`; or Razorpay Upgrade  
2. **Team & backup** — Pro unlocked; **Upgrade to Pro** hidden if active  
3. **Settings** — Google Drive connected (`info@…`)  
4. Console: `fetch('/api/drive/google-check').then(r=>r.json()).then(console.log)` — quota + `filesList.returned`  
5. **Backup:** `POST /api/backup/start-auto` then poll `POST /api/backup/tick` — or **Sync All Drives** (50 files per sync call)  

---

## 4. Final prod verify (YES/NO)

| Check | YES/NO |
|-------|--------|
| Paid company: `backup/start-auto` works? | |
| Unpaid company: blocked (402) when bypass off? | |
| Google `drive/google-check` OK? | |
| Backup job paginates (`drive_page_token` / multiple ticks)? | |
| Wasabi/archive bucket usage monitored in cloud console? | |

---

## Quick API commands (with session cookie from browser)

Replace `BASE` and paste cookies from DevTools → Application → Cookies.

```bash
BASE="https://www.bharatcloud.store"
# COOKIE='bc_workspace_email=...; bc_workspace_company=...'

curl -s "$BASE/api/billing/status" -H "Cookie: $COOKIE" | jq .
curl -s "$BASE/api/drive/google-check" -H "Cookie: $COOKIE" | jq .
curl -s -X POST "$BASE/api/backup/start-auto" -H "Cookie: $COOKIE" | jq .
curl -s -X POST "$BASE/api/backup/tick" -H "Cookie: $COOKIE" -H "Content-Type: application/json" -d '{}' | jq .
```
