# Processus MVP — ajouter des badges (.webp)

## 1) Assets image
- Emplacement recommandé: `public/badges/`
- Format: `.webp`
- Convention de nommage: `<badge.code>.webp` (ex: `predictions-10.webp`)

## 2) Enregistrement en base
Créer un badge dans la table `Badge` avec:
- `code` (unique, slug stable)
- `name`
- `description`

Exemple SQL:
```sql
INSERT INTO "Badge" ("id", "code", "name", "description")
VALUES (gen_random_uuid()::text, 'predictions-10', '10 pronostics', 'Atteindre 10 pronostics enregistrés');
```

## 3) Règle d’obtention
Le mapping de règles MVP est centralisé dans `src/lib/badge-rules.ts`.
Types supportés:
- `total_predictions`
- `winning_predictions`
- `exact_predictions`

## 4) Attribution / recalcul
- Le recalcul peut être déclenché depuis l’admin (onglet **Badge**) via un futur script/job dédié.
- Entrées nécessaires: 
  - total pronostics utilisateur,
  - pronostics gagnants,
  - scores exacts.
- Ensuite, créer les associations dans `UserBadge` pour les badges validés.

## 5) Affichage
La page profil charge tous les badges, affiche en premier ceux obtenus, puis les non obtenus (grisés) dans un carousel horizontal.
