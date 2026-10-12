# Platform admin access (B2B only)

Demo login buttons were removed from `/login`. Use one of the paths below.

## Super admin (Nexus / `/admin/super`)

These emails are **super admin** in code (`src/lib/brand.ts`):

- `admin@bharatcloud.store`
- `sahilrana1940@gmail.com`

### Recommended: create your account once

1. Open **https://bharatcloud.store/signup**
2. Register with **your work email** (e.g. `sahilrana1940@gmail.com`) and a password (min 6 chars).
3. Sign in at **/login** with the same email + password.
4. Open **/admin/super** — super admin is granted by email, not by demo links.

### Google Workspace

Use **Continue with Google Workspace** on `/login` with a Google account whose email matches a registered company owner (after signup).

## Company owner (not super admin)

Any user who signs up via **Create account** becomes the organization owner and can use `/dashboard/owner` and `/dashboard/team`.

## Account recovery

**Keep `/recover` enabled** in production. Employees who lose device/PIN need email-based recovery without calling support.

## Optional env (Vercel)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_B2C` | off | Set `1` to allow `/personal` B2C |
| `ENABLE_DEMO_LOGINS` | off | Set `1` to allow `/api/auth/google/demo` |

B2B go-live: leave both **unset** (blocked).
