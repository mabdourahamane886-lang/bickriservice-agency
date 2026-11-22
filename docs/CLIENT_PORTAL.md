# Espace client et gestion des demandes — BSA

## Portée (sans refonte graphique)

Les couleurs, les 37 services, les profils partenaires, Bickri IA et les liens de partage restent inchangés.

- **/espace-client/** : création de compte ou connexion Supabase Auth, demande de devis ou rendez-vous, suivi des statuts, consultation du montant proposé et notifications internes.
- **/admin-clients/** : accès exclusivement aux comptes figurant dans `public.bickri_admin_users`. L’administrateur peut mettre à jour le statut, renseigner un montant indicatif en FCFA et répondre au client.
- **/api/client/** : endpoints sécurisés Cloudflare Worker avec jeton Supabase validé côté serveur, contrôle d’origine, Turnstile obligatoire pour la création et filtrage systématique par identifiant d’utilisateur.
- **Base Supabase** : migration `supabase/migrations/20261122143000_agency_client_portal.sql`, tables privées sans accès direct `anon` ni `authenticated`.
- **Notifications** : internes à l’espace client ; il ne s’agit pas d’e-mails automatiques ni de notifications push.

## Configuration requise

1. Déployer la migration SQL dans le projet Supabase de l’agence.
2. Vérifier la présence du secret Cloudflare Worker `SUPABASE_SERVICE_ROLE_KEY` (ne jamais le mettre dans le front).
3. Vérifier `TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` ainsi que les domaines autorisés.
4. Configurer dans Supabase Auth les domaines de redirection / e-mail de confirmation pour `https://bickriservice-agency.org/espace-client/`.
5. Vérifier qu’au moins un administrateur autorisé figure dans `bickri_admin_users`.

## Parcours de vérification

- Connecter deux comptes utilisateurs différents : chaque compte ne doit voir que ses propres demandes/notifications.
- Soumettre un formulaire avec Turnstile ; constater une nouvelle demande et un identifiant `BSA-...`.
- Se connecter en administrateur, changer le statut et saisir un montant, puis vérifier la notification et la mise à jour dans le compte du client.
- Tester le refus d’accès administrateur sur un compte ordinaire ; tester l’accès sans jeton.
- Tester la version mobile et le maintien de toutes les anciennes pages.
- Exécuter `node scripts/verify-client-portal.mjs` et les tests GitHub Actions.

## Limites claires

- **Paiements :** le champ Mobile Money enregistre seulement une préférence. Aucun encaissement automatique, débit ou vérification de paiement n’a lieu avant intégration d’un prestataire agréé et de ses identifiants marchands.
- **Rendez-vous :** le client propose une date ; l’agence doit confirmer manuellement le créneau.
- **Devis :** les montants sont saisis par l’administrateur après étude du projet, sans tarification fictive.
- **Notifications :** visibles uniquement après connexion ; la livraison e-mail/push nécessite des services supplémentaires.

## Déploiement

La branche `main` déclenche le workflow Cloudflare Workers existant. Contrôler le résultat de l’action GitHub avant d’affirmer que les pages sont effectivement en production.
