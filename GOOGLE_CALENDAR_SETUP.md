# 🔐 Configuration Google Calendar - Guide Complet

Ce guide vous explique étape par étape comment obtenir vos identifiants Google Calendar pour l'application.

## 📋 Ce dont vous avez besoin

- Un compte Google
- 10-15 minutes

## 🚀 Étapes de configuration

### 1. Créer un projet Google Cloud

1. **Allez sur Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer un nouveau projet**
   - Cliquez sur le sélecteur de projet (en haut à gauche, à côté de "Google Cloud")
   - Cliquez sur "NEW PROJECT" / "NOUVEAU PROJET"
   - Nom du projet: `Routines Quotidiennes` (ou ce que vous voulez)
   - Cliquez sur "CREATE" / "CRÉER"
   - Attendez quelques secondes que le projet soit créé
   - Sélectionnez le projet nouvellement créé

### 2. Activer l'API Google Calendar

1. **Accéder à la bibliothèque d'APIs**
   - Dans le menu de gauche (☰), allez dans "APIs & Services" > "Library"
   - Ou URL directe: https://console.cloud.google.com/apis/library

2. **Rechercher et activer l'API**
   - Dans la barre de recherche, tapez: `Google Calendar API`
   - Cliquez sur "Google Calendar API"
   - Cliquez sur le bouton "ENABLE" / "ACTIVER"
   - Attendez que l'activation soit terminée

### 3. Créer une API Key

1. **Accéder aux identifiants**
   - Dans le menu de gauche, allez dans "APIs & Services" > "Credentials"
   - Ou URL directe: https://console.cloud.google.com/apis/credentials

2. **Créer l'API Key**
   - Cliquez sur "+ CREATE CREDENTIALS" en haut
   - Sélectionnez "API key"
   - Une popup s'affiche avec votre clé
   - **COPIEZ cette clé** et gardez-la de côté (par exemple dans un fichier texte temporaire)
   - Format: `AIzaSy...` (environ 39 caractères)

3. **Restreindre l'API Key (Recommandé pour la sécurité)**
   - Cliquez sur "RESTRICT KEY" / "RESTREINDRE LA CLÉ"
   - Ou cliquez sur l'icône ✏️ (éditer) à côté de la clé créée
   - Dans "API restrictions":
     - Sélectionnez "Restrict key"
     - Cochez uniquement "Google Calendar API"
   - Dans "Website restrictions" (optionnel):
     - Sélectionnez "HTTP referrers"
     - Ajoutez: `http://localhost:*/*`
     - Ajoutez: `http://127.0.0.1:*/*`
   - Cliquez sur "SAVE" / "ENREGISTRER"

### 4. Créer un OAuth 2.0 Client ID

1. **Configurer l'écran de consentement OAuth (si ce n'est pas déjà fait)**
   - Dans "APIs & Services" > "OAuth consent screen"
   - Sélectionnez "External" (sauf si vous avez un workspace)
   - Cliquez sur "CREATE"

   **Remplir les informations:**
   - App name: `Routines Quotidiennes`
   - User support email: votre email
   - Developer contact: votre email
   - Cliquez sur "SAVE AND CONTINUE"

   **Scopes:**
   - Cliquez sur "ADD OR REMOVE SCOPES"
   - Recherchez: `calendar.readonly`
   - Cochez: `https://www.googleapis.com/auth/calendar.readonly`
   - Cliquez sur "UPDATE" puis "SAVE AND CONTINUE"

   **Test users (Important!):**
   - Cliquez sur "+ ADD USERS"
   - Ajoutez votre email Google
   - Cliquez sur "SAVE AND CONTINUE"
   - Cliquez sur "BACK TO DASHBOARD"

2. **Créer le Client ID**
   - Retournez dans "Credentials"
   - Cliquez sur "+ CREATE CREDENTIALS"
   - Sélectionnez "OAuth client ID"
   - Application type: "Web application"
   - Name: `Routines Web Client`

   **Authorized JavaScript origins:**
   - Cliquez sur "+ ADD URI"
   - Ajoutez: `http://localhost:8000`
   - Ajoutez: `http://127.0.0.1:8000`
   - Ajoutez: `http://localhost:3000` (si vous utilisez un autre port)

   **Authorized redirect URIs:** (laisser vide pour cette app)

   - Cliquez sur "CREATE"

