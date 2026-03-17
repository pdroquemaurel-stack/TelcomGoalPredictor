# Processus — badges dynamiques (admin)

## Convention image (obligatoire)
- Dossier: `public/badges/`
- Convention: `<badge.slug>.webp`
- Fallback automatique: `/badges/badge.webp`

Exemple:
- name: `10 Bons Pronos`
- slug: `10-bons-pronos`
- image: `public/badges/10-bons-pronos.webp`
- fallback si absent: `/badges/badge.webp`

## Création d’un badge via l’admin
Depuis `/admin/badges`, un admin peut créer un badge avec:
- `name` (nom affiché)
- `slug` (identifiant technique stable)
- `criterionType`
- `threshold`

Le slug est prérempli à partir du nom, puis modifiable avant validation.

## Critères disponibles
- `PREDICTION_COUNT`: nombre total de pronostics saisis
- `CORRECT_PREDICTION_COUNT`: nombre de bons résultats (victoire/défaite/égalité)
- `EXACT_PREDICTION_COUNT`: nombre de scores exacts

## Règle d’attribution
Le badge est attribué automatiquement si la valeur du critère est `>= threshold`.

Attribution déclenchée:
- après sauvegarde d’un pronostic (utile pour `PREDICTION_COUNT`)
- après settlement des matchs (utile pour `CORRECT_PREDICTION_COUNT` et `EXACT_PREDICTION_COUNT`)

Les doublons sont empêchés par:
- contrainte DB `@@unique([userId, badgeId])` sur `UserBadge`
- `createMany(..., skipDuplicates: true)` dans le service d’attribution.
