# État d'Avancement: Navigation Minimaliste + Système Multi-Rôles

## ✅ Complété

### 1. Schéma Prisma
- ✅ Ajout de `VENUE` à l'enum `UserRole`
- ✅ Création de l'enum `VenueClaimStatus` (UNCLAIMED, PENDING, VERIFIED, REJECTED)
- ✅ Création du modèle `UserRoleAssignment` pour système multi-rôles
- ✅ Création du modèle `VenueClaim` pour système de claim venues
- ✅ Mise à jour des relations User et Venue
- ✅ Schéma validé et formaté

### 2. Composants UI
- ✅ `LanguageSwitcherFlag.tsx` - Sélecteur de langue avec drapeau uniquement
  - Affiche uniquement le drapeau de la locale actuelle
  - Dropdown avec drapeaux et labels courts (FR, EN, ES)
  - Accessible avec aria-label
  - Intègre avec next-intl et sauvegarde préférence

## 🚧 En Cours

### 3. Navigation Minimaliste
- ⏳ `NavigationMinimal.tsx` - Nouvelle navigation (5 items max)
  - For You / Explore / Map / Favorites / Search
  - Intégration LanguageSwitcherFlag
  - ProfileMenu avec sections rôles

### 4. ProfileMenu
- ⏳ `ProfileMenu.tsx` - Menu profil avec sections basées sur rôles
  - Section USER (toujours visible)
  - Section ORGANIZER (si rôle actif)
  - Section VENUE (si rôle actif + claim vérifié)

## 📋 À Faire

### 5. Composants Modaux
- [ ] `OrganizerEnableModal.tsx` - Modal activation ORGANIZER progressive
- [ ] `VenueClaimModal.tsx` - Modal claim venue
- [ ] `ExploreMenu.tsx` - Dropdown Explore (Catégories, Venues, Organizers, Pulse Picks)

### 6. APIs
- [ ] `POST /api/roles/enable-organizer` - Activation rôle ORGANIZER
- [ ] `POST /api/venues/:id/claim` - Créer claim venue
- [ ] `GET /api/venues/:id/claim` - Vérifier statut claim
- [ ] `GET /api/admin/venue-claims` - Liste claims (admin)
- [ ] `PATCH /api/admin/venue-claims/:id` - Approuver/rejeter (admin)

### 7. Middleware/Guards
- [ ] `src/lib/auth-guards.ts` - Helpers vérification rôles
- [ ] Mise à jour `src/middleware.ts` - Guards routes /organizer/** et /venue/**
- [ ] `requireOrganizerRole()` - Helper activation progressive

### 8. Migrations
- [ ] Migration Prisma pour UserRoleAssignment
- [ ] Migration Prisma pour VenueClaim
- [ ] Migration données: convertir role existant en UserRoleAssignment

## 📝 Notes

- Le schéma Prisma est prêt mais nécessite une migration avant utilisation
- Le composant LanguageSwitcherFlag est prêt à être intégré dans Navigation
- La navigation actuelle est complexe et nécessite une refonte complète
- Le système multi-rôles permettra USER + ORGANIZER + VENUE simultanément

## 🎯 Prochaines Actions Recommandées

1. Créer la migration Prisma
2. Créer ProfileMenu avec support multi-rôles
3. Créer NavigationMinimal avec 5 items max
4. Intégrer LanguageSwitcherFlag dans NavigationMinimal
5. Créer API activation ORGANIZER
6. Créer système claim VENUE
