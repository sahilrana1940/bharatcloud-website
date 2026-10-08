import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';

class UploadCleanupScreen extends StatefulWidget {
  const UploadCleanupScreen({super.key});
  static const route = '/upload';

  @override
  State<UploadCleanupScreen> createState() => _UploadCleanupScreenState();
}

class _UploadCleanupScreenState extends State<UploadCleanupScreen> {
  final _picker = ImagePicker();
  final _api = ApiClient();
  final Set<String> _phashIndex = {};
  final List<String> _log = [];

  String _phash(List<int> bytes) {
    final digest = sha256.convert(bytes);
    return base64Encode(digest.bytes.sublist(0, 8));
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    final hash = _phash(bytes);
    if (_phashIndex.contains(hash)) {
      setState(() => _log.add('Duplicate skipped (pHash): ${file.name}'));
      return;
    }
    try {
      await _api.uploadBytes(bytes, file.name);
      _phashIndex.add(hash);
      setState(() => _log.add('Uploaded to HOT: ${file.name}'));
    } catch (e) {
      setState(() => _log.add('Upload failed: $e'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload & Cleanup')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Uploads use x-client-type: MOBILE_APP and land in bharatcloud-b2c-hot.',
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _pickAndUpload(ImageSource.camera),
              icon: const Icon(Icons.photo_camera),
              label: const Text('Camera'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _pickAndUpload(ImageSource.gallery),
              icon: const Icon(Icons.photo_library),
              label: const Text('Gallery'),
            ),
            const SizedBox(height: 16),
            const Text('Activity', style: TextStyle(fontWeight: FontWeight.bold)),
            Expanded(
              child: ListView.builder(
                itemCount: _log.length,
                itemBuilder: (_, i) => Text(_log[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
