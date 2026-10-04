# Security Policy — Bickri Service Agency

## Signalement d'une vulnérabilité

Si vous découvrez une faille de sécurité sur Bickri Service Agency, merci de ne pas publier les détails dans une issue publique.

Contactez le propriétaire du projet avec :
- une description de la vulnérabilité ;
- l'URL ou le fichier concerné ;
- les étapes permettant de reproduire le problème ;
- l'impact potentiel ;
- une proposition de correction si vous en avez une.

## Règles de sécurité

- Ne jamais publier de clé API, mot de passe, token ou secret dans le dépôt.
- Les secrets de production doivent rester dans les variables d'environnement du fournisseur de déploiement.
- Toute clé qui aurait été exposée doit être révoquée et remplacée immédiatement.
- Les modifications de sécurité doivent préserver les fonctionnalités existantes.

## Protection du dépôt

Le projet utilise des contrôles de sécurité côté dépôt et des en-têtes HTTP côté déploiement. Les protections d'accès GitHub et les secrets de production doivent rester limités aux personnes autorisées.
