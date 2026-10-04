import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  static const services = [
    ('Création de sites web', Icons.language),
    ('Applications mobiles', Icons.phone_android),
    ('Design graphique', Icons.palette_outlined),
    ('Marketing digital', Icons.campaign_outlined),
    ('Réseaux sociaux', Icons.people_outline),
    ('Intelligence artificielle', Icons.auto_awesome),
    ('E-commerce', Icons.shopping_bag_outlined),
    ('Formation & coaching', Icons.school_outlined),
  ];

  Future<void> logout(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bickri Service Agency'),
        actions: [
          IconButton(
            tooltip: 'Déconnexion',
            onPressed: () => logout(context),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          const Text(
            'Bienvenue 👋',
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            user?.email ?? '',
            style: TextStyle(color: Colors.white.withValues(alpha: .65)),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                colors: [Color(0xFF12233D), Color(0xFF08101F)],
              ),
              border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: .35)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Votre agence digitale au Niger', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                SizedBox(height: 8),
                Text('Commandez vos services, suivez vos projets et accédez à Bickri AI depuis l’application.'),
              ],
            ),
          ),
          const SizedBox(height: 28),
          const Text('Nos services', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...services.map(
            (service) => Card(
              child: ListTile(
                leading: CircleAvatar(child: Icon(service.$2)),
                title: Text(service.$1),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {},
              ),
            ),
          ),
        ],
      ),
    );
  }
}
