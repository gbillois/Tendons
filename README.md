# My Own Workout

Application web de programmes d'entraînement : crée tes programmes, charge celui que tu suis, et déroule tes séances guidées.
HTML/CSS/JS, sans dépendance, données en localStorage.

## Programmes

Un **programme** regroupe tout ce qu'il faut pour s'entraîner :

- sa **bibliothèque d'exercices** (mouvements, durées, répétitions, séries, repos, charge, variantes) ;
- ses **jours**, chacun avec ses exercices, sa consigne, son nombre de séances et une note optionnelle ;
- ses **règles / consignes** affichées sur le plan ;
- son mode d'**évaluation** après chaque exercice : douleur (0-10), effort perçu RPE (0-10) ou aucune ;
- son **enchaînement** : automatique (les repos s'enchaînent seuls) ou **manuel** (chaque répétition et chaque repos attend « Suivant »).

Plusieurs programmes coexistent, un seul est chargé à la fois. Chaque programme garde **sa propre date de début et son propre historique** : changer de programme ne mélange rien.

Deux programmes sont fournis :

- **Tendons d'Achille 1** — reprise progressive sur 5 jours (isométrique, excentrique, mobilité), évaluation de la douleur ;
- **Meeting training** — 5 exercices discrets à faire assis pendant une réunion, enchaînement manuel, sans évaluation.

### Créer, charger, exporter

Onglet **Programmes** :

- **+ Nouveau programme** : nom, description, règles, mode d'évaluation, enchaînement, puis les exercices et les jours ;
- **Charger** : le programme devient actif (plan, séance, historique et réglages le suivent) ;
- **Dupliquer** : pour partir d'un programme existant sans le modifier ;
- **Exporter / Importer JSON** : un programme seul ou toute la bibliothèque. Un import s'ajoute à côté des programmes existants, il n'écrase jamais.

Les exports de l'ancienne version (bibliothèque d'exercices seule) restent importables : ils sont convertis en programme.

## Onglets

- **Programmes** : bibliothèque de programmes et éditeur.
- **Plan** : les jours du programme chargé, avec l'avancement des séances.
- **Séance** : exécution guidée des exercices (minuteurs de maintien, phase lente, comptage manuel) puis évaluation.
- **Historique** : journal des exercices réalisés pour le programme chargé.
- **Réglages** : programme actif, date de début, sons, notifications, état des jours.

## Notifications

Utile quand on s'entraîne devant un ordinateur, onglet en arrière-plan. À activer dans **Réglages → Notifications** (autorisation du navigateur demandée), avec deux niveaux :

- **Exercice** : début et fin de chaque exercice, séance terminée ;
- **Mouvement** : en plus, chaque répétition, série, maintien, phase lente et repos.

Les **indicateurs sonores** (bips de compte à rebours, fin de série, repos) sont réglables séparément et désactivés par défaut.

L'écran reste allumé pendant un exercice (Screen Wake Lock API, nécessite HTTPS).

## Données

Tout est stocké dans le navigateur (`localStorage`) :

- `tendons_programs` — les programmes et celui qui est chargé ;
- `tendons_progress` — l'historique et l'état des jours, par programme ;
- `tendons_settings` — sons et notifications.

Les données de l'ancienne version sont reprises automatiquement au premier lancement.
