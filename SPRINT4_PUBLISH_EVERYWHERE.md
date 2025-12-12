# 🟧 SPRINT 4 — PUBLISH ONCE → PUBLISH EVERYWHERE

**Date** : Janvier 2025  
**Statut** : 📋 Planifié  
**Objectif** : Système complet de publication multi-plateformes (Facebook, Eventbrite, Resident Advisor, Bandsintown)

**Principe** : "Créer un événement une fois sur Pulse → le publier automatiquement sur toutes les plateformes connectées"

---

## 🎯 Vision

Créer un événement une fois sur Pulse → le publier automatiquement sur toutes les plateformes connectées.

**Principe** : "Publish Once → Publish Everywhere"

---

## 📋 Tâches Détaillées

### 1. 🆕 Modèle d'événement universel (Event Universal Schema)

**Objectif** : Créer un schéma unifié contenant tous les champs nécessaires pour toutes les plateformes

**Champs à inclure** :
- **Métadonnées de base** :
  - titre, description
  - cover image (URL)
  - dates (start, end, timezone)
  - lieu (adresse complète + lat/lng + nom)
  
- **Catégorisation** :
  - catégorie, sous-catégorie, format
  - genres musicaux (tags IA existants)
  - type d'événement (EventTag)
  
- **Billetterie** :
  - lien billetterie
  - prix (min, max, currency)
  - gratuit / payant
  
- **Restrictions** :
  - restrictions d'âge (18+, 21+, etc.)
  - public cible (tout_public, famille, etc.)
  
- **Métadonnées spécifiques** :
  - lineup (artistes) - pour RA
  - tags musicaux détaillés - pour RA
  - description longue - pour Facebook/Eventbrite

**Fichiers à créer** :
- `src/lib/publishing/universalEventSchema.ts` - Schéma TypeScript
- `src/lib/publishing/validators.ts` - Validateurs par plateforme

---

### 2. 🔄 Mise à jour du formulaire de création d'événement

**Fichier** : `src/components/EventForm.tsx`

**Champs à ajouter/améliorer** :
- ✅ Titre, description (déjà présent)
- ✅ Cover image (déjà présent)
- ✅ Dates, timezone (déjà présent)
- ✅ Lieu (déjà présent)
- ✅ Catégorie, sous-catégorie (déjà présent)
- ✅ Genres musicaux (utiliser EventTag existants)
- ✅ Lien billetterie (déjà présent)
- ✅ Restrictions d'âge (déjà présent)
- ✅ Prix (déjà présent)
- 🆕 **Lineup** (artistes) - Nouveau champ pour RA
- 🆕 **Description longue** - Champ séparé pour Facebook/Eventbrite

