# 🤝 Guide : Activer Meetup API

⚠️ **IMPORTANT : Meetup API nécessite un abonnement payant**

Meetup est une excellente source d'événements communautaires à Montréal, mais l'accès à l'API nécessite un **abonnement Meetup Pro** (à partir de **55$ USD/mois par groupe**).

## 💰 Coûts

- **Meetup Pro** : À partir de **55$ USD/mois par groupe**
- **Réductions** : Possibles pour des engagements plus longs
- **Accès API** : Inclus avec l'abonnement Pro uniquement
- **Expiration** : Si l'abonnement expire, l'accès API est automatiquement révoqué

**Référence** : https://help.meetup.com/hc/en-us/articles/28677808413197-Organizer-subscription-prices-overview

## 🎯 Étapes pour Activer Meetup (Si vous avez Meetup Pro)

### 1. Souscrire à Meetup Pro

1. **Créer un compte Meetup** (si vous n'en avez pas)
   - Aller sur : https://www.meetup.com/
   - Créer un compte gratuit

2. **Souscrire à Meetup Pro**
   - Aller sur : https://secure.meetup.com/meetup-pro/
   - Choisir un plan (à partir de 55$ USD/mois)
   - Compléter l'abonnement

### 2. Obtenir votre clé API

1. **Créer un consommateur OAuth**
   - Aller sur : https://secure.meetup.com/meetup_api/key/
   - Connectez-vous avec votre compte Meetup Pro
   - **Note** : Seuls les membres avec Meetup Pro peuvent créer des consommateurs OAuth
   - Acceptez les conditions d'utilisation
   - **Copiez votre clé API** (format : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Configurer le Token

Ajoutez le token dans votre fichier `.env.local` :

```env
MEETUP_TOKEN=votre_cle_api_ici
```

### 3. Activer Meetup dans l'Orchestrateur

Le connecteur est déjà prêt dans le code. Il s'activera automatiquement si `MEETUP_TOKEN` est défini.

**Vérification** : Le connecteur vérifie automatiquement la présence du token dans `src/lib/orchestrator.ts` :

```typescript
{
  source: EventSource.MEETUP,
  enabled: !!process.env.MEETUP_TOKEN, // S'active automatiquement si le token existe
  batchSize: 100,
}
```

### 4. Tester l'Ingestion

Une fois le token configuré, testez l'ingestion :

**Via le Dashboard Admin** :
1. Aller sur `/admin/ingestion`
2. Cliquer sur "Ingérer LEPOINTDEVENTE" (ou utiliser le bouton pour toutes les sources)

**Via l'API** :
```bash
curl -X POST http://localhost:3000/api/admin/ingest/MEETUP \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 Limites de l'API Meetup

- **Abonnement requis** : Meetup Pro (55$ USD/mois minimum)
- **Rate limit** : Variable selon l'abonnement (géré automatiquement par le connecteur)
- **GraphQL API** : Le connecteur utilise l'API GraphQL moderne de Meetup
- **Expiration** : L'accès API est révoqué si l'abonnement expire

## 🎯 Types d'Événements Récupérés

Meetup récupère des événements communautaires variés :
- Tech meetups
- Startup events
- Music events
- Festivals
- Événements culturels
- Et plus encore...

## ✅ Vérification

Pour vérifier que Meetup fonctionne :

1. **Vérifier les logs** lors de l'ingestion
2. **Vérifier le dashboard** `/admin/ingestion` pour voir les statistiques
3. **Vérifier les événements** sur la page d'accueil

## 🐛 Dépannage

### Le token ne fonctionne pas

- Vérifiez que le token est correct dans `.env.local`
- Redémarrez le serveur Next.js après avoir ajouté le token
- Vérifiez que le token n'a pas expiré (les tokens Meetup ne expirent généralement pas)

### Aucun événement récupéré

- Vérifiez les logs pour voir les erreurs
- Vérifiez que le token a les bonnes permissions
- Vérifiez que des événements Meetup existent à Montréal

### Erreur 401 (Unauthorized)

- Le token est invalide ou expiré
- Régénérez un nouveau token sur https://secure.meetup.com/meetup_api/key/

## 📚 Documentation

- **API Meetup** : https://www.meetup.com/api/
- **GraphQL API** : https://www.meetup.com/api/guide/
- **Limites** : https://www.meetup.com/api/guide/#p02-api-keys-and-rate-limiting

---

## ⚠️ Alternative Gratuite

Si vous ne souhaitez pas payer pour Meetup Pro, considérez :

1. **Ticketmaster** (gratuit) - Déjà actif ✅
2. **Open Data Montréal** (gratuit) - À explorer
3. **Quartier des Spectacles** (potentiellement gratuit) - À contacter
4. **Tourisme Montréal** (potentiellement gratuit) - À contacter

Voir `docs/SOURCES_GRATUITES.md` pour plus d'options gratuites.

---

**Note** : Meetup nécessite un abonnement payant (55$ USD/mois minimum). Si vous avez déjà Meetup Pro, vous pouvez activer cette source. Sinon, privilégiez les sources gratuites listées ci-dessus.

