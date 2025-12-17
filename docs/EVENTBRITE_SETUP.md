# 🎫 Configuration Eventbrite - Guide Complet

## ⚠️ Problème Identifié

L'API Eventbrite **v3** ne permet **PAS** de rechercher des événements publics par localisation. Cette API est conçue pour gérer vos propres événements uniquement.

## ✅ Solutions Disponibles

### Option 1: Utiliser l'API de Recherche Publique Eventbrite (Recommandé)

Eventbrite propose une API de recherche publique différente qui permet de rechercher des événements. Cependant, cette API peut avoir des limitations.

**Étapes :**
1. Votre token Eventbrite actuel devrait fonctionner
2. L'endpoint de recherche publique peut être différent
3. Contactez le support Eventbrite pour obtenir l'accès à l'API de recherche publique

### Option 2: Utiliser l'API Discovery Eventbrite

Eventbrite a une API "Discovery" pour la recherche d'événements publics, mais elle peut nécessiter un accès spécial.

**Documentation :**
- https://www.eventbrite.com/platform/api/
- Contactez le support : support@eventbrite.com

### Option 3: Scraping (Non recommandé - Violation des ToS)

⚠️ **ATTENTION** : Le scraping du site Eventbrite viole leurs conditions d'utilisation et peut entraîner un blocage.

### Option 4: Utiliser une API Alternative

Considérez d'autres sources d'événements qui fonctionnent mieux :
- **Ticketmaster** ✅ (déjà fonctionnel dans votre projet)
- **Meetup** ✅ (fonctionne bien)
- **Bandsintown** (pour les concerts)
- **Quartier des Spectacles** ✅ (déjà fonctionnel)

## 🔧 Solution Temporaire : Désactiver Eventbrite

En attendant de trouver une solution, vous pouvez désactiver Eventbrite dans votre configuration :

```env
# Dans .env.local, commentez ou supprimez :
# EVENTBRITE_TOKEN="..."
```

L'application continuera de fonctionner avec les autres sources (Ticketmaster, Meetup, etc.).

## 📞 Contact Eventbrite

Pour obtenir l'accès à l'API de recherche publique :

1. **Support Eventbrite** : support@eventbrite.com
2. **Documentation API** : https://www.eventbrite.com/platform/api/
3. **Forum développeurs** : https://www.eventbrite.com/platform/api/

**Demandez :**
- Accès à l'API de recherche publique d'événements
- Documentation pour rechercher des événements par localisation
- Exemples d'endpoints pour la recherche d'événements publics

## 🎯 Recommandation

Pour l'instant, **utilisez les autres sources** qui fonctionnent déjà :
- Ticketmaster (5000 événements/jour)
- Meetup (événements communautaires)
- Quartier des Spectacles (événements culturels montréalais)

Ces sources fourniront déjà une bonne couverture des événements à Montréal.

## 🔄 Mise à Jour Future

Si Eventbrite vous donne accès à une API de recherche publique, mettez à jour le fichier :
- `src/ingestors/eventbrite.ts`

Avec le nouvel endpoint et la méthode d'authentification.















