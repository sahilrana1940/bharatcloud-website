# Google Drive connect (Phase 2)

## 1. Google Cloud Console

1. Create or open a project → **APIs & Services** → enable **Google Drive API** (and **Gmail API** if mail backup).
2. **OAuth consent screen** → add scopes: `drive`, `gmail.readonly`, `email`, `profile`.
3. **Credentials** → **OAuth client ID** → Web application.
4. **Authorized redirect URIs** (must match exactly):
   - `https://www.bharattijori.com/api/auth/google/callback`
   - Add each Vercel preview URL if you test on preview:  
     `https://YOUR-PROJECT.vercel.app/api/auth/google/callback`

## 2. Vercel environment variables

| Variable | Example |
|----------|---------|
| `GOOGLE_CLIENT_ID` | from Console |
| `GOOGLE_CLIENT_SECRET` | from Console |
| `GOOGLE_REDIRECT_URI` | `https://www.bharattijori.com/api/auth/google/callback` |
| `NEXT_PUBLIC_APP_URL` | `https://www.bharattijori.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Drive DB + storage) |

Enable for **Production** and **Preview**. Redeploy.

## 3. Connect in the app

1. Log in with password as `info@gorjrmcourier.com` (existing company).
2. Open **Team** → **Connect Google Drive**.
3. Sign in with the **same** Google account (`info@gorjrmcourier.com`).
4. Green banner → **Sync Drive** on that user (backs up up to 50 files per run today).

## 4. Verify backup

1. **Drive** → **BharatCloud Safe Drive** — backed-up files appear here.
2. Videos are stored **without re-encoding** (original bytes). Images may be stored as WebP.

## 5. Bulk (6 years)

Current sync lists **50 files per run**. Plan a dedicated archiver job with pagination before full migration.
