# Full concept demo (BharatCloud)

Rough **wall-clock** time if one person does Supabase + Vercel and you test flows in parallel: **about 2–4 hours** (not calendar days).

## Vercel env (today — no real money to your UPI)

| Variable | Value for today |
|----------|-----------------|
| `BILLING_UPI_LIVE` | `0` (default) — **no real UPI collect** |
| `PAYMENT_AUTO_APPROVE` | `0` — customer must get **super admin approve** |
| `PAYMENT_BYPASS` | `0` unless you want to skip payment gate entirely |
| `NEXT_PUBLIC_UPI_ID` | leave empty while `BILLING_UPI_LIVE=0` |
| `RAZORPAY_*` | leave empty — Team “Upgrade” sends users to **Billing** page |

**Redeploy** after env changes (~3–5 min).

## Supabase SQL (~10–15 min)

In **SQL Editor**, run migrations **021, 022, 023, 024** (files under `supabase/migrations/`), then:

```sql
notify pgrst, 'reload schema';
```

## Demo script (play the whole product)

### 1. Company owner (~20 min)

1. Login as owner (`company@bharatcloud.store` or your owner email).
2. **Billing** → pick plan → green **Request plan activation** (not real UPI).
3. Super admin: **Admin → Approve payments** → **Approve** → owner sees active subscription.
4. **Team** → Connect Google Drive → start backup.
5. **Dashboard / emails** (owner) — company mail search if mail is backed up.

### 2. Super admin (~5 min)

1. Open `/admin/super` (super-admin email only).
2. Keep **PAYMENT_BYPASS** OFF for a realistic billing story.
3. `/admin/payments` — approve pending UPI requests.

### 3. Each employee hub (~15 min × staff)

1. `/dashboard/employee/mail` → Connect Gmail → **Start my email backup**.
2. Wait for 3 green checks.
3. **Search** archived mail → **Forward from company mail** on one row.
4. Upload / vault if you show CCTV or files.

### 4. Smoke checklist

- [ ] No money left your phone (rehearsal banner on Billing).
- [ ] After super admin approve, backup APIs not 402.
- [ ] At least one employee mail visible + search works.

## When you want real UPI later

1. Set `NEXT_PUBLIC_UPI_ID` + `NEXT_PUBLIC_UPI_PAYEE_NAME`.
2. Set `BILLING_UPI_LIVE=1`.
3. Keep `PAYMENT_AUTO_APPROVE=0` until you trust auto-settlement.
4. Redeploy.

## Razorpay

Enable only when keys are set **and** you want card/links. Until then, flows use UPI page + manual approval.
