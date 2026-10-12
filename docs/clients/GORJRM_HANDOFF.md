# GOR JRM Courier — client handoff & checks

**Product:** BharatCloud / Bharat Tijori  
**Live:** https://www.bharatcloud.store/login  
**Tenant domain:** `gorjrmcourier.com`

---

## Client address (invoice / demo slide)

| Field | Value |
|--------|--------|
| Legal / brand | GOR JRM Courier (RJRM Logistics) |
| Address | Bus Stand, near Honda Agency |
| City / PIN | Sunderbani, Jammu & Kashmir **185153**, India |
| Phone | +91 99888 64626 |
| Email | info@gorjrmcourier.com |
| Website | https://www.gorjrmcourier.com |

*Source: client’s public contact page (verify before legal docs).*

---

## Accounts to verify (owner + 3 employees)

Har row ke liye **teen steps** same hain:

1. Login → workspace open  
2. **Settings** → Google Drive connected (green)  
3. **Employee home** → **Start my backup** (ya Upload / Vault khule)

| Role | Email (prod DB se confirm) | Login | Drive | Backup/upload |
|------|----------------------------|:-----:|:-----:|:-------------:|
| **Owner / admin** | `info@gorjrmcourier.com` | ☐ | ☐ | ☐ |
| **Employee 1 (Sunderbani hub)** | `sunderbanihub@gorjrmcourier.com` | ☐ | ☐ | ☐ |
| **Employee 2 (Nowshera ODH)** | `nowsheraodh@gorjrmcourier.com` | ☐ | ☐ | ☐ |
| **Employee 3 (Rajouri ODH)** | `rajouriodh@gorjrmcourier.com` | ☐ | ☐ | ☐ |

**UI:** Owner login → `/dashboard/company-admin` — address card + live staff list + checklist.

### Backup scope (GOR JRM)

1. **Google Drive archive** → central vault  
2. **CCTV / Upload video** → employee vault  
3. **Gmail archive** (`ENABLE_EMAIL_BACKUP=1`): staff **My mail archive** — apni backup mail; forward **sirf company mail** (`info@`) se, personal Gmail restore nahi.

### Auto-link (ek hi company ID)

- **Ek tenant:** `gorjrmcourier.com` → sab linked emails **same `companyId`** (cookie `bc_workspace_company`).
- **Owner** pehli baar signup (`info@…`) → company create.
- **Staff** (`sunderbanihub@`, `nowsheraodh@`, `rajouriodh@`) → **naya company nahi** — **Log in** ya **Create account** (password 6+) → automatically usi company me `employee` role.
- Owner login ke baad Team list me teen staff rows **pre-link** ho jati hain (pehle login se pehle bhi dikhen).

---

## Prod se employee emails nikalna (Supabase SQL)

```sql
SELECT cu.email, cu.role, cu.saas_role, cu.display_name
FROM company_users cu
JOIN companies c ON c.id = cu.company_id
WHERE c.domain = 'gorjrmcourier.com'
ORDER BY
  CASE WHEN cu.email = c.admin_email THEN 0 ELSE 1 END,
  cu.email;
```

Ya logged-in owner browser console:

```js
fetch("/api/team/users").then((r) => r.json()).then(console.log);
```

---

## Platform checks (aap / super admin)

| Check | Pass? |
|--------|:-----:|
| Landing + login colors OK (incognito, **www** URL) | ☐ |
| `PAYMENT_BYPASS` demo ON **ya** Razorpay paid for backup | ☐ |
| `POST /api/backup/start-auto` unpaid → **402** (bypass off par) | ☐ |
| Super admin `/admin/super` — stats, kharcha panel, logout | ☐ |
| Client ko **demo links** login par nahi dikhte | ☐ |

Detail: `docs/PROD_VERIFY_CHECKLIST.md`, `docs/CLIENT_DEMO_TODAY.md`.

---

## Aur kya kar sakte hain (post-demo)

- Team par **3 real staff invites** + Google Workspace same domain  
- Billing: UPI/Razorpay live, phir `PAYMENT_BYPASS=0`  
- Weekly backup job monitor (`company_backup_jobs` on Nexus / company admin table)  
- Recovery email / PIN flow client ko document  
- Optional: company address DB column (abhi UI `tenant-profile` se aata hai)

---

## Script (optional)

```bash
# Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
node scripts/verify-client-tenant.mjs gorjrmcourier.com
```

Prints owner + members for checklist fill-in.
