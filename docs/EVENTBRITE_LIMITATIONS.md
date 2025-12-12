# ⚠️ Limitations Eventbrite API - Pulse Montreal

## 🚨 Problème Principal

L'API Eventbrite v3 **ne permet PAS** de rechercher des événements publics par localisation géographique.

### Détails Techniques

L'API Eventbrite est conçue uniquement pour :
- ✅ Gérer vos propres événements (création, modification, suppression)
- ✅ Récupérer les événements de votre organisation
- ✅ Accéder aux données de vos événements privés

L'API Eventbrite **ne permet PAS** :
- ❌ Rechercher des événements publics par ville (ex: "Montreal")
- ❌ Rechercher des événements publics par localisation
- ❌ Accéder aux événements d'autres organisateurs

### Référence API

Documentation officielle : https://www.eventbrite.com/platform/api

L'endpoint `/events/search` mentionné dans certaines documentations n'existe pas dans l'API publique v3.

---

## 🔍 Tentatives Effectuées

### 1. Endpoint `/events/search`
```bash
GET https://www.eventbriteapi.com/v3/events/search/?location.address=Montreal
```
**Résultat** : ❌ Endpoint inexistant (404)

### 2. Endpoint `/events/` avec filtres
```bash
GET https://www.eventbriteapi.com/v3/events/?location.address=Montreal
```
**Résultat** : ❌ Retourne uniquement vos propres événements

### 3. Endpoint `/organizations/{id}/events/`
```bash
GET https://www.eventbriteapi.com/v3/organizations/{org_id}/events/
```
**Résultat** : ✅ Fonctionne mais uniquement pour vos propres événements

---

## 💡 Solutions Alternatives

### Option 1 : Partenariat API Eventbrite
Contacter le support Eventbrite pour obtenir :
- Accès à une API de recherche publique (si disponible)
- Partenariat pour l'accès aux données d'événements

**Contact** : https://www.eventbrite.com/platform/api/contact/

### Option 2 : Utiliser d'autres sources
- ✅ **Ticketmaster** : API publique fonctionnelle
- ✅ **Open Data Montréal** : Données ouvertes de la ville
- ⚠️ **Meetup** : Nécessite abonnement Pro (55$ USD/mois)

### Option 3 : Scraping (NON RECOMMANDÉ)
⚠️ **Le scraping est ILLÉGAL** et viole les conditions d'utilisation d'Eventbrite.

---

## 📊 Statut Actuel

**Connecteur Eventbrite** : 
- ✅ Code implémenté dans `src/ingestors/eventbrite.ts`
- ❌ Désactivé dans l'orchestrateur (limitation API)
- ⚠️ Peut être utilisé uniquement pour vos propres événements

**Configuration** :
```typescript
{
  source: EventSource.EVENTBRITE,
  enabled: !!process.env.EVENTBRITE_TOKEN, // Désactivé par défaut
  apiKey: process.env.EVENTBRITE_TOKEN,
}
```

---

## 🎯 Recommandation

1. **Court terme** : Utiliser Ticketmaster et Open Data Montréal comme sources principales
2. **Moyen terme** : Contacter Eventbrite pour un partenariat API
3. **Long terme** : Évaluer d'autres sources légales d'événements

---

**Dernière mise à jour** : Janvier 2025  
**Statut** : Limitation API confirmée - Pas de solution immédiate

