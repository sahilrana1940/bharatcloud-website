import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_client.dart';
import 'home_gallery.dart';
import 'pin_generate.dart';

class OtpLoginScreen extends StatefulWidget {
  const OtpLoginScreen({super.key});

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _api = ApiClient();

  bool _hasPin = false;
  bool _otpSent = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadPinState();
  }

  Future<void> _loadPinState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _hasPin = prefs.getString('bc_pin_hash') != null);
  }

  Future<void> _sendOtp() async {
    setState(() => _loading = true);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    setState(() {
      _otpSent = true;
      _loading = false;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('MSG91 OTP sent (demo: use 1234)')),
      );
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text != '1234') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid OTP')),
      );
      return;
    }
    if (!_hasPin) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const PinGenerateScreen()),
      );
      return;
    }
    Navigator.of(context).pushReplacementNamed(HomeGalleryScreen.route);
  }

  Future<void> _loginWithPin() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString('bc_pin_hash');
    if (stored == null || stored != _hashPin(_pinCtrl.text)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Incorrect PIN')),
      );
      return;
    }
    Navigator.of(context).pushReplacementNamed(HomeGalleryScreen.route);
  }

  Future<void> _forgotPin() async {
    try {
      await _api.requestForgotPin(_phoneCtrl.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Super Admin notified. Check email for backup code to reset PIN.',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  String _hashPin(String pin) => pin.padLeft(4, '0');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'BharatCloud',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('Made in Bharat · Self-hosted backup'),
              const Spacer(),
              if (!_hasPin || _otpSent) ...[
                TextField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone (+91)'),
                ),
                const SizedBox(height: 12),
                if (!_otpSent)
                  FilledButton(
                    onPressed: _loading ? null : _sendOtp,
                    child: Text(_loading ? 'Sending…' : 'Send OTP (MSG91)'),
                  )
                else ...[
                  TextField(
                    controller: _otpCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'OTP'),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _verifyOtp,
                    child: const Text('Verify OTP'),
                  ),
                ],
              ] else ...[
                TextField(
                  controller: _pinCtrl,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(labelText: 'Daily 4-digit PIN'),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _loginWithPin,
                  child: const Text('Login with PIN'),
                ),
                TextButton(onPressed: _forgotPin, child: const Text('Forgot PIN?')),
              ],
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
