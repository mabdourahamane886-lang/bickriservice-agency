import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/routes.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool loading = false;
  bool obscure = true;

  Future<void> login() async {
    if (email.text.trim().isEmpty || password.text.isEmpty) return;
    setState(() => loading = true);

    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: email.text.trim(),
        password: password.text,
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const CircleAvatar(
                    radius: 38,
                    child: Text('B', style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Bickri Service Agency',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Connectez-vous à votre espace client mobile.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withValues(alpha: .7)),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Adresse e-mail',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: password,
                    obscureText: obscure,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => obscure = !obscure),
                        icon: Icon(obscure ? Icons.visibility : Icons.visibility_off),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: loading ? null : login,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator())
                          : const Text('Se connecter'),
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, AppRoutes.register),
                    child: const Text('Créer un compte'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
