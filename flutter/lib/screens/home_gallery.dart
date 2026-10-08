import 'package:flutter/material.dart';

import 'plans.dart';
import 'settings.dart';
import 'upload_cleanup.dart';
import 'vault.dart';

enum StorageTier { hot, cold, archive }

class GalleryItem {
  GalleryItem({
    required this.id,
    required this.title,
    required this.tier,
    required this.ageDays,
    required this.thumbUrl,
  });

  final String id;
  final String title;
  final StorageTier tier;
  final int ageDays;
  final String thumbUrl;
}

class HomeGalleryScreen extends StatefulWidget {
  const HomeGalleryScreen({super.key});
  static const route = '/home';

  @override
  State<HomeGalleryScreen> createState() => _HomeGalleryScreenState();
}

class _HomeGalleryScreenState extends State<HomeGalleryScreen> {
  StorageTier _filter = StorageTier.hot;

  final _items = [
    GalleryItem(
      id: '1',
      title: 'Sunset Jaipur',
      tier: StorageTier.hot,
      ageDays: 3,
      thumbUrl: '',
    ),
    GalleryItem(
      id: '2',
      title: 'Family trip',
      tier: StorageTier.cold,
      ageDays: 22,
      thumbUrl: '',
    ),
    GalleryItem(
      id: '3',
      title: 'Wedding clip',
      tier: StorageTier.archive,
      ageDays: 90,
      thumbUrl: '',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final visible = _items.where((e) => e.tier == _filter).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('BharatCloud Gallery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, SettingsScreen.route),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.photo_library), label: 'Gallery'),
          NavigationDestination(icon: Icon(Icons.cloud_upload), label: 'Upload'),
          NavigationDestination(icon: Icon(Icons.lock), label: 'Vault'),
          NavigationDestination(icon: Icon(Icons.payments), label: 'Plans'),
        ],
        onDestinationSelected: (i) {
          switch (i) {
            case 1:
              Navigator.pushNamed(context, UploadCleanupScreen.route);
            case 2:
              Navigator.pushNamed(context, VaultScreen.route);
            case 3:
              Navigator.pushNamed(context, PlansScreen.route);
          }
        },
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SegmentedButton<StorageTier>(
              segments: const [
                ButtonSegment(value: StorageTier.hot, label: Text('HOT 0–15d')),
                ButtonSegment(value: StorageTier.cold, label: Text('COLD 15–60d')),
                ButtonSegment(
                  value: StorageTier.archive,
                  label: Text('ARCHIVE 60+d'),
                ),
              ],
              selected: {_filter},
              onSelectionChanged: (s) => setState(() => _filter = s.first),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemCount: visible.length,
              itemBuilder: (context, index) {
                final item = visible[index];
                return _BlurToClearTile(item: item);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BlurToClearTile extends StatefulWidget {
  const _BlurToClearTile({required this.item});
  final GalleryItem item;

  @override
  State<_BlurToClearTile> createState() => _BlurToClearTileState();
}

class _BlurToClearTileState extends State<_BlurToClearTile> {
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    final blur = widget.item.tier == StorageTier.cold && !_revealed;
    return GestureDetector(
      onTap: () => setState(() => _revealed = true),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.blueGrey.shade800,
          image: DecorationImage(
            image: NetworkImage(
              'https://picsum.photos/seed/${widget.item.id}/400/400',
            ),
            fit: BoxFit.cover,
            colorFilter: blur
                ? ColorFilter.mode(
                    Colors.black.withValues(alpha: 0.55),
                    BlendMode.darken,
                  )
                : null,
          ),
        ),
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black87, Colors.transparent],
              ),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(12),
              ),
            ),
            child: Text(
              '${widget.item.title} · ${widget.item.ageDays}d',
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ),
      ),
    );
  }
}
