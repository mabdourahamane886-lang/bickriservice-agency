# Statistiques intelligentes des partenaires — PyTorch

## Ce qui est ajouté

- Service FastAPI séparé dans `analytics_service/`, adapté à un hébergement Python.
- Lecture des événements déjà enregistrés dans `public.agency_partner_clicks`.
- Agrégats sur 90 jours, classement des partenaires et ventilation par type d'événement.
- Prévision indicative sur 7 jours avec une régression linéaire PyTorch lorsque l'historique contient au moins 14 jours et 30 événements.
- Tableau de bord administrateur statique : `/partenaires/admin/analytics.html`.

Aucun chiffre fictif n'est ajouté. Les événements historiques absents ne peuvent pas être reconstitués.

## Déploiement du service Python

1. Dans Render, créez un nouveau service Web à partir de ce dépôt.
2. Définissez le répertoire racine sur `analytics_service` et utilisez `render.yaml` ou les commandes :
   - Build : `pip install -r requirements.txt`
   - Start : `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Configurez les variables secrètes :
   - `SUPABASE_URL` : URL du projet Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` : clé service_role, uniquement dans les variables secrètes du serveur.
   - `ALLOWED_ORIGINS` : domaines exacts du site, séparés par des virgules.
4. Vérifiez `https://VOTRE-SERVICE/health`, qui doit répondre avec `{"status":"ok"}`.
5. Ouvrez `/partenaires/admin/`, connectez-vous avec un compte administrateur, puis ouvrez `/partenaires/admin/analytics.html`.
6. Collez l'URL HTTPS du service Python dans le tableau de bord et cliquez sur « Enregistrer l’URL », puis « Charger les statistiques ».

## Sécurité et limites

- Le service vérifie le jeton de session via Supabase Auth puis vérifie le rôle administrateur côté serveur.
- Ne placez jamais la clé service_role dans le navigateur, dans GitHub, ou dans un fichier public.
- Le tableau de bord utilise le jeton de session de l'administration existante ; ouvrez-le dans le même navigateur et la même origine.
- Les statistiques sont limitées à 10 000 événements récents pour maîtriser les coûts. Augmentez cette limite et ajoutez une pagination si le volume dépasse cette capacité.
- La prévision est un modèle de tendance simple, pas un modèle de prévision avancé. Elle doit être évaluée sur les données réelles avant toute décision commerciale.
- Les données indiquent des événements, pas des visiteurs uniques. Le système n'effectue pas de suivi invasif ni de fingerprinting.
