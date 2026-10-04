import 'package:flutter/material.dart';

import '../core/config/app_config.dart';
import '../features/auth/auth_gate.dart';
import '../features/home/home_page.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import 'routes.dart';

class BickriServiceAgencyApp extends StatelessWidget {
  const BickriServiceAgencyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.brandName,
      debugShowCheckedModeBanner: false,
      theme: AppConfig.theme,
      initialRoute: AppRoutes.auth,
      routes: {
        AppRoutes.auth: (_) => const AuthGate(),
        AppRoutes.login: (_) => const LoginPage(),
        AppRoutes.register: (_) => const RegisterPage(),
        AppRoutes.home: (_) => const HomePage(),
      },
    );
  }
}
