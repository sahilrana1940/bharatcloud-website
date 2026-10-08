import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({String? baseUrl})
      : baseUrl = baseUrl ??
            const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: 'http://10.0.2.2:4000',
            );

  final String baseUrl;
  String? jwt;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'x-client-type': 'MOBILE_APP',
        if (jwt != null) 'Authorization': 'Bearer $jwt',
      };

  Future<void> requestForgotPin(String phone) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/b2c/auth/forgot-pin'),
      headers: _headers,
      body: jsonEncode({'phone': phone}),
    );
    if (res.statusCode >= 400) {
      throw Exception(jsonDecode(res.body)['error'] ?? 'Request failed');
    }
  }

  Future<Map<String, dynamic>> uploadBytes(
    List<int> bytes,
    String filename,
  ) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/api/b2c/upload'),
    );
    req.headers['x-client-type'] = 'MOBILE_APP';
    if (jwt != null) {
      req.headers['Authorization'] = 'Bearer $jwt';
    }
    req.files.add(
      http.MultipartFile.fromBytes('file', bytes, filename: filename),
    );
    final streamed = await req.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) {
      final err = jsonDecode(body);
      throw Exception(err['error'] ?? 'Upload failed');
    }
    return jsonDecode(body) as Map<String, dynamic>;
  }
}
