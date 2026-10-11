# BharatCloud — India-first storage & servers (founder policy)

## Brand (what customers hear)

- **Bharat** = the cloud name for Indian businesses today.
- **Bharat Tijori** = trust, company, invoices (`bharattijori.com`).
- **BharatCloud** = the product (backup, vault, team, owner dashboard).

One line: **“Bharat’s business cloud — storage and control for India.”**

## Your rule: storage & servers for India

| Layer | Start (pilots, 0–5 clients) | Target (when revenue supports) |
| --- | --- | --- |
| **App** | Vercel + `www.bharattijori.com` (Indian customers, UPI, Hindi support) | Optional: Next.js on **Hostinger VPS Mumbai** |
| **Database** | **Supabase** project in **closest South Asia region** (pick Mumbai/Singapore — prefer Mumbai when offered) | Self-hosted Postgres on **Mumbai VPS** |
| **File storage** | **Private** Supabase buckets; no public URLs | **Wasabi** `ap-southeast-1` or **Indian S3-compatible** (E2E / local DC) under `bharatcloud-*` buckets |
| **Secrets / keys** | Vercel env, India-based founder ops | Same; audit log for owners |

**Honest marketing:** Say “India-first hosting strategy” and “private encrypted vault” — do not claim “every byte only in India” until Mumbai DB + Indian object storage are actually wired.

## Technical “start from what’s right”

1. Supabase (hosted) + private buckets — **now**
2. Google OAuth + real uploads — **now**
3. Move heavy files to Wasabi with `WASABI_*` env — **after first paying client**
4. Mumbai VPS for API/DB — **after 3–5 paying companies**

## Competitors

Do not fight Google/Jio on “free unlimited drive.” Sell **owner backup, team exit safety, Bharat Tijori trust, UPI yearly plans for Indian SMEs**.
