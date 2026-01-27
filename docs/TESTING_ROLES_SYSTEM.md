# Guide de Test - Système Multi-Rôles et Venue Claims

Ce guide vous aide à tester le système de rôles multi-rôles et de venue claims.

## Prérequis

1. Migration appliquée avec succès (voir `scripts/apply-venue-claims-migration.ts`)
2. Utilisateur de test créé et connecté
3. Accès admin pour tester la modération des venue claims

---

## 1. Test de l'Activation du Rôle ORGANIZER

### Scénario 1: Activation progressive depuis une action

1. **Se connecter** avec un compte utilisateur standard (USER)
2. **Essayer d'accéder** à `/publier` ou `/organisateur/dashboard`
3. **Vérifier** qu'un modal apparaît demandant d'activer le mode Organizer
4. **Cliquer sur "Activer"**
5. **Vérifier** que:
   - Le rôle ORGANIZER est ajouté dans `user_role_assignments`
   - Un `OrganizerProfile` est créé
   - Le rôle legacy `User.role` est mis à jour à ORGANIZER
   - La redirection vers la page demandée fonctionne

### Scénario 2: Activation via API directe

```bash
# POST /api/roles/enable-organizer
curl -X POST http://localhost:3000/api/roles/enable-organizer \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Résultat attendu:**
```json
{
  "message": "Rôle ORGANIZER activé avec succès",
  "organizerProfileCreated": true
}
```

### Vérification dans la base de données

```sql
-- Vérifier les rôles de l'utilisateur
SELECT u.email, u.role, ura.role as assigned_role
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE u.email = 'test@example.com';

-- Vérifier le profil organisateur
SELECT * FROM organizers WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

---

## 2. Test du Système de Venue Claims

### Scénario 1: Soumettre un claim de venue

1. **Se connecter** avec un compte utilisateur
2. **Naviguer** vers une page de venue (ex: `/salle/[slug]`)
3. **Vérifier** que le bouton "Claim this venue" est visible
4. **Cliquer** sur "Claim this venue"
5. **Remplir** le formulaire:
   - Rôle à la venue (owner/manager/booker)
   - Email professionnel
   - Site web (optionnel)
   - Lien social (optionnel)
6. **Soumettre** le claim
7. **Vérifier** que:
   - Le claim est créé avec le statut `PENDING`
   - Un message de confirmation s'affiche
   - Le bouton affiche maintenant "Pending"

### Scénario 2: Vérifier le statut d'un claim

```bash
# GET /api/venues/[id]/claim
curl http://localhost:3000/api/venues/VENUE_ID/claim \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Résultat attendu:**
```json
{
  "claim": {
    "id": "...",
    "status": "PENDING",
    "venueId": "...",
    "userId": "...",
    "createdAt": "..."
  }
}
```

### Vérification dans la base de données

```sql
-- Vérifier les claims d'un utilisateur
SELECT vc.*, v.name as venue_name, u.email as user_email
FROM venue_claims vc
JOIN venues v ON vc.venue_id = v.id
JOIN users u ON vc.user_id = u.id
WHERE u.email = 'test@example.com';

-- Vérifier les claims en attente
SELECT COUNT(*) FROM venue_claims WHERE status = 'PENDING';
```

---

## 3. Test de la Modération Admin (Venue Claims)

### Scénario 1: Approuver un claim

1. **Se connecter** avec un compte ADMIN
2. **Naviguer** vers `/admin/venue-claims`
3. **Vérifier** que la liste des claims s'affiche
4. **Trouver** un claim avec le statut `PENDING`
5. **Cliquer** sur "Approuver"
6. **Vérifier** que:
   - Le statut passe à `VERIFIED`
   - Le rôle VENUE est ajouté à l'utilisateur dans `user_role_assignments`
   - Le rôle legacy `User.role` est mis à jour à VENUE
   - Le champ `venue.owner_user_id` est mis à jour
   - `reviewed_by` et `reviewed_at` sont remplis

### Scénario 2: Rejeter un claim

1. **Sur la page** `/admin/venue-claims`
2. **Cliquer** sur "Rejeter" pour un claim PENDING
3. **Entrer** une raison de rejet (optionnel)
4. **Confirmer**
5. **Vérifier** que:
   - Le statut passe à `REJECTED`
   - La raison de rejet est enregistrée
   - Le rôle VENUE n'est PAS ajouté à l'utilisateur

### Vérification dans la base de données

```sql
-- Vérifier les claims approuvés
SELECT vc.*, v.name as venue_name, u.email as user_email, 
       reviewer.email as reviewer_email
