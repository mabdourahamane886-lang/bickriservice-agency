# Bickri Service Agency — Application mobile

Cette application Flutter est séparée du site web existant.

## Authentification

La connexion est **uniquement dans l'application mobile** :
- e-mail + mot de passe ;
- création de compte ;
- session Supabase ;
- déconnexion.

Aucun formulaire de connexion n'est ajouté à `index.html` ou au site Vercel.

L'application utilise le projet Supabase existant avec une **publishable key** côté client. Ne jamais utiliser la `service_role_key` dans l'application.

## Lancer l'application

Depuis le dossier `mobile` :

```bash
flutter pub get
flutter run --dart-define=SUPABASE_URL=https://okdohokhlkxrmxpevees.supabase.co --dart-define=SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLISHABLE
```

Pour une version release :

```bash
flutter build apk --release --dart-define=SUPABASE_URL=https://okdohokhlkxrmxpevees.supabase.co --dart-define=SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLISHABLE
flutter build appbundle --release --dart-define=SUPABASE_URL=https://okdohokhlkxrmxpevees.supabase.co --dart-define=SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLISHABLE
```

Le fichier AAB sera produit par Flutter dans `build/app/outputs/bundle/release/`.

## Important

Le dossier du site à la racine reste inchangé. L'application est isolée sous `mobile/`.
