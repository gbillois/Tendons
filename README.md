# Tendons

Application web de suivi d'un plan de récupération de tendinopathie (HTML/CSS/JS, sans dépendance, données en localStorage).

## Fonctionnalités

- **Plan** : programme sur 5 jours avec suivi des séances.
- **Séance** : exécution guidée des exercices (minuteurs de maintien, descente lente, comptage manuel) avec évaluation de la douleur.
- **Historique** : journal des exercices réalisés.
- **Réglages** :
  - date de début du programme et état des jours ;
  - **indicateurs sonores** (bips de compte à rebours, fin de série, repos) — désactivés par défaut ;
  - **bibliothèque d'exercices** : modification des exercices fournis (mouvements, durées, répétitions, séries, repos, variantes…) et création de nouveaux exercices, qui apparaissent dans la séance sous « Autres exercices » ;
  - **export / import JSON** de la bibliothèque d'exercices (sauvegarde et restauration).

L'écran reste allumé pendant un exercice (Screen Wake Lock API, nécessite HTTPS).
