import 'package:flutter/material.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});
  static const route = '/plans';

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  String? _selected;

  void _checkout(String planId) {
    setState(() => _selected = planId);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Razorpay checkout: $planId (wire RAZORPAY_KEY)')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plans')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _PlanCard(
            title: 'Free trial',
            storage: '5 GB · 3 days',
            price: '₹0',
            selected: _selected == 'trial',
            onTap: () => _checkout('trial'),
          ),
          _PlanCard(
            title: 'Standard',
            storage: '60 GB',
            price: '₹79 / mo',
            selected: _selected == '60gb',
            onTap: () => _checkout('60gb'),
          ),
          _PlanCard(
            title: 'Popular',
            storage: '100 GB',
            price: '₹129 / mo',
            popular: true,
            selected: _selected == '100gb',
            onTap: () => _checkout('100gb'),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.storage,
    required this.price,
    required this.onTap,
    this.popular = false,
    this.selected = false,
  });

  final String title;
  final String storage;
  final String price;
  final bool popular;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Row(
          children: [
            Text(title),
            if (popular) ...[
              const SizedBox(width: 8),
              Chip(
                label: const Text('POPULAR', style: TextStyle(fontSize: 10)),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ],
        ),
        subtitle: Text('$storage · $price'),
        trailing: selected ? const Icon(Icons.check_circle) : const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
