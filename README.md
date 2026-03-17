# TelcomGoalPredictor (MVP)

Application de pronostics football mobile-first pour un public panafricain.

## Scope officiel (état réel du repo)

### Parcours joueur disponibles
- Authentification par **username/password**.
- Onboarding pays.
- Récap quotidien (`/`) puis pronostics (`/predictions`).
- Résultats (`/results`).
- Classements (`/leaderboards`) : global, pays, amis.
- Challenges (`/challenges`) + détail challenge.
- Profil joueur (`/profile`).

### Parcours admin disponibles
- Dashboard (`/admin/dashboard`).
- Compétitions (`/admin/competitions`).
- Fixtures / édition score & statut (`/admin/fixtures`).
- Challenges (`/admin/challenges`).
- Opérations (`/admin/operations`) : sync provider + purge.
- Utilisateurs (`/admin/users`).
- Badges (`/admin/badges`).
- Paramètres globaux (`/admin/settings`).

### Hors scope MVP (masqué/redirigé)
- `/friends` redirige vers leaderboard amis.
- `/shop` redirige vers `/predictions`.
- `/admin/products`, `/admin/ads`, `/admin/campaigns` redirigent vers `/admin/dashboard`.

## Règles cœur produit

- 1 pronostic max par utilisateur/match.
- Pronostic autorisé uniquement avant kickoff et si fixture prédictible.
- Scoring (`src/lib/scoring.ts`) :
  - score exact = 3
  - bon résultat = 1
  - sinon = 0
- Lifecycle fixture : `SCHEDULED` → `LIVE` → `FINISHED` → `SETTLED`.
- Settlement/rescoring idempotent (`src/lib/services/settlement-service.ts`) :
  - premier settlement,
  - relance sans changement,
  - correction de score après settlement,
  sont tous supportés sans double comptage (recalcul par vérité courante).

## Sync admin (provider)

Endpoint: `POST /api/admin/sync`

La réponse inclut :
- succès/échec (`ok` + `data.success`),
- fenêtre sync (`from`, `to`),
- compétitions synchronisées,
- fixtures créées / mises à jour / ignorées,
- total récupéré / total traité,
- résultat settlement,
- erreurs utiles non bloquantes (`errors`).

## Setup local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

App locale: `http://localhost:3000`

## Variables d’environnement

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `FOOTBALL_DATA_API_KEY`

## Comptes demo (seed réel)

> Auth via **username** (pas email).

- Admin: `admin` / `admin123!`
- Joueur: `joueur1` / `joueur1`
- Joueur: `joueur2` / `joueur2`
- Joueur: `player` / `player`

## Commandes utiles

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
npm run prisma:seed
npm run sync:fixtures
```

## Vérifications manuelles recommandées

1. **Sync admin**
   - Aller sur `/admin/operations`.
   - Lancer “Actualiser les matchs depuis l’API”.
   - Vérifier le résumé: compétitions, fixtures créées/mises à jour/ignorées, settlement, erreurs.

2. **Rescoring post-correction**
   - Sur `/admin/fixtures`, choisir un match déjà `SETTLED` avec pronostics.
   - Modifier score puis sauvegarder.
   - Vérifier mise à jour des `pointsAwarded`, profil (`/profile`) et leaderboard (`/leaderboards`).
   - Réappliquer la même valeur : aucun double ajout de points.

3. **Surface MVP**
   - `/friends` doit rediriger vers leaderboard amis.
   - `/shop` doit rediriger vers `/predictions`.
   - Routes admin hors scope (products/ads/campaigns) redirigent vers dashboard.
