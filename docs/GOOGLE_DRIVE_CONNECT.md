# Google Drive connect (Phase 2)

## 1. Google Cloud Console

1. Create or open a project → **APIs & Services** → enable **Google Drive API** (and **Gmail API** if mail backup).
2. **OAuth consent screen** → add scopes: `drive`, `gmail.readonly`, `email`, `profile`.
3. **Credentials** → **OAuth client ID** → Web application.
4. **Authorized redirect URIs** (must match exactly):
   - `https://YOUR-DOMAIN/api/auth/google/drive/callback` (Settings → Integrations, 1-click)
   - Optional team login: `https://YOUR-DOMAIN/api/auth/google/callback`
   - Add Vercel preview URLs if needed.

## 2. Vercel environment variables

| Variable | Example |
|----------|---------|
| `GOOGLE_CLIENT_ID` | from Console |
| `GOOGLE_CLIENT_SECRET` | from Console |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-DOMAIN/api/auth/google/drive/callback` |
| `GOOGLE_OAUTH_REDIRECT_URI` | optional: `…/api/auth/google/callback` for legacy team login |
| `ENCRYPTION_KEY` | long random string (encrypts refresh tokens in DB) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-DOMAIN` |
| `GOOGLE_SCOPES` | **Leave unset** unless you know the full URLs. Never use `…/auth/drive` or `…/auth/gmail` alone (Google returns `invalid_scope`). |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Drive DB + storage) |

Enable for **Production** and **Preview**. Redeploy.

## 3. Automatic backup flow (post-payment)

1. **Billing** → **I have paid** → redirects to **Team & backup** (set `PAYMENT_AUTO_APPROVE=1` on Vercel to auto-approve UPI for testing).
2. **Settings** → **Integrations** → **Connect Google Drive** (popup OAuth, `drive.file`, offline + consent).
3. Or Team page CTA → same Settings flow (no OAuth Playground).
3. After OAuth, app calls `POST /api/backup/start-auto` and polls `/api/backup/tick` until Drive status is **Archived**.
4. Archive uploads go to `ARCHIVE_S3_BUCKET` (default `bharatcloud-archiver`) as `{company_id}/…` keys.

Run SQL migration `014_company_backup_jobs.sql` in Supabase.

## 4. Verify backup

1. **Drive** → **BharatCloud Safe Drive** — backed-up files appear here.
2. Videos are stored **without re-encoding** (original bytes). Images may be stored as WebP.

## 5. Bulk (6 years)

Current sync lists **50 files per run**. Plan a dedicated archiver job with pagination before full migration.
