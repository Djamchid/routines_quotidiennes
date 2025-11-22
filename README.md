# 📅 Application de Gestion des Routines Quotidiennes

Application web interactive pour gérer vos routines quotidiennes et les intégrer avec Google Calendar.

## 🎯 Fonctionnalités

### Gestion des Routines
- **CRUD complet** : Créer, modifier, supprimer des routines
- **Organisation** : Réorganiser les routines par glisser-déposer (drag & drop)
- **Tâches sécables** : Support des tâches pouvant être divisées

### Planning Prévisionnel
- **Génération automatique** : Combine les événements Google Calendar et vos routines
- **Deux vues** : Timeline (agenda) et Liste
- **Gestion intelligente** : Remplissage automatique des créneaux libres
- **Tâches sécables** : Découpe automatique si nécessaire

### Exécution Réelle
- **Suivi en temps réel** : Boutons Commencer/Terminer pour chaque tâche
- **Enregistrement automatique** : Sauvegarde des heures réelles
- **Historique** : Visualisation de toutes les tâches effectuées

### Statistiques
- **Par routine** : Temps total passé par routine
- **Par tâche** : Temps total et moyen par tâche
- **Comparaison** : Prévisionnel vs Réel
- **Top tâches** : Les tâches les plus chronophages

### Intégration Google Calendar
- **Lecture seule** : Récupération des événements du jour
- **Mode simulation** : Fonctionne sans configuration Google
- **Créneaux libres** : Détection automatique des périodes disponibles

## 🚀 Démarrage Rapide

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd routines_quotidiennes
```

2. **Ouvrir l'application**

   Ouvrez simplement `index.html` dans votre navigateur web.

   ⚠️ **Important** : Pour utiliser Google Calendar, vous devez servir l'application via HTTP/HTTPS (pas `file://`).

### Serveur local simple

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (avec http-server)
npx http-server -p 8000
```

Puis accédez à `http://localhost:8000`

## 📖 Guide d'utilisation

### 1. Créer vos routines

1. Cliquez sur **"+ Ajouter une routine"**
2. Entrez le nom de la routine
3. Ajoutez des tâches avec :
   - Nom de la tâche
   - Durée estimée (minutes)
   - Sécable ou non

### 2. Générer le planning

1. Allez dans **"Planning Prévisionnel"**
2. Cliquez sur **"🔄 Générer le planning"**
3. Le planning se génère automatiquement avec :
   - Vos événements Google Calendar (si configuré)
   - Vos routines dans les créneaux libres

### 3. Exécuter les tâches

1. Dans le planning, cliquez sur **"▶️ Commencer"** pour démarrer une tâche
2. Cliquez sur **"⏹️ Terminer"** quand vous avez fini
3. Les temps réels sont automatiquement enregistrés

### 4. Consulter les statistiques

1. Allez dans **"📈 Statistiques"**
2. Sélectionnez la période (Aujourd'hui, Semaine, Mois, Tout)
3. Consultez :
   - Temps par routine
   - Temps par tâche
   - Comparaison prévisionnel/réel
   - Tâches les plus chronophages

## ⚙️ Configuration Google Calendar

### Pré-requis

1. Un compte Google
2. Un projet Google Cloud Platform

### Étapes

1. **Créer un projet sur Google Cloud Console**
   - Allez sur https://console.cloud.google.com
   - Créez un nouveau projet

2. **Activer l'API Google Calendar**
   - Dans votre projet, allez dans "APIs & Services" > "Library"
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

3. **Créer des identifiants**
   - Allez dans "APIs & Services" > "Credentials"
   - Créez une API Key
   - Créez un OAuth 2.0 Client ID (type: Web application)
   - Ajoutez `http://localhost:8000` dans les Authorized JavaScript origins

4. **Configurer l'application**
   - Dans l'app, cliquez sur "🔐 Connexion Google Calendar"
   - Entrez votre Client ID et API Key
   - Autorisez l'accès à votre calendrier

## 🏗️ Architecture

### Structure des fichiers

```
routines_quotidiennes/
├── index.html              # Page principale
├── styles.css              # Styles CSS
├── app.js                  # Orchestration principale
├── routinesManager.js      # Gestion des routines et tâches
├── scheduler.js            # Génération du planning
├── taskExecution.js        # Exécution réelle des tâches
├── timelineView.js         # Affichage des plannings
├── stats.js                # Calculs statistiques
├── calendarApi.js          # Intégration Google Calendar
├── README.md               # Documentation
└── Specifications_Fonctionnelles.md  # Spécifications complètes
```

### Technologies

- **HTML5** : Structure
- **CSS3** : Styles et animations
- **JavaScript pur** : Logique (pas de framework)
- **localStorage** : Persistance des données
- **Google Calendar API** : Intégration calendrier

### Modules JavaScript

- **routinesManager** : CRUD routines/tâches + persistance
- **scheduler** : Algorithme de génération du planning
- **taskExecution** : Gestion début/fin des tâches
- **timelineView** : Affichage timeline/liste
- **stats** : Calculs statistiques
- **calendarApi** : Connexion Google + récupération événements
- **app** : Orchestration et gestion des événements UI

## 💾 Stockage des données

Toutes les données sont stockées localement dans le navigateur via `localStorage` :

- **routines_data** : Routines et tâches
- **planning_previsionnel** : Planning généré
- **planning_reel** : Tâches effectuées
- **google_client_id** : Client ID Google (si configuré)
- **google_api_key** : API Key Google (si configuré)

⚠️ **Important** : Les données sont liées au domaine/port. Si vous changez de port, vous perdrez vos données.

## 🔒 Sécurité et confidentialité

- ✅ Fonctionnement 100% local
- ✅ Aucune donnée envoyée à un serveur externe
- ✅ Google Calendar en lecture seule uniquement
- ✅ Données chiffrées dans localStorage (par le navigateur)
- ⚠️ Les API Keys sont stockées en clair dans localStorage

**Recommandation** : Utilisez des API Keys avec restrictions (domaine, IP, quotas)

## 🐛 Dépannage

### L'application ne charge pas
- Vérifiez que tous les fichiers JS sont bien chargés
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Google Calendar ne fonctionne pas
- Vérifiez que vous utilisez HTTP/HTTPS (pas `file://`)
- Vérifiez vos identifiants Google
- Vérifiez les Authorized JavaScript origins dans Google Cloud Console
- Utilisez le mode simulation pour tester sans Google

### Les données ont disparu
- Vérifiez que vous utilisez le même port/domaine
- Vérifiez que localStorage n'a pas été effacé
- Exportez régulièrement vos données (fonctionnalité à venir)

## 🚧 Roadmap / Améliorations futures

- [ ] Export/Import des données (JSON)
- [ ] Graphiques statistiques
- [ ] Notifications navigateur
- [ ] Mode sombre
- [ ] Support multi-calendriers
- [ ] Récurrence des tâches
- [ ] Templates de routines
- [ ] Synchronisation cloud (optionnelle)

## 📝 Licence

Ce projet est open source et disponible sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Développé selon les spécifications fonctionnelles v1.0**
