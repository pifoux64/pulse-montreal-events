# 📋 Plan d'Intégration des Sources Futures - Pulse Montréal

Ce document liste les sources d'événements à intégrer après Bandsintown.

---

## ✅ Sources Déjà Intégrées

- ✅ **Ticketmaster** - API officielle, actif
- ✅ **Bandsintown** - API officielle, actif
- ✅ **Meetup** - API, actif
- ✅ **Open Data Montréal** - API publique, actif
- ✅ **Quartier des Spectacles** - Scraping/API
- ✅ **Tourisme Montréal** - Scraping/API
- ✅ **LaVitrine** - Scraping
- ✅ **AllEvents** - Scraping

---

## 🎯 Sources à Intégrer (Priorité)

### 1. Songkick (API semi-publique)

**Statut** : À faire  
**Type** : API  
**Difficulté** : Moyenne  
**Documentation** : https://www.songkick.com/developer

**Notes** :
- API semi-publique (nécessite une clé API)
- Permet de rechercher par ville (Montréal)
- Focus sur les concerts et événements musicaux
- Rate limit à respecter

**Implémentation** :
- Créer `src/ingestors/songkick.ts`
- Suivre la même structure que Ticketmaster/Bandsintown
- Endpoint : `https://api.songkick.com/api/3.0/events.json`
- Paramètres : `location=sk:12345` (ID de localisation) ou `location=geo:45.5088,-73.5542`

---

### 2. Eventful (selon pays)

**Statut** : À faire  
**Type** : API  
**Difficulté** : Moyenne  
**Documentation** : https://api.eventful.com/docs

**Notes** :
- API publique avec clé API requise
- Disponibilité variable selon le pays
- Recherche par localisation (Montréal)
- Catégories variées (musique, sport, famille, etc.)

**Implémentation** :
- Créer `src/ingestors/eventful.ts`
- Endpoint : `http://api.eventful.com/json/events/search`
- Paramètres : `location=Montreal`, `category=music,sports,family`, etc.

---

### 3. OpenAgenda

**Statut** : À faire  
**Type** : API  
**Difficulté** : Facile  
**Documentation** : https://openagenda.com/api

**Notes** :
- API publique gratuite
- Focus sur les événements culturels en France/Québec
- Format JSON simple
- Pas de clé API requise (pour les recherches publiques)

**Implémentation** :
- Créer `src/ingestors/openagenda.ts`
- Endpoint : `https://openagenda.com/agendas/{agenda_id}/events.json`
- Ou recherche : `https://openagenda.com/events.json?q=montreal`

---

### 4. Calendriers Municipaux

**Statut** : À faire  
**Type** : ICS / Scraping  
**Difficulté** : Variable  
**Documentation** : Variable selon la ville

**Notes** :
- Chaque ville a son propre format
- Formats communs : ICS, CSV, JSON
- Exemples :
  - Ville de Montréal : https://ville.montreal.qc.ca/calendrier
  - Arrondissements : Chaque arrondissement peut avoir son propre calendrier

**Implémentation** :
- Créer `src/ingestors/municipal-calendars.ts`
- Parser ICS avec une bibliothèque (ex: `ical.js`)
- Ou scraper les pages web si nécessaire
- Gérer plusieurs sources (Ville + arrondissements)

---

### 5. Maisons de la Culture

**Statut** : À faire  
**Type** : Scraping / API  
**Difficulté** : Moyenne  
**Documentation** : https://montreal.ca/lieux/maisons-de-la-culture

**Notes** :
- Réseau de maisons de la culture à Montréal
- Chaque maison a son propre site/calendrier
- Peut nécessiter du scraping ou une API si disponible
- Événements culturels variés (théâtre, musique, expositions, etc.)

**Implémentation** :
- Créer `src/ingestors/maisons-culture.ts`
- Lister les maisons de la culture
- Scraper ou utiliser API pour chaque maison
- Agréger les événements

---

### 6. Musées / Bibliothèques

**Statut** : À faire  
**Type** : Scraping / API  
**Difficulté** : Variable  
**Documentation** : Variable selon l'institution

**Notes** :
- Plusieurs musées à Montréal :
  - Musée des beaux-arts de Montréal
  - Musée d'art contemporain
  - Pointe-à-Callière
  - etc.
- Bibliothèques de Montréal : Réseau BAnQ
- Chaque institution peut avoir son propre format

**Implémentation** :
- Créer `src/ingestors/musees-bibliotheques.ts`
- Ou créer des connecteurs séparés par institution
- Scraper ou utiliser API selon disponibilité

---

## 📝 Structure Recommandée

Pour chaque nouvelle source, suivre la même structure que Ticketmaster/Bandsintown :

```typescript
// src/ingestors/[source].ts
import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage } from '@prisma/client';

export class [Source]Connector extends BaseConnector {
  constructor(apiKey?: string) {
    super(EventSource.[SOURCE], apiKey, BASE_URL, RATE_LIMIT);
  }

  async listUpdatedSince(since: Date, limit: number = 200): Promise<any[]> {
    // Récupérer les événements depuis l'API
  }

  async mapToUnifiedEvent(rawEvent: any): Promise<UnifiedEvent> {
    // Mapper vers UnifiedEvent
  }
}
```

Puis ajouter dans `src/lib/orchestrator.ts` :
1. Import du connecteur
2. Configuration dans `this.configs`
3. Case dans le switch pour initialiser

---

## 🔧 Variables d'Environnement

Ajouter dans `.env` et Vercel :

```env
# Songkick
SONGKICK_API_KEY=xxx

# Eventful
EVENTFUL_API_KEY=xxx

# Bandsintown (optionnel, utilise "pulse-montreal" par défaut)
BANDSINTOWN_APP_ID=pulse-montreal
```

---

## 📊 Priorisation

**Priorité Haute** :
1. Songkick (API fiable, beaucoup d'événements musicaux)
2. Eventful (API publique, catégories variées)

**Priorité Moyenne** :
3. OpenAgenda (API simple, événements culturels)
4. Calendriers municipaux (données officielles)

**Priorité Basse** :
5. Maisons de la culture (nécessite scraping)
6. Musées / Bibliothèques (sources multiples, formats variés)

---

## ✅ Checklist pour Chaque Source

- [ ] Créer le connecteur dans `src/ingestors/[source].ts`
- [ ] Ajouter `EventSource.[SOURCE]` dans `prisma/schema.prisma` (si nouveau)
- [ ] Importer et configurer dans `src/lib/orchestrator.ts`
- [ ] Tester avec quelques événements
- [ ] Documenter les variables d'environnement nécessaires
- [ ] Ajouter dans `README-ingestion.md`
- [ ] Tester le rate limiting
- [ ] Gérer les erreurs API
- [ ] Vérifier la déduplication avec les autres sources

---

**Dernière mise à jour** : Janvier 2025

