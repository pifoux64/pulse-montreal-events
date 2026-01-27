# Plan d'Implémentation: Navigation Minimaliste + Système Multi-Rôles

## État Actuel
- Navigation complexe avec beaucoup d'éléments
- Système de rôles: UserRole enum (USER, ORGANIZER, ADMIN) - un seul rôle par utilisateur
- LanguageSelector avec texte visible
- Pas de système de claim pour les venues

## Objectifs
1. Navigation minimaliste (max 5 items publics)
2. Système multi-rôles (USER + ORGANIZER + VENUE simultanément)
3. Language switcher flag-only
4. ProfileMenu avec sections basées sur les rôles
5. Activation progressive des rôles
6. Système de claim VENUE avec vérification

## Fichiers à Créer/Modifier

### 1. Schéma Prisma ✅
- [x] Ajouter VENUE à UserRole enum
- [x] Créer VenueClaimStatus enum
- [x] Créer UserRoleAssignment model (multi-rôles)
- [x] Créer VenueClaim model
- [x] Mettre à jour relations User et Venue

### 2. Composants UI
- [x] `LanguageSwitcherFlag.tsx` - Drapeau uniquement
- [ ] `NavigationMinimal.tsx` - Nouvelle navigation (5 items max)
- [ ] `ProfileMenu.tsx` - Menu profil avec sections rôles
- [ ] `ExploreMenu.tsx` - Dropdown Explore
- [ ] `OrganizerEnableModal.tsx` - Modal activation ORGANIZER
- [ ] `VenueClaimModal.tsx` - Modal claim venue

### 3. APIs
- [ ] `POST /api/roles/enable-organizer` - Activation rôle ORGANIZER
- [ ] `POST /api/venues/:id/claim` - Créer claim venue
- [ ] `GET /api/venues/:id/claim` - Vérifier statut claim
- [ ] `GET /api/admin/venue-claims` - Liste claims (admin)
- [ ] `PATCH /api/admin/venue-claims/:id` - Approuver/rejeter (admin)

### 4. Middleware/Guards
- [ ] `src/lib/auth-guards.ts` - Helpers vérification rôles
- [ ] Mettre à jour `src/middleware.ts` - Guards routes /organizer/** et /venue/**
- [ ] `requireOrganizerRole()` - Helper activation progressive

### 5. Migrations
- [ ] Migration Prisma pour UserRoleAssignment
- [ ] Migration Prisma pour VenueClaim
- [ ] Migration données: convertir role existant en UserRoleAssignment

## Structure Navigation Minimaliste

### Top Nav (toujours visible, max 5 items)
1. **For You** (Pour toi) - `/pour-toi`
2. **Explore** (dropdown) - Catégories, Venues, Organizers, Pulse Picks
3. **Map** - `/carte`
4. **Favorites** - `/favoris`
5. **Search** (icône) - Recherche globale

### Profile Dropdown (selon rôles)

#### Section USER (toujours visible si connecté)
- Profile
- Notifications
- Pulsers (Friends)
- Settings
- Log out

#### Section ORGANIZER (si rôle ORGANIZER)
**Organizer Tools**
- Dashboard
- My Events
- Create Event
- Import Event
- AI Assistant
- Flyers & Printing
- Promotions
- Analytics
- Billing

#### Section VENUE (si rôle VENUE + claim vérifié)
**Venue Tools**
- Venue Dashboard
- My Venue Page
- Calendar
- Requests (Booking inquiries)
- Analytics
- Billing

## Prochaines Étapes

1. ✅ Schéma Prisma mis à jour
2. ✅ LanguageSwitcherFlag créé
3. ⏭️ Créer ProfileMenu avec sections rôles
4. ⏭️ Créer NavigationMinimal
5. ⏭️ API activation ORGANIZER
6. ⏭️ Système claim VENUE
7. ⏭️ Middleware guards
8. ⏭️ Admin panel claims