FROM venue_claims vc
JOIN venues v ON vc.venue_id = v.id
JOIN users u ON vc.user_id = u.id
LEFT JOIN users reviewer ON vc.reviewed_by = reviewer.id
WHERE vc.status = 'VERIFIED';

-- Vérifier que le rôle VENUE a été ajouté
SELECT u.email, ura.role
FROM users u
JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE ura.role = 'VENUE';
```

---

## 4. Test des Guards Middleware

### Test ORGANIZER Guard

1. **Se connecter** avec un compte USER (sans rôle ORGANIZER)
2. **Essayer d'accéder** à `/organisateur/dashboard`
3. **Vérifier** la redirection vers `/` avec `?error=organizer_required`
4. **Activer** le rôle ORGANIZER
5. **Réessayer** d'accéder à `/organisateur/dashboard`
6. **Vérifier** que l'accès est autorisé

### Test VENUE Guard

1. **Se connecter** avec un compte USER (sans rôle VENUE)
2. **Essayer d'accéder** à `/venue/dashboard`
3. **Vérifier** la redirection vers `/` avec `?error=venue_required`
4. **Soumettre** un claim de venue et le faire approuver par un admin
5. **Réessayer** d'accéder à `/venue/dashboard`
6. **Vérifier** que l'accès est autorisé

### Test ADMIN Guard

1. **Se connecter** avec un compte USER (sans rôle ADMIN)
2. **Essayer d'accéder** à `/admin/venue-claims`
3. **Vérifier** la redirection vers `/` avec `?error=admin_required`
4. **Donner** le rôle ADMIN à l'utilisateur (via script ou DB)
5. **Réessayer** d'accéder à `/admin/venue-claims`
6. **Vérifier** que l'accès est autorisé

---

## 5. Test de la Navigation Multi-Rôles

### Test ProfileMenu

1. **Se connecter** avec un compte ayant plusieurs rôles (ex: USER + ORGANIZER + VENUE)
2. **Cliquer** sur le menu profil (avatar)
3. **Vérifier** que:
   - La section "USER" est visible avec les liens de base
   - La section "Organizer Tools" est visible si ORGANIZER
   - La section "Venue Tools" est visible si VENUE
   - La section "Admin" est visible si ADMIN
   - Les badges de rôles s'affichent dans l'en-tête du menu

### Test NavigationMinimal

1. **Vérifier** que la navigation principale affiche:
   - "For You" (Pour toi)
   - "Explore" (menu déroulant)
   - "Map" (Carte)
   - "Favorites" (Favoris)
   - "Search" (icône)
2. **Vérifier** que "Create Event" n'est PAS dans la nav principale
3. **Vérifier** que le sélecteur de langue (drapeau) fonctionne
4. **Vérifier** que le menu profil s'ouvre correctement

---

## 6. Test des APIs

### Test API Enable Organizer

```bash
# Test avec session valide
POST /api/roles/enable-organizer
Headers: Cookie avec session

# Réponse attendue (200):
{
  "message": "Rôle ORGANIZER activé avec succès",
  "organizerProfileCreated": true
}

# Test sans session (401):
{
  "error": "Non authentifié"
}
```

### Test API Venue Claim

```bash
# Créer un claim
POST /api/venues/[id]/claim
Body: {
  "roleAtVenue": "owner",
  "professionalEmail": "owner@venue.com",
  "website": "https://venue.com",
  "socialLink": "https://facebook.com/venue"
}

