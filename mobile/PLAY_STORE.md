# Bickri Service Agency — publication Google Play

## Identité technique
- Application ID: `com.bickriservice.bickri_service_agency`
- Version initiale: `1.0.0+1`
- Target API: Android 16 / API 36
- Format de publication: Android App Bundle (.aab)
- Authentification: e-mail + mot de passe uniquement dans l'application mobile

Google Play exige actuellement API 36 pour les nouvelles applications et mises à jour à partir du 31 août 2026.

## Signature
Le workflow `.github/workflows/mobile-playstore.yml` utilise une clé d'importation dédiée. Ne jamais placer le keystore ou `key.properties` dans le dépôt.

Ajouter dans GitHub > Settings > Secrets and variables > Actions:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEY_ALIAS`

Le keystore doit être une clé RSA d'au moins 2048 bits. Google Play App Signing gère ensuite la clé de signature d'application.

## Fiche Play Store
**Nom:** Bickri Service Agency

**Description courte:**
Découvrez les services, solutions digitales et ressources de Bickri Service Agency depuis votre mobile.

**Description complète:**
Bickri Service Agency est l'application mobile officielle de l'agence digitale Bickri Service Agency.

L'application vous permet de découvrir nos services numériques, nos solutions de création digitale, nos formations et nos ressources pour entrepreneurs et créateurs.

Fonctionnalités:
- Consultation des services de Bickri Service Agency
- Accès aux informations et ressources de l'agence
- Compte personnel avec connexion sécurisée par e-mail et mot de passe
- Interface mobile adaptée aux smartphones Android

L'application évoluera régulièrement avec de nouveaux services et contenus.

**Catégorie recommandée:** Business

## Confidentialité
Politique de confidentialité:
https://bickriservice-agency.vercel.app/privacy-policy.html

## Données / Data Safety
À déclarer précisément dans Play Console selon la version finale:
- Adresse e-mail: collectée pour créer/authentifier le compte
- Données de compte: utilisées pour l'authentification et la gestion de session
- Données transmises via connexion chiffrée
- Pas de vente de données

## Important
Pour publier en production, il faut aussi compléter dans Play Console les informations développeur, la fiche de l'application, le questionnaire de contenu, la section Data safety, la politique de confidentialité et les éléments graphiques. Les comptes personnels créés après le 13 novembre 2023 peuvent être soumis à des exigences de test avant production.
