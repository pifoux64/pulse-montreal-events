# 🔔 Configuration des Notifications Push - Pulse Montreal

## Vue d'ensemble

Le système de notifications push permet d'envoyer des notifications en temps réel aux utilisateurs, même quand l'application n'est pas ouverte. Il utilise le protocole **Web Push** avec **VAPID** (Voluntary Application Server Identification).

## ✅ État Actuel

Le système de notifications push est **implémenté et fonctionnel** :

- ✅ Service Worker enregistré (`/sw.js`)
- ✅ API de souscription (`/api/notifications/subscribe`)
- ✅ Envoi de notifications push (pour les posts d'événements)
- ✅ UI pour activer les notifications (NotificationBell, page notifications)
- ✅ Gestion des permissions navigateur
- ✅ Vérification de l'état de souscription

## 🔧 Configuration Requise

### Variables d'environnement

Pour activer les notifications push, vous devez configurer les clés VAPID :

```env
# Clé publique VAPID (exposée au client)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique_vapid

# Clé privée VAPID (secrète, côté serveur)
VAPID_PRIVATE_KEY=votre_cle_privee_vapid

# Sujet VAPID (email ou URL)
VAPID_SUBJECT=mailto:support@pulse-montreal.com
# OU
VAPID_SUBJECT=https://pulse-montreal.com
```

### Générer les clés VAPID

#### Option 1 : Via web-push (recommandé)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Cela génère :
- **Public Key** : À mettre dans `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key** : À mettre dans `VAPID_PRIVATE_KEY`

#### Option 2 : Via Node.js

```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## 📋 Fonctionnalités

### 1. Souscription aux Notifications

Les utilisateurs peuvent s'abonner aux notifications push via :
- **NotificationBell** : Bouton dans la cloche de notifications
- **Page notifications** : `/notifications`

### 2. Types de Notifications

Actuellement implémenté :
- ✅ **EVENT_POST_PUBLISHED** : Notification quand un organisateur publie un post sur un événement favori

À implémenter :
- ⏳ **EVENT_REMINDER** : Rappel avant un événement favori
- ⏳ **SYSTEM** : Notifications système

### 3. Gestion des Permissions

Le système gère automatiquement :
- ✅ Vérification du support navigateur
- ✅ Demande de permission
- ✅ Gestion des permissions refusées
- ✅ Vérification de l'état de souscription

## 🎯 Utilisation

### Pour l'utilisateur

1. **Activer les notifications** :
   - Cliquer sur la cloche de notifications
   - Cliquer sur "Activer les notifications push"
   - Autoriser les notifications dans le navigateur

2. **Recevoir des notifications** :
   - Les notifications apparaissent même si l'application n'est pas ouverte
   - Cliquer sur une notification ouvre l'événement correspondant

### Pour les développeurs

#### Envoyer une notification push

```typescript
import { sendEventPostPushNotifications } from '@/lib/notifications/push';

await sendEventPostPushNotifications({
  subscriptions: [
    {
      endpoint: 'https://...',
      keys: {
        auth: '...',
        p256dh: '...',
      },
    },
  ],
  payload: {
    title: 'Nouveau post',
    body: 'Un organisateur a publié un nouveau post',
    data: {
      eventId: 'event-id',
      postId: 'post-id',
    },
  },
});
```

#### Vérifier l'état de souscription

```typescript
import { useSubscriptionStatus } from '@/hooks/useNotificationSubscription';

function MyComponent() {
  const { data: isSubscribed, isLoading } = useSubscriptionStatus();
  
  if (isLoading) return <div>Vérification...</div>;
  if (isSubscribed) return <div>Notifications activées</div>;
  return <div>Notifications non activées</div>;
}
```

## 🔍 Dépannage

### Les notifications ne fonctionnent pas

1. **Vérifier les variables d'environnement** :
   ```bash
   echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
   echo $VAPID_PRIVATE_KEY
   echo $VAPID_SUBJECT
   ```

2. **Vérifier le service worker** :
   - Ouvrir DevTools → Application → Service Workers
   - Vérifier que `/sw.js` est enregistré et actif

3. **Vérifier les permissions** :
   - Ouvrir DevTools → Application → Notifications
   - Vérifier que la permission est "Allow"

4. **Vérifier les logs** :
   - Console du navigateur pour les erreurs client
   - Logs serveur pour les erreurs d'envoi

### Erreurs courantes

#### "Clé publique VAPID manquante"
- Vérifier que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` est défini dans `.env.local`
- Redémarrer le serveur Next.js

#### "Permission de notification refusée"
- L'utilisateur a bloqué les notifications
- Aller dans les paramètres du navigateur pour autoriser

#### "Les notifications push ne sont pas supportées"
- Le navigateur ne supporte pas les notifications push
- Utiliser Chrome, Firefox, Edge ou Safari (iOS 16.4+)

#### "Impossible d'enregistrer la souscription push"
- Vérifier que l'utilisateur est authentifié
- Vérifier les logs serveur pour plus de détails

## 📚 Documentation Technique

### Architecture

1. **Service Worker** (`/sw.js`) :
   - Écoute les événements `push`
   - Affiche les notifications
   - Gère les clics sur les notifications

2. **API de souscription** (`/api/notifications/subscribe`) :
   - Enregistre les souscriptions dans la base de données
   - Stocke l'endpoint et les clés de chiffrement

3. **Envoi de notifications** (`src/lib/notifications/push.ts`) :
   - Utilise `web-push` pour envoyer les notifications
   - Gère les erreurs et retry automatique

### Sécurité

- ✅ Clés VAPID pour authentifier le serveur
- ✅ Chiffrement end-to-end (clés auth et p256dh)
- ✅ Authentification requise pour s'abonner
- ✅ Validation des données d'entrée

## 🚀 Prochaines Étapes

### Améliorations possibles

1. **Notifications de rappel** :
   - Envoyer un rappel 24h avant un événement favori
   - Envoyer un rappel 1h avant

2. **Notifications personnalisées** :
   - Basées sur les préférences utilisateur
   - Filtres par catégorie, lieu, etc.

3. **Nettoyage automatique** :
   - Supprimer les souscriptions expirées
   - Nettoyer les souscriptions invalides

4. **Analytics** :
   - Suivre le taux d'ouverture
   - Suivre les erreurs d'envoi

## 📝 Notes Importantes

- ⚠️ **HTTPS requis** : Les notifications push ne fonctionnent qu'en HTTPS (ou localhost en développement)
- ⚠️ **Service Worker** : Le service worker doit être enregistré avant de pouvoir s'abonner
- ⚠️ **Permissions** : L'utilisateur doit autoriser les notifications dans le navigateur
- ✅ **Multi-navigateurs** : Les souscriptions sont stockées par navigateur (un utilisateur peut avoir plusieurs souscriptions)

---

**Dernière mise à jour** : Décembre 2025
**Statut** : ✅ Fonctionnel - Nécessite configuration VAPID