# Vérifier le statut
GET /api/venues/[id]/claim
```

### Test API Admin Venue Claims

```bash
# Lister les claims
GET /api/admin/venue-claims?status=PENDING&page=1&pageSize=20

# Approuver un claim
PATCH /api/admin/venue-claims/[id]
Body: {
  "action": "approve"
}

# Rejeter un claim
PATCH /api/admin/venue-claims/[id]
Body: {
  "action": "reject",
  "rejectionReason": "Informations insuffisantes"
}
```

---

## 7. Checklist de Vérification

### Base de données
- [ ] Table `user_role_assignments` créée
- [ ] Table `venue_claims` créée
- [ ] Enum `VenueClaimStatus` créé
- [ ] Enum `UserRole` contient `VENUE`
- [ ] Colonne `venues.owner_user_id` ajoutée
- [ ] Indexes créés correctement
- [ ] Foreign keys fonctionnent

### Session NextAuth
- [ ] `session.user.roles` contient tous les rôles
- [ ] `session.user.role` contient le rôle legacy
- [ ] Les rôles sont mis à jour après activation

### Middleware
- [ ] Guard ORGANIZER fonctionne
- [ ] Guard VENUE fonctionne
- [ ] Guard ADMIN fonctionne
- [ ] Redirections correctes en cas d'accès refusé

### UI
- [ ] ProfileMenu affiche les sections selon les rôles
- [ ] NavigationMinimal fonctionne
- [ ] ExploreMenu fonctionne
- [ ] LanguageSwitcherFlag fonctionne
- [ ] AdminNav fonctionne sur les pages admin

### APIs
- [ ] `/api/roles/enable-organizer` fonctionne
- [ ] `/api/venues/[id]/claim` (POST/GET) fonctionne
- [ ] `/api/admin/venue-claims` (GET) fonctionne
- [ ] `/api/admin/venue-claims/[id]` (PATCH) fonctionne

---

## 8. Scripts Utiles

### Donner le rôle ADMIN à un utilisateur

```bash
tsx scripts/make-admin.ts user@example.com
```

### Vérifier les rôles d'un utilisateur

```typescript
// Dans un script ou console
import { prisma } from './src/lib/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    roleAssignments: true,
  },
});

console.log('Rôle legacy:', user?.role);
console.log('Rôles assignés:', user?.roleAssignments);
```

### Créer un claim de test

```typescript
import { prisma } from './src/lib/prisma';
import { VenueClaimStatus } from '@prisma/client';

const claim = await prisma.venueClaim.create({
  data: {
    venueId: 'VENUE_ID',
    userId: 'USER_ID',
    status: VenueClaimStatus.PENDING,
    roleAtVenue: 'owner',
    professionalEmail: 'test@venue.com',
  },
});
```

---

## 9. Problèmes Courants et Solutions

### Problème: Les rôles ne s'affichent pas dans la session

**Solution:** Vérifier que la session NextAuth est bien rafraîchie après l'activation d'un rôle. Il peut être nécessaire de se déconnecter et se reconnecter.

### Problème: Le middleware bloque l'accès même avec le bon rôle

**Solution:** Vérifier que `roleAssignments` est bien inclus dans la requête Prisma du middleware.

### Problème: Le claim n'apparaît pas dans l'admin

**Solution:** Vérifier que l'utilisateur a bien le rôle ADMIN et que la requête inclut bien les relations `venue`, `user`, `reviewer`.

### Problème: L'approbation d'un claim ne donne pas le rôle VENUE

**Solution:** Vérifier que l'API `/api/admin/venue-claims/[id]` crée bien l'entrée dans `user_role_assignments` et met à jour `User.role`.

---

## 10. Tests Automatisés (Optionnel)

Pour créer des tests automatisés, voir:
- `tests/` pour les tests existants
- Ajouter des tests pour les APIs de rôles
- Ajouter des tests pour le middleware

---

**Dernière mise à jour:** Janvier 2026
