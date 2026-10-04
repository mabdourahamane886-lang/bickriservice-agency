import 'package:flutter/material.dart';

class AppConfig {
  static const brandName = 'Bickri Service Agency';
  static const siteUrl = 'https://bickriservice-agency.vercel.app/';
  static const whatsappNumber = '+22700000000';

  static final theme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF08101F),
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFD4AF37),
      brightness: Brightness.dark,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF111B2E),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
    ),
  );
}
