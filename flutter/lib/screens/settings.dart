import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  static const route = '/settings';

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _secure = const FlutterSecureStorage();
  String? _boundDeviceId;

  @override
  void initState() {
    super.initState();
    _loadDevice();
  }

  Future<void> _loadDevice() async {
    final id = await _secure.read(key: 'bc_device_id');
    setState(() => _boundDeviceId = id);
  }

  Future<void> _bindThisDevice() async {
    final deviceId = '${Platform.operatingSystem}-${DateTime.now().millisecondsSinceEpoch}';
    await _secure.write(key: 'bc_device_id', value: deviceId);
    setState(() => _boundDeviceId = deviceId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Single device lock enabled for this phone')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const ListTile(
            title: Text('Single Device Lock'),
            subtitle: Text('1 BharatCloud account = 1 device ID'),
          ),
          ListTile(
            title: const Text('Bound device'),
            subtitle: Text(_boundDeviceId ?? 'Not bound'),
            trailing: FilledButton(
              onPressed: _bindThisDevice,
              child: const Text('Bind this device'),
            ),
          ),
          const Divider(),
          const ListTile(
            title: Text('Security'),
            subtitle: Text('JWT + presigned URLs (15 min) · uploads mobile-only'),
          ),
        ],
      ),
    );
  }
}
