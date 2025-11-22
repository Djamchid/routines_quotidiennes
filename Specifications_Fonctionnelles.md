# 📘 Spécifications Fonctionnelles

### *Application Web de gestion interactive des routines quotidiennes & intégration Google Calendar*

**Version : 1.0 — Format Markdown**

---

# 1. Objectif Général

L’application permet de générer automatiquement un **planning prévisionnel** de la journée en combinant :

* les **événements du Google Calendar** de la journée,
* les **routines personnelles** définies par l’utilisateur,
* les **tâches** (unités élémentaires, sécables) composant les routines.

L’utilisateur peut ensuite enregistrer les heures réelles d’exécution des tâches pour constituer un **planning réel** et une base de données d’usage permettant d’obtenir des **statistiques quotidiennes et globales**.

L’application fonctionne **entièrement en local** (HTML5 / JavaScript / localStorage).

---

# 2. Données

## 2.1. Tâche

```json
{
  "id": "string",
  "libelle": "string",
  "dureeEstimee": "number (minutes)",
  "secable": true
}
```

## 2.2. Routine

```json
{
  "id": "string",
  "nom": "string",
  "ordre": "number",
  "taches": [ /* liste ordonnée de tâches */ ]
}
```

## 2.3. Liste des Routines

* Tableau ordonné de routines.
* Après la dernière routine, reprise au début (cycle).

## 2.4. Calendrier Prévisionnel

```json
{
  "creneaux": [
    {
      "debut": "HH:MM",
      "fin": "HH:MM",
      "type": "rdv | tache",
      "tacheId": "string | null",
      "dureeAllouee": "number (minutes)"
    }
  ]
}
```

## 2.5. Calendrier Réel

```json
{
  "entrees": [
    {
      "tacheId": "string",
      "debutReel": "ISODateString",
      "finReel": "ISODateString",
      "dureeEffectiveMinutes": "number"
    }
  ]
}
```

---

# 3. Fonctionnalités Principales

## 3.1. Lecture Google Calendar

* Authentification (OAuth2, lecture seule).
* Récupération des événements du jour (00:00–23:59).
* Génération des créneaux RDV + créneaux libres.

## 3.2. Génération du Planning Prévisionnel

* Remplir les créneaux libres avec les tâches des routines.
* Ordre de placement :
  1 → 2 → … → n → retour au 1.
* Gestion des tâches **sécables** :

  * découpe automatique si la durée dépasse le créneau libre,
  * planification de la partie restante dans le créneau suivant.

## 3.3. Gestion des Routines et Tâches

* CRUD routines :

  * créer / renommer / supprimer,
  * changement d’ordre (drag & drop),
* CRUD tâches :

  * éditer libellé + durée,
  * ajouter / supprimer,
  * réordonner,
  * découper manuellement.

## 3.4. Exécution Réelle des Tâches

* Bouton **Commencer** → enregistre `début_reel = now()`
* Bouton **Terminer** → enregistre `fin_reel = now()`
* Ajout automatique dans `calendrier_reel`.

## 3.5. Statistiques

* Temps total par routine.
* Temps total par tâche.
* Comparaison **prévisionnel vs. réel**.
* Tâches les plus chronophages.
* Taux d’interruption.

---

# 4. Architecture Technique

## 4.1. Technologies

* **HTML5**, **CSS3**, **JavaScript pur**
* **localStorage** pour la persistance
* API Google Calendar (lecture seule)

## 4.2. Modules JS

```
calendarApi.js        → Connexion Google, récupération des événements
routinesManager.js    → CRUD routines et tâches + persistance
scheduler.js          → Génération du planning + tâches sécables
taskExecution.js      → Gestion début/fin des tâches (planning réel)
timelineView.js       → Affichage calendrier
stats.js              → Calculs statistiques
app.js                → Orchestration générale
```

---

# 5. UX/UI – Vues

## 5.1. Vue Routines

* Liste des routines avec actions :

  * renommer
  * supprimer
  * changer ordre
* Liste des tâches :

  * libellé
  * durée
  * supprimer / ajouter / réordonner

## 5.2. Vue Planning Prévisionnel

Deux modes d’affichage :

* **Vue timeline** (agenda)
* **Vue liste** (séquentielle)

Chaque tâche affiche :

* heure début / fin prévues
* libellé
* bouton “Commencer”

## 5.3. Vue Planning Réel

* Liste chronologique des tâches réellement effectuées :

  * début
  * fin
  * durée effective
* Possibilité d’éditer une entrée.

## 5.4. Vue Statistiques

* Tableaux :

  * par routine
  * par tâche
  * par différence prévisionnel/réel

---

# 6. Algorithme de Génération du Planning (Résumé)

1. Charger les événements Google Calendar.
2. Construire une liste chronologique :

   * RDV
   * créneaux libres entre RDV
3. Pour chaque créneau libre :

   * prendre la prochaine tâche selon l’ordre des routines,
   * si la tâche tient dans le créneau :

     * placer la tâche complète,
   * sinon :

     * placer un fragment de tâche,
     * reporter la durée restante à placer dans le prochain créneau libre.
4. Répéter jusqu’à la fin de la journée.

---

# 7. Développement en Étapes Progressives (Roadmap)

## Étape 1 — Squelette HTML minimal

## Étape 2 — Modèle de données JS (en mémoire)

## Étape 3 — Persistance localStorage

## Étape 4 — Édition de routines et tâches (CRUD)

## Étape 5 — Génération planning sur journée vide

## Étape 6 — Gestion des tâches sécables

## Étape 7 — Intégration Google Calendar + créneaux libres

## Étape 8 — Planning réel (Commencer / Terminer)

## Étape 9 — Statistiques simples

Chaque étape est indépendante, testable, et prépare la suivante.

---

# 8. Tests Manuels (Checklists)

## 8.1. Routines & Tâches

* Ajouter/supprimer une routine
* Modifier ordre
* Ajouter/supprimer une tâche
* Modifier durée

## 8.2. Planning Prévisionnel

* Générer une journée sans RDV
* Générer une journée avec RDV Google Calendar
* Vérifier découpage des tâches sécables

## 8.3. Planning Réel

* Commencer une tâche
* Terminer une tâche
* Vérifier enregistrement

## 8.4. Statistiques

* Vérifier totaux par routine
* Vérifier différences prévu/réel