**Actions** :
1. Ajouter champ "Lineup" (liste d'artistes)
2. Ajouter champ "Description longue" (optionnel, pour les plateformes externes)
3. Améliorer la validation des champs requis pour publication

---

### 3. 🆕 Modules de publication

#### 3.1 Facebook Publisher
**Fichier** : `src/lib/publishing/facebookPublisher.ts`

**Fonctionnalités** :
- `publishEventToFacebook(eventId, organizerId)` : Publier un événement
- `updateFacebookEvent(eventId, facebookEventId)` : Mettre à jour un événement
- `deleteFacebookEvent(facebookEventId)` : Supprimer un événement

**API Facebook Events** :
- Endpoint : `POST /{page-id}/events`
- Scopes requis : `pages_manage_events`, `pages_show_list`
- Champs : name, description, start_time, end_time, place, cover, ticket_uri

**Référence** : https://developers.facebook.com/docs/graph-api/reference/event

---

#### 3.2 Eventbrite Publisher
**Fichier** : `src/lib/publishing/eventbritePublisher.ts`

**Fonctionnalités** :
- `publishEventToEventbrite(eventId, organizerId)` : Publier un événement
- `updateEventbriteEvent(eventId, eventbriteEventId)` : Mettre à jour
- `createOrGetVenue(venueData)` : Créer ou récupérer un lieu Eventbrite

**API Eventbrite** :
- Endpoint : `POST /v3/organizations/{org_id}/events/`
- Venue : `POST /v3/venues/` (créer) ou `GET /v3/venues/{venue_id}/` (récupérer)
- Champs : name, description, start, end, venue_id, online_event, ticket_availability

**Référence** : https://www.eventbrite.com/platform/api/

---

#### 3.3 Resident Advisor Exporter
**Fichier** : `src/lib/publishing/residentAdvisorExporter.ts`

**Fonctionnalités** :
- `exportToRAFormat(eventId)` : Générer un fichier JSON/CSV au format RA
- Format RA structuré :
  ```json
  {
    "title": "...",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "venue": "...",
    "lineup": ["Artist 1", "Artist 2"],
    "genre": "techno",
    "description": "...",
    "ticket_url": "..."
  }
  ```

**Note** : RA n'a pas d'API publique, donc export de fichier uniquement

---

#### 3.4 Bandsintown Publisher
**Fichier** : `src/lib/publishing/bandsintownPublisher.ts`

**Fonctionnalités** :
- `publishEventToBandsintown(eventId, artistId)` : Publier un événement
- Vérifier si l'API Bandsintown est disponible pour les organisateurs

**API Bandsintown** :
- Endpoint : `POST /artists/{artist_id}/events`
- Nécessite : artist_id, API key

**Référence** : https://www.bandsintown.com/api/overview

---

### 4. 🆕 Page d'intégrations organisateur

**Fichier** : `src/app/organisateur/integrations/page.tsx`

**Fonctionnalités** :
- Afficher les plateformes disponibles (Facebook, Eventbrite, RA, Bandsintown)
- Statut de connexion pour chaque plateforme
- Bouton "Connecter" pour chaque plateforme
- Gérer les tokens OAuth
- Afficher les pages Facebook connectées
- Afficher les organisateurs Eventbrite connectés

**Modèle Prisma à créer** :
```prisma
model PlatformConnection {
  id            String   @id @default(uuid())
  organizerId   String   @map("organizer_id") @db.Uuid
  platform      String   // 'facebook', 'eventbrite', 'bandsintown'
  platformUserId String? @map("platform_user_id") // ID utilisateur sur la plateforme
  accessToken   String?  @map("access_token") @db.Text
  refreshToken  String?  @map("refresh_token") @db.Text
  expiresAt     DateTime? @map("expires_at")
  metadata      Json?    // Données supplémentaires (pages Facebook, etc.)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  organizer Organizer @relation(fields: [organizerId], references: [id], onDelete: Cascade)

  @@unique([organizerId, platform])
  @@map("platform_connections")
}
```

**OAuth Flows** :
- **Facebook** : OAuth 2.0 → récupérer pages → sélectionner page
- **Eventbrite** : OAuth 2.0 → récupérer organisateur
- **Bandsintown** : API Key (si disponible)

---

### 5. 🆕 Bouton "Publier partout"

**Emplacements** :
- Page de création d'événement (`/publier`)
- Page d'édition d'événement (`/organisateur/events/[id]/edit`)
- Dashboard organisateur

**Fonctionnalités** :
- Valider les champs requis pour chaque plateforme
- Afficher les plateformes disponibles (connectées)
- Bouton "Publier partout" qui :
  1. Valide les champs
  2. Appelle chaque publisher
  3. Enregistre un PublicationLog
  4. Affiche les résultats (succès/erreurs)

**Composant** : `src/components/PublishEverywhereButton.tsx`

---

### 6. 🔄 Synchronisation automatique

**Fonctionnalités** :
- Si un événement Pulse change → synchroniser avec les plateformes connectées
- Webhook ou polling pour détecter les changements
- Gérer les conflits (si l'événement a été modifié sur la plateforme externe)

**Implémentation** :
- Hook `useEventSync` pour détecter les changements
- Fonction `syncEventToPlatforms(eventId)` dans l'orchestrateur
- Option "Synchroniser maintenant" dans l'UI

---

### 7. ⚠️ Gestion des erreurs

**Scénarios à gérer** :
- **Tokens expirés** : Détecter et demander reconnexion
- **Permissions manquantes** : Afficher message clair
- **Champs obligatoires manquants** : Validation avant publication
- **Erreurs API** : Logger et afficher à l'utilisateur
- **Rate limiting** : Retry avec backoff

**Modèle Prisma** :
```prisma
model PublicationLog {
  id              String   @id @default(uuid())
  eventId         String   @map("event_id") @db.Uuid
  organizerId     String   @map("organizer_id") @db.Uuid
  platform        String   // 'facebook', 'eventbrite', 'ra', 'bandsintown'
  status          String   // 'success', 'error', 'pending'
  platformEventId String?  @map("platform_event_id") // ID de l'événement sur la plateforme
  errorMessage    String?  @map("error_message") @db.Text
  metadata        Json?    // Données supplémentaires
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  event     Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  organizer Organizer @relation(fields: [organizerId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([organizerId])
  @@map("publication_logs")
}
```

---

### 8. 📝 Documentation

**Fichier** : `docs/PUBLISHING.md`

**Contenu** :
- Vue d'ensemble du système
- Guide de configuration pour chaque plateforme
- Schéma d'événement universel
- Exemples de code
- Gestion des erreurs
- FAQ

---

## 📋 Checklist Finale SPRINT 4

- [ ] Modèle d'événement universel créé
- [ ] Formulaire de création mis à jour (lineup, description longue)
- [ ] Facebook Publisher implémenté
- [ ] Eventbrite Publisher implémenté
- [ ] Resident Advisor Exporter implémenté
- [ ] Bandsintown Publisher implémenté (si API disponible)
- [ ] Page `/organisateur/integrations` créée
- [ ] OAuth Facebook configuré
- [ ] OAuth Eventbrite configuré
- [ ] Bouton "Publier partout" créé
- [ ] Synchronisation automatique implémentée
- [ ] Gestion des erreurs complète
- [ ] PublicationLog créé dans Prisma
- [ ] Documentation PUBLISHING.md créée

---

## 🚀 Prochaines Étapes

Une fois le SPRINT 4 complété :
1. Tester la publication sur toutes les plateformes
2. Vérifier la synchronisation automatique
3. Améliorer l'UX de publication
4. Passer au SPRINT 5 (Monétisation)

---

## 📝 Notes Techniques

### Sécurité
- Stocker les tokens OAuth de manière sécurisée (chiffrés)
- Ne jamais exposer les tokens dans le frontend
- Utiliser des variables d'environnement pour les clés API

### Performance
- Publication asynchrone (ne pas bloquer l'UI)
- Queue de publication pour gérer les erreurs
- Retry automatique pour les erreurs temporaires

### UX
- Feedback en temps réel pendant la publication
- Afficher les statuts de publication (succès/erreur)
- Permettre la publication sélective (choisir les plateformes)

---

**Note** : Ce sprint nécessite des clés API et des configurations OAuth pour chaque plateforme. Certaines plateformes peuvent nécessiter une approbation d'application.

