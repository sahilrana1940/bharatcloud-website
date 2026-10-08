# BharatCloud B2C Mobile (Flutter 1.1)

## Screens

1. `otp_login.dart` — MSG91 OTP, daily PIN, forgot PIN → Super Admin backup code
2. `pin_generate.dart` — first-time 4-digit PIN
3. `home_gallery.dart` — HOT / COLD / ARCHIVE with blur-to-clear on COLD
4. `upload_cleanup.dart` — camera/gallery upload, pHash dedupe, `x-client-type: MOBILE_APP`
5. `vault.dart` — `/.pivt/` private vault, biometric gate
6. `plans.dart` — ₹79 / ₹129 POPULAR / 5GB trial, Razorpay stub
7. `settings.dart` — single device lock

## Run

```bash
cd app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://<host>:4000
```

Backend: `cd ../backend && npm start`
