# GOR JRM demo — start here (≈60–90 min)

## Phase A — You (10 min)

### Vercel env (Production)

| Variable | Value |
|----------|--------|
| `SUPER_ADMIN_PASSWORD` | Secret — platform login |
| `BILLING_UPI_LIVE` | `0` until real VPA ready |
| `PAYMENT_AUTO_APPROVE` | `0` |
| `PAYMENT_BYPASS` | `0` |
| `GMAIL_CONNECT_REQUIRES_APPROVAL` | `1` when you want Gmail only after you approve |

**Redeploy** after any env change.

### Supabase

1. SQL Editor → paste **`scripts/gorjrm-supabase-bundle.sql`** → Run.
2. Success = no red errors.

---

## Phase B — Super admin (you) — 15 min

1. https://www.bharatcloud.store/login  
2. Email: **support@bharatcloud.com**  
3. Must land on **`/admin`** (Command center).  
4. Open **UPI approvals** — queue should load (empty OK).  
5. Open **Members** — list loads.  
6. Open **Gmail access** — pending list (empty until staff tries connect).

---

## Phase C — Company owner (GOR JRM) — 15 min

1. Login owner email (e.g. `info@gorjrmcourier.com`).  
2. **Billing** → plan → pay flow → paste **screenshot link** → Request activation.  
3. Super admin → **UPI approvals** → **Approve**.  
4. **Team & backup** → Connect Google Drive → start backup.

---

## Phase D — Each employee hub — 15 min × staff

Example: `sunderbanihub@gorjrmcourier.com`

1. If Gmail gate ON: **Connect Gmail** once → super admin **Gmail access** → Approve → connect again.  
2. **My mail archive** → Connect Gmail → **Start my email backup** → 3 green checks.  
3. **Search** a word → **Forward from company mail** on one row.  
4. Optional: upload / vault.

Repeat for Nowshera, Rajouri hubs.

---

## Pass criteria

- [ ] Super admin never stuck on company-owner dashboard  
- [ ] UPI approve activates owner billing  
- [ ] ≥1 employee mail in archive + search works  
- [ ] Drive backup runs without 402 (demo tenant)

---

## URLs cheat sheet

| Who | URL |
|-----|-----|
| Super admin | `/admin`, `/admin/payments`, `/admin/members`, `/admin/gmail` |
| Owner | `/dashboard/owner`, `/dashboard/team`, `/dashboard/billing` |
| Employee | `/dashboard/employee/mail` |
