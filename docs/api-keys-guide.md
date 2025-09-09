# 🔑 Guide d'Obtention des Clés API - Pulse Montreal

Ce guide vous accompagne pour obtenir toutes les clés API nécessaires à l'ingestion d'événements.

## 🎫 1. Eventbrite API (RECOMMANDÉ - Gratuit)

### Étapes d'obtention :
1. **Créer un compte** : [https://www.eventbrite.com/signup/](https://www.eventbrite.com/signup/)
2. **Aller sur la console développeur** : [https://www.eventbrite.com/platform/](https://www.eventbrite.com/platform/)
3. **Cliquer sur "Create App"**
4. **Remplir les informations** :
   - **App Name** : `Pulse Montreal Events`
   - **Description** : `Application d'agrégation d'événements pour Montréal`
   - **Website** : `https://pulse-montreal.com` (ou votre domaine)
   - **Application Type** : `Public`
5. **Récupérer le token** dans la section "Your API keys"

### Limites :
- **Gratuit** : 1000 requêtes/heure
- **Payant** : Plus de requêtes disponibles

---

## 🎵 2. Ticketmaster Discovery API (RECOMMANDÉ)

### Étapes d'obtention :
1. **Créer un compte** : [https://developer.ticketmaster.com/products-and-docs/apis/getting-started/](https://developer.ticketmaster.com/products-and-docs/apis/getting-started/)
2. **Cliquer sur "Get Your API Key"**
3. **Remplir le formulaire** :
   - **App Name** : `Pulse Montreal`
   - **Description** : `Event aggregation platform for Montreal`
   - **Website** : Votre domaine
4. **Récupérer la "Consumer Key"**

### Limites :
- **Gratuit** : 5000 requêtes/jour
- **Rate limit** : 5 requêtes/seconde

---

## 🤝 3. Meetup API (Événements communautaires)

### Étapes d'obtention :
1. **Créer un compte** : [https://www.meetup.com/](https://www.meetup.com/)
2. **Aller sur** : [https://secure.meetup.com/meetup_api/key/](https://secure.meetup.com/meetup_api/key/)
3. **Accepter les conditions** et récupérer la clé

### Limites :
- **Gratuit** : 200 requêtes/heure
- **GraphQL API** disponible

---

## 🎸 4. Bandsintown API (Concerts)

### Étapes d'obtention :
1. **Aller sur** : [https://www.bandsintown.com/api/overview](https://www.bandsintown.com/api/overview)
2. **Cliquer sur "Request API Access"**
3. **Remplir le formulaire** :
   - **Company** : `Pulse Montreal`
   - **Use Case** : `Event aggregation for Montreal cultural scene`
   - **Website** : Votre domaine
4. **Attendre l'approbation** (1-3 jours)

### Limites :
- **Gratuit** avec approbation
- **Rate limit** : Raisonnable pour usage normal

---

## 🏟️ 5. SeatGeek API (Sports/Spectacles)

### Étapes d'obtention :
1. **Créer un compte** : [https://seatgeek.com/](https://seatgeek.com/)
2. **Aller sur** : [https://seatgeek.com/build](https://seatgeek.com/build)
3. **Cliquer sur "Get Started"**
4. **Créer une application** et récupérer le Client ID

### Limites :
- **Gratuit** : 1000 requêtes/jour
- **Payant** : Plus de requêtes disponibles

---

## 🏛️ 6. Données Ouvertes Ville de Montréal (GRATUIT)

### Sources disponibles :
1. **Portail données ouvertes** : [https://donnees.montreal.ca/](https://donnees.montreal.ca/)
2. **API REST** : Pas de clé requise pour la plupart des datasets
3. **Rechercher** : "événements", "activités", "festivals"

### Datasets utiles :
- Événements culturels
- Festivals et événements
- Activités dans les parcs
- Événements sportifs municipaux

---

## 🔐 7. Configuration des Variables d'Environnement

Une fois toutes les clés obtenues, ajoutez-les dans votre `.env.local` :

```env
# APIs externes pour ingestion
EVENTBRITE_TOKEN="VOTRE_TOKEN_EVENTBRITE"
TICKETMASTER_API_KEY="VOTRE_CLE_TICKETMASTER"
MEETUP_TOKEN="VOTRE_TOKEN_MEETUP"
BANDSINTOWN_APP_ID="VOTRE_APP_ID_BANDSINTOWN"
SEATGEEK_CLIENT_ID="VOTRE_CLIENT_ID_SEATGEEK"

# Configuration géocodage (gratuit)
GEOCODING_PROVIDER="NOMINATIM"

# Base de données (Supabase)
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://votre-projet.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-cle-anon"

# NextAuth
NEXTAUTH_SECRET="votre-secret-nextauth"
NEXTAUTH_URL="http://localhost:3000"

# CRON (pour production)
CRON_SECRET="votre-secret-cron"
```

---

## ✅ 8. Vérification de la Configuration

Utilisez le script de vérification :

```bash
npm run checkenv
```

Ce script vous dira quelles clés sont présentes et lesquelles manquent.

---

## 🚀 9. Test de l'Ingestion

Une fois les clés configurées :

```bash
# Démarrer l'application
npm run dev

# Dans un autre terminal, tester l'ingestion manuelle
curl -X POST http://localhost:3000/api/ingestion \
  -H "Authorization: Bearer VOTRE_ADMIN_TOKEN"
```

---

## 📊 10. Suivi des Quotas

### Surveillance recommandée :
- **Eventbrite** : 1000 req/h → ~24,000/jour
- **Ticketmaster** : 5000 req/jour
- **Meetup** : 200 req/h → ~4,800/jour
- **Bandsintown** : Variable selon approbation
- **SeatGeek** : 1000 req/jour

### Stratégie d'optimisation :
1. **Commencer par Eventbrite et Ticketmaster** (plus de contenu)
2. **Ajouter Meetup** pour les événements communautaires
3. **Intégrer les autres** selon les besoins

---

## 🔄 11. Automatisation

L'ingestion automatique se déclenche **toutes les 2 heures** via Vercel Cron.

Pour modifier la fréquence, éditez `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/ingestion",
      "schedule": "0 */1 * * *"  // Toutes les heures
    }
  ]
}
```

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les quotas API
2. Consultez les logs d'ingestion : `/api/ingestion/status`
3. Testez chaque API individuellement
4. Contactez le support des APIs si nécessaire

**Bonne chance avec votre collecte d'événements ! 🎉**
