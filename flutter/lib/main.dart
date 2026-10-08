import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/home_gallery.dart';
import 'screens/otp_login.dart';
import 'screens/plans.dart';
import 'screens/settings.dart';
import 'screens/upload_cleanup.dart';
import 'screens/vault.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const BharatCloudApp());
}

class BharatCloudApp extends StatelessWidget {
  const BharatCloudApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BharatCloud',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0EA5E9),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const OtpLoginScreen(),
      routes: {
        HomeGalleryScreen.route: (_) => const HomeGalleryScreen(),
        UploadCleanupScreen.route: (_) => const UploadCleanupScreen(),
        VaultScreen.route: (_) => const VaultScreen(),
        PlansScreen.route: (_) => const PlansScreen(),
        SettingsScreen.route: (_) => const SettingsScreen(),
      },
    );
  }
}
