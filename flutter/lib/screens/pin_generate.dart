import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'home_gallery.dart';

class PinGenerateScreen extends StatefulWidget {
  const PinGenerateScreen({super.key});

  @override
  State<PinGenerateScreen> createState() => _PinGenerateScreenState();
}

class _PinGenerateScreenState extends State<PinGenerateScreen> {
  final _pinCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  Future<void> _savePin() async {
    if (_pinCtrl.text.length != 4 || _pinCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PINs must match and be 4 digits')),
      );
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bc_pin_hash', _pinCtrl.text.padLeft(4, '0'));
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed(HomeGalleryScreen.route);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create PIN')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Set a 4-digit PIN for daily login after your first OTP.',
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _pinCtrl,
              obscureText: true,
              maxLength: 4,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'PIN'),
            ),
            TextField(
              controller: _confirmCtrl,
              obscureText: true,
              maxLength: 4,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Confirm PIN'),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _savePin, child: const Text('Save PIN')),
          ],
        ),
      ),
    );
  }
}
