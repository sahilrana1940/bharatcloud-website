# Client demo — aaj ke liye (live color + flow)

**Live URL:** https://www.bharatcloud.store  
**Last prod check:** `main` @ `9e9f299` (logout, super cost panel, clean login)

---

## Color / UI — kya client ko dikhega

| Screen | Theme | Brand colors |
|--------|--------|----------------|
| Landing hero | Dark navy + blue glow | Cyan/sky gradient CTA, white headline |
| Landing neeche | Light (`slate-50` / white) | Cyan icons, orange promo bar, pricing cards |
| Login | Light gradient card | Orange “India”, cyan “safe”, blue primary button |
| Workspace / admin | Light shell | Cyan accents (dashboard cards thode aur polish ho sakte hain) |

**Demo links login par nahi** — sirf Sign in, Google Workspace, Create account, Recovery.

---

## 5 minute client script

1. **Landing** — hero dark + neeche light sections scroll karo (trust stats, features, pricing).
2. **Signup** — `owner@clientdomain.com` + company (ya unka existing tenant login).
3. **Dashboard** — Team, storage meter, Settings → **Google Drive connect**.
4. **Billing** — Razorpay/UPI (ya super admin se payment approve / demo ke liye bypass — neeche).
5. **Backup** — employee view par “Start backup” / admin par auto job.
6. **Optional super admin** — `/admin/super` (aapke email se): Nexus stats, **kharcha panel**, PAYMENT_BYPASS toggle *sirf demo*.

Super admin access: `docs/ADMIN_ACCESS.md` (`admin@bharatcloud.store`, `sahilrana1940@gmail.com`).

---

## Vercel env — demo vs real billing

| Goal | Production env |
|------|----------------|
| Client ko backup **bina payment** dikhani hai | `PAYMENT_BYPASS=1` **ya** super admin cookie toggle ON |
| Real go-live billing | `PAYMENT_BYPASS=0`, `PAYMENT_AUTO_APPROVE=0`, `ENABLE_DEMO_LOGINS=0`, `ENABLE_B2C=0` |

Full API checks: `docs/PROD_VERIFY_CHECKLIST.md`.

---

## Quick prod smoke (agent ne verify kiya)

- `GET /` → **200**, hero + light sections CSS live.
- `GET /api/billing/status` (no cookie) → `active: false`, Unauthorized path OK.
- `POST /api/backup/start-auto` (no cookie) → **401**.

Screenshots (reference): run `node scripts/live-color-screenshots.mjs` → `/opt/cursor/artifacts/screenshots/`.

---

## Agar kuch ulta dikhe

- Hard refresh / incognito (Vercel `age: 0` = fresh deploy).
- Always **www**: `https://www.bharatcloud.store` (bare domain 308 redirect).
- Login password: abhi org existence + length check — client ko **pehle signup** ya aap set password flow confirm karo.
