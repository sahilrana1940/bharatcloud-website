# Generic multi-tenant (any company domain)

## One company = one `companies.domain`

- Signup/login uses email domain → single `company_id`.
- Any `*@domain` mailbox can join (register/login) when domain matches.
- Optional **client profile** in `src/lib/tenant-profile.ts` (address, handoff emails) — not required.

## Domain directory (Settings → Connect domain)

- `POST /api/domain/discover-emails` — set domain, add manual mailboxes.
- `GET /api/domain/discover-emails` — list `company_users` where email ends with `@domain` + MX hint.
- `POST /api/domain/sync-team` — owner refreshes team rows (Team page auto-calls).

## Central vault

- `GET /api/backup/archive-list` — **company_id only** (all staff see same archived Drive files).
- Dedup: `file_hash` per company, skip re-upload within 24h (`company_archive_files`).

## One-click backup (owner)

- Team → **Enable backup** → `POST /api/backup/enable` `{ email }` (mailbox must have Google connected).

## DB migration

Run `supabase/migrations/016_company_generic_backup.sql` on prod.

## GOR JRM (first test client)

- Domain: `gorjrmcourier.com`, owner `info@`
- Handoff emails in `tenant-profile` seed directory on sync
- Team should show hub + 2 ODH without manual invite after owner opens Team