3. **Copier le Client ID**
   - Une popup s'affiche avec votre Client ID et Client Secret
   - **COPIEZ le Client ID** (vous n'avez PAS besoin du Client Secret pour cette app)
   - Format: `123456789-abcdefghijk.apps.googleusercontent.com`

### 5. Configurer l'application

Vous avez maintenant 2 informations importantes:

1. **API Key**: `AIzaSy...`
2. **Client ID**: `123456789-abcdefghijk.apps.googleusercontent.com`

**Pour les utiliser dans l'application:**

1. Ouvrez l'application dans votre navigateur (`http://localhost:8000`)
2. Allez dans l'onglet "📝 Routines"
3. Cliquez sur "🔐 Connexion Google Calendar"
4. Dans la popup:
   - Première question: Choisissez "OK" (pour configurer Google Calendar)
   - Entrez votre **Client ID**
   - Entrez votre **API Key**
5. Autorisez l'accès à votre calendrier Google
6. ✅ Vous êtes connecté!

## 🔒 Sécurité - Points importants

### ⚠️ API Key
- L'API Key est stockée dans le localStorage de votre navigateur
- **NE PARTAGEZ JAMAIS** votre API Key publiquement
- Si vous publiez le code sur GitHub, **N'INCLUEZ PAS** votre API Key
- Pour plus de sécurité, utilisez les restrictions d'API Key (voir étape 3.3)

### ✅ Bonnes pratiques
- Utilisez toujours les restrictions d'API (domaines, IPs, APIs spécifiques)
- Ajoutez uniquement votre email dans les "Test users"
- Ne publiez pas l'application en production sans réviser la sécurité
- Régénérez les clés si vous pensez qu'elles ont été compromises

## 🧪 Tester la connexion

1. Après avoir configuré vos identifiants, cliquez sur "Connexion Google Calendar"
2. Une fenêtre Google apparaît pour demander l'autorisation
3. Sélectionnez votre compte Google
4. Cliquez sur "Allow" / "Autoriser"
5. La page se ferme et vous voyez "Connecté" dans l'application
6. Allez dans "Planning Prévisionnel" et cliquez sur "Générer le planning"
7. Vos événements Google Calendar devraient apparaître!

## ❓ Problèmes courants

### "Origin not allowed" ou erreur 403
- Vérifiez que vous avez bien ajouté `http://localhost:8000` dans "Authorized JavaScript origins"
- Assurez-vous d'utiliser le même port (8000)
- Attendez quelques minutes après avoir modifié les paramètres

### "Access blocked: This app's request is invalid"
- Vérifiez que vous avez bien configuré l'écran de consentement OAuth
- Ajoutez votre email dans les "Test users"
- Vérifiez que le scope `calendar.readonly` est bien ajouté

### "API key not valid"
- Vérifiez que l'API Google Calendar est bien activée
- Vérifiez les restrictions de votre API Key
- Attendez quelques minutes après la création de la clé

### L'application utilise le mode simulation
- C'est normal par défaut!
- Cliquez sur "Connexion Google Calendar" pour passer en mode réel
- Vous pouvez revenir au mode simulation en rechargeant la page sans configurer les identifiants

## 📞 Besoin d'aide?

Si vous rencontrez des problèmes:

1. Vérifiez la console JavaScript (F12) pour voir les erreurs
2. Assurez-vous que toutes les étapes ont été suivies
3. Attendez 2-3 minutes après chaque changement dans Google Cloud Console
4. Essayez en navigation privée pour éliminer les problèmes de cache

## 🔗 Liens utiles

- Google Cloud Console: https://console.cloud.google.com/
- Documentation Google Calendar API: https://developers.google.com/calendar/api
- OAuth 2.0 Guide: https://developers.google.com/identity/protocols/oauth2

---

**Note**: La première fois que vous utilisez l'API avec un nouveau compte, Google peut afficher un avertissement "This app isn't verified". C'est normal pour une app en développement. Cliquez sur "Advanced" puis "Go to [App Name] (unsafe)" pour continuer.
