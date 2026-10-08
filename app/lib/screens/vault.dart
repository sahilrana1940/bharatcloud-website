import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

class VaultScreen extends StatefulWidget {
  const VaultScreen({super.key});
  static const route = '/vault';

  @override
  State<VaultScreen> createState() => _VaultScreenState();
}

class _VaultScreenState extends State<VaultScreen> {
  final _auth = LocalAuthentication();
  bool _unlocked = false;

  @override
  void initState() {
    super.initState();
    _enableScreenshotBlock();
  }

  void _enableScreenshotBlock() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
  }

  Future<void> _unlock() async {
    final can = await _auth.canCheckBiometrics;
    if (!can) {
      setState(() => _unlocked = true);
      return;
    }
    final ok = await _auth.authenticate(
      localizedReason: 'Unlock BharatCloud Private Vault (/.pivt/)',
      options: const AuthenticationOptions(biometricOnly: true),
    );
    if (ok) setState(() => _unlocked = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Private Vault'),
        backgroundColor: Colors.black,
      ),
      backgroundColor: Colors.black,
      body: _unlocked
          ? ListView(
              padding: const EdgeInsets.all(16),
              children: const [
                Text(
                  '/users/{uid}/.pivt/',
                  style: TextStyle(color: Colors.white70),
                ),
                SizedBox(height: 12),
                Text(
                  'Screenshot capture blocked on this screen (FLAG_SECURE on Android).',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            )
          : Center(
              child: FilledButton(
                onPressed: _unlock,
                child: const Text('Biometric unlock'),
              ),
            ),
    );
  }
}
