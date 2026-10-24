# BharatCloud (Firebase + IDrive E2)

Next.js 14 app — Google login, per-user backup prefix on IDrive E2.

## Setup

1. Copy `.env.local.example` to `.env.local` (or edit the included `.env.local`).
2. Add **IDrive** keys:
   - `IDRIVE_ACCESS_KEY`
   - `IDRIVE_SECRET_KEY`
3. Add **Firebase Admin** service account (one-line JSON):
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
4. In [Firebase Console](https://console.firebase.google.com/) → Authentication → enable **Google** sign-in.
5. Add `http://localhost:3000` to authorized domains if needed.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## API

- `POST /api/upload` — `Authorization: Bearer <Firebase ID token>`, `multipart/form-data` field `file`
- `GET /api/files` — lists objects under `{uid}/` with 5-minute presigned download URLs

Secrets never go to the browser; only the AWS SDK runs on the server.
