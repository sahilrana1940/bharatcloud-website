# bharatcloud.store live — 2 minute fix

**Problem:** Domain Vercel par hai, par **galat project** (purani Vite site).  
**Solution:** Domain ko project `bharatcloud-website` par lagao.

## Option A — Cursor Agent (recommended)

Agent secrets mein add karo:

- `VERCEL_TOKEN` — [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token

Phir agent ko bolo: `VERCEL_TOKEN` se `scripts/vercel-go-live.sh` chalao.

## Option B — Khud Vercel UI

1. [vercel.com](https://vercel.com) → project **bharatcloud-website**
2. **Settings → Domains** → Add `bharatcloud.store` + `www.bharatcloud.store`
3. Purane project se ye domains **Remove** karo
4. **Deployments → Redeploy**

Test: `https://www.bharatcloud.store/login` → 200, B2B page.

## Baad mein (env)

Vercel → Environment Variables: Supabase + Wasabi (`docs/hostinger-wasabi.md`).
