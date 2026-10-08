# Hostinger + Wasabi for BharatCloud B2B

Use **Hostinger** for domain/DNS (and optional VPS) and **Wasabi** for the B2B private vault. The Next.js app on Vercel talks to Wasabi over the public S3 API using env vars — no Wasabi SDK required.

## 1. Wasabi (vault storage)

1. Sign in at [Wasabi Console](https://console.wasabisys.com/) (separate from BharatCloud `/b2b/login`).
2. Create a **sub-user** or access key with access only to your vault bucket (least privilege).
3. Create bucket **`bharatcloud-vault`** (or match `WASABI_B2B_BUCKET`) in **ap-southeast-1** (Singapore — lowest latency from India among Wasabi regions).
4. Enable **bucket versioning** (required for soft delete / restore metadata).
5. Copy endpoint, region, access key, and secret into Vercel (or `.env.local`):

| Variable | Example |
| --- | --- |
| `WASABI_ENDPOINT` | `https://s3.ap-southeast-1.wasabisys.com` |
| `WASABI_REGION` | `ap-southeast-1` |
| `WASABI_ACCESS_KEY` | from Wasabi console |
| `WASABI_SECRET_KEY` | from Wasabi console |
| `WASABI_B2B_BUCKET` | `bharatcloud-vault` |

Object layout matches the app: `b2b/{company_id}/…` and `b2b/{company_id}/_trash/…`.

Verify from your machine (after filling `.env.local`):

```bash
node scripts/verify-s3.mjs
```

## 2. Hostinger (domain)

**Recommended:** keep the Next.js app on **Vercel**, use Hostinger only for **DNS** on `bharatcloud.store`.

1. In Hostinger → **Domains** → `bharatcloud.store` → **DNS / Nameservers**.
2. Point the site to Vercel:
   - `@` → Vercel A record (`76.76.21.21`) or CNAME to `cname.vercel-dns.com` (follow Vercel’s domain wizard).
   - `www` → same Vercel target.
3. In Vercel → project **bharatcloud-website** → **Domains** → add `bharatcloud.store` and `www.bharatcloud.store`.
4. Remove the domain from any **old Vite** project so `/b2b` is served by Next.js.

## 3. Hostinger VPS (optional — B2C backend + LSS cron)

B2B uploads run on **Vercel serverless** via Wasabi. The Express app in `/backend` (B2C mobile upload stub + LSS cron) can run on a small Hostinger VPS:

```bash
cd backend && npm ci
# set same WASABI_* or E2E_S3_* plus E2E_S3_HOT_BUCKET / COLD / ARCHIVE if using LSS
PORT=4000 node server.js
```

Use **pm2** or systemd and restrict firewall to health checks only unless you expose B2C APIs publicly.

## 4. Vercel env checklist

Set for **Production** (and Preview if you test B2B there):

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `WASABI_*` (or `E2E_S3_*`)
- `RAZORPAY_KEY` when going live

Redeploy after changing env vars.

## 5. Hostinger + WhatsApp (later)

OTP and admin alerts (MSG91 / WhatsApp Business) are not wired in this repo yet. When you add them, keep **Wasabi keys** on the server only — never in the browser or Flutter app.
