# PROD VERIFY CHECKLIST

**Repo:** `bharatcloud-website`  
**Doc:** `docs/PROD_VERIFY_CHECKLIST.md`  
**Reference commit:** `f77795a` (update after each doc change on `main`)

---

## Ek line

**Develop:** zyada tar done.  
**Bacha:** production par ek baar end-to-end verify + env/DB confirm — yahi "check" ka kaam hai.

---

## Implementation truth (Core sir — read once)

| Your template term | This codebase |
|--------------------|---------------|
| `BYPASS_PAID_CHECK` | **`PAYMENT_BYPASS`** (`1` = bypass). Also `PAYMENT_AUTO_APPROVE=1` bypasses paid gate. |
| `TRANSCODER_ENABLED` | **Not used** — no ffmpeg worker; videos pass-through by design. |
| `organizations.is_paid` | **Not used** for Team/backup. Use **`companies.subscription_status`** + **`payments.status`**. |
| `workspaces` / `POST /api/workspace` | **Does not exist**. Use **`/api/backup/*`**, **`/api/billing/status`**. |
| Drive “1 year chunk” | **Google `nextPageToken`** on `company_backup_jobs.drive_page_token` — **8 files per tick**, not calendar years. |

Paid logic: `src/lib/billing/subscription.ts` → `companyHasPaidBackup()`.

---

## 5-Step Production Verify (order me karna hai)

### 1. `GET /api/billing/status` → unpaid = `active: false`

- **Paid company:** `{ "active": true, "subscriptionStatus": "active", ... }` (or `paymentBypass: true` only in dev)
- **Free/unpaid company:** `{ "active": false }` (when `PAYMENT_BYPASS` off)
- **DB confirm (correct table):**

```sql
SELECT id, domain, subscription_status, plan_name, storage_limit_gb
FROM companies
WHERE domain = 'YOUR_DOMAIN';

SELECT company_id, status, amount FROM payments
WHERE company_domain = 'YOUR_DOMAIN'
ORDER BY created_at DESC LIMIT 3;
```

> **Not** `organizations` — that table is for `/b2b` flows only.

**Browser:** `fetch('/api/billing/status').then(r=>r.json()).then(console.log)`

---

### 2. `POST /api/backup/start-auto` → **402** (unpaid) / **200** (paid)

- **Unpaid:** `402` + `"Active subscription required. Complete payment on Billing first."`  
  (Not the string `"Free plan"` — same meaning.)
- **Paid:** `200` + backup job created / first chunk started
- **ENV:** `PAYMENT_BYPASS=0` (unset) and `PAYMENT_AUTO_APPROVE=0` on **Production**

**Browser:** `fetch('/api/backup/start-auto', { method: 'POST' }).then(r=>r.json()).then(console.log)`

---

### 3. Login cookies missing → **401**

- Without workspace session cookies, any protected route (e.g. `/api/backup/start-auto`, `/api/backup/tick`) → **401 Unauthorized**
- After login (`bc_workspace_email`, company cookie), APIs work

**Test:** `curl -X POST https://YOUR_DOMAIN/api/backup/start-auto` (no Cookie header) → 401

---

### 4. Multiple `POST /api/backup/tick` → `files_done` badhe, job `completed` tak

- Each tick processes up to **8** Drive files (`process-job-chunk.ts`)
- Response: `filesDone`, `done: false` until Google returns no `nextPageToken`
- Job row: `company_backup_jobs.status` → `running` → `completed`
- **6 saal ka Drive:** bahut saari ticks / time — **ek tick mein poora Drive nahi**

```sql
SELECT id, status, files_done, drive_page_token, error_message, updated_at
FROM company_backup_jobs
ORDER BY created_at DESC LIMIT 5;
```

**Browser loop (logged in):**

```javascript
const tick = () =>
  fetch("/api/backup/tick", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    .then((r) => r.json())
    .then(console.log);
```

---

### 5. Video → archive upload; transcoding skipped (logs)

- Videos upload to **`ARCHIVE_S3_BUCKET`** (Wasabi/S3) as **original bytes**
- Vercel logs (backup tick):  
  `[backup] video archive: transcoding skipped (pass-through) <filename>`
- No `TRANSCODER_ENABLED` env — cost saving is **default** (no transcode)

---

## ENV / DB confirm

- [ ] `PAYMENT_BYPASS=0` or unset (prod)
- [ ] `PAYMENT_AUTO_APPROVE=0` (prod, unless manual UPI test policy)
- [ ] Paid check = **`companies` + `payments`**, not `organizations` / `workspaces`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, Google OAuth, archive S3/Wasabi set
- [ ] Supabase migrations **001–016** applied on prod project
- [ ] Prod DB backup taken (Supabase dashboard)

---

## Final status (fill after test)

| Check | YES/NO |
|-------|--------|
| Paid org: `billing/status` active? | |
| Unpaid org: `active: false`? | |
| Unpaid: `start-auto` → 402? | |
| No cookies → 401? | |
| Multiple `tick` → `files_done` ↑, job completed? | |
| Video log: transcoding skipped? | |
| `drive/google-check` OK? | |

---

## curl quick pack

**This app does not read `x-org-id`.** Auth = workspace cookies after login:

- `bc_workspace_email`
- `bc_workspace_company` (UUID from `companies.id`)

Copy cookies from browser: DevTools → Application → Cookies → your domain.

```bash
export PROD_URL="https://www.bharatcloud.store"

# Unpaid test user (company with subscription_status != active, no approved payment)
export FREE_COOKIE='bc_workspace_email=UNPAID_USER@domain.com; bc_workspace_company=UNPAID_COMPANY_UUID'

# Paid test user (subscription active or approved payment)
export PAID_COOKIE='bc_workspace_email=company@bharatcloud.store; bc_workspace_company=PAID_COMPANY_UUID'

# 1. Billing status
curl -s "$PROD_URL/api/billing/status" -H "Cookie: $FREE_COOKIE" | jq .
# Expect: "active": false   (when PAYMENT_BYPASS off)

curl -s "$PROD_URL/api/billing/status" -H "Cookie: $PAID_COOKIE" | jq .
# Expect: "active": true

# 2. Unpaid → 402
curl -s -w "\nHTTP %{http_code}\n" -X POST "$PROD_URL/api/backup/start-auto" \
  -H "Cookie: $FREE_COOKIE"
# Expect body: Active subscription required... + HTTP 402

# 3. No login cookies → 401
curl -s -w "\nHTTP %{http_code}\n" -X POST "$PROD_URL/api/backup/start-auto"
# Expect: {"error":"Unauthorized"} + HTTP 401

# 4. Paid → 200 (Google must be connected too or 400)
curl -s -w "\nHTTP %{http_code}\n" -X POST "$PROD_URL/api/backup/start-auto" \
  -H "Cookie: $PAID_COOKIE"
# Expect: HTTP 200 + job payload

# Optional: backup tick loop
curl -s -X POST "$PROD_URL/api/backup/tick" -H "Cookie: $PAID_COOKIE" \
  -H "Content-Type: application/json" -d '{}' | jq .

curl -s "$PROD_URL/api/drive/google-check" -H "Cookie: $PAID_COOKIE" | jq .
```

**Wrong (ignored by server):**

```bash
# x-org-id is NOT used in bharatcloud-website
curl -H "x-org-id: FREE_ORG_ID" ...
```
