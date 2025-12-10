# 🎫 Configuration Lepointdevente.com - Pulse Montreal

## Vue d'ensemble

Lepointdevente.com est une plateforme de billetterie québécoise qui propose des événements culturels, concerts, spectacles et festivals à Montréal et dans tout le Québec.

## Statut actuel

**⚠️ Connecteur en développement**

Le connecteur Lepointdevente.com a été créé mais nécessite une implémentation complète car :
- ❌ Pas d'API publique documentée
- ⚠️ Nécessite du scraping HTML ou un partenariat API
- ✅ Structure de base créée et prête à être étendue

## Stratégies d'implémentation

### ⚠️ IMPORTANT : Pas de Scraping HTML

**Le scraping HTML est illégal et non durable.** Le connecteur ne fait **PAS** de scraping.

### Option 1 : API Officielle (Recommandé)

Le connecteur teste automatiquement plusieurs endpoints API potentiels :
- `/api/events`
- `/api/v1/events`
- `/events.json`
- `/api/events.json`
- `/api/public/events`

**À faire :**
1. Explorer le site pour identifier des endpoints JSON
2. Analyser les requêtes réseau du site (DevTools)
3. Adapter `parseApiResponse()` selon la structure de la réponse

### Option 2 : Flux RSS (Si disponible)

**Contact :**
- Site web : https://lepointdevente.com/contact/
- Demander l'accès à une API ou un flux de données

**Avantages :**
- Données structurées et fiables
- Pas de risque de breaking changes
- Meilleure performance

## Configuration

### Variables d'environnement

Aucune variable d'environnement requise pour l'instant (scraping HTML).

Si une API devient disponible :
```env
LEPOINTDEVENTE_API_KEY=votre_cle_api
```

### Activation

Le connecteur est activé par défaut dans `orchestrator.ts` :
```typescript
{
  source: EventSource.LEPOINTDEVENTE,
  enabled: true,
  batchSize: 100,
}
```

Pour désactiver temporairement :
```typescript
enabled: false,
```

## Structure du connecteur

### Fichier
`src/ingestors/lepointdevente.ts`

### Méthodes principales

1. **`listUpdatedSince(since: Date, limit: number)`**
   - Récupère les événements depuis une date donnée
   - Essaie d'abord le scraping HTML
   - Puis teste les endpoints API potentiels

2. **`mapToUnifiedEvent(rawEvent)`**
   - Convertit un événement brut en format unifié
   - Géocode les adresses
   - Extrait les tags et catégories

3. **`scrapeEventsList(since, limit)`** (privée)
   - Scrape la page HTML de liste d'événements
   - Parse les données avec Cheerio

4. **`tryApiEndpoints(since, limit)`** (privée)
   - Teste plusieurs endpoints API potentiels
   - Parse les réponses JSON

## Tests

### Test manuel

```bash
# Lancer l'ingestion pour Lepointdevente.com uniquement
curl -X POST http://localhost:3000/api/admin/ingest/LEPOINTDEVENTE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Vérifier les logs

Les logs indiquent :
- ✅ Nombre d'événements récupérés
- ⚠️ Avertissements si aucun événement trouvé
- ❌ Erreurs de scraping ou d'API

## Prochaines étapes

1. **Explorer le site** pour comprendre la structure HTML
2. **Adapter les sélecteurs CSS** dans `scrapeEventsList()`
3. **Tester la récupération** avec quelques événements
4. **Valider le mapping** des données
5. **Contacter Lepointdevente.com** pour un partenariat API (optionnel)

## Notes importantes

- ⚠️ **Respect des robots.txt** : Vérifier `https://lepointdevente.com/robots.txt` avant de scraper
- ⚠️ **Rate limiting** : Le connecteur respecte un délai de 2 secondes entre requêtes
- ⚠️ **User-Agent** : Utilise un User-Agent identifié : `Pulse-Montreal/1.0`
- ✅ **Géocodage** : Utilise Nominatim (OpenStreetMap) pour géocoder les adresses
- ✅ **Déduplication** : Les événements sont automatiquement dédupliqués par l'orchestrateur

## Références

- Site web : https://lepointdevente.com
- Contact : https://lepointdevente.com/contact/
- Documentation scraping : Voir `src/ingestors/lavitrine.ts` pour un exemple similaire

