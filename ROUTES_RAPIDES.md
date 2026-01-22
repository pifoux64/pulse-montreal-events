# 🚀 Routes Rapides - Accès Direct

## 📍 Routes Publiques (sans connexion)

| Route | Description | Sprint |
|-------|-------------|--------|
| `/` | Page d'accueil | - |
| `/salle/[slug]` | Fiche salle publique | Sprint 1 |
| `/evenement/[id]` | Page événement | - |
| `/top-5` | Liste des Top 5 | Sprint 6 |
| `/top-5/[slug]` | Détail d'un Top 5 | Sprint 6 |
| `/organisateur/[id]` | Profil organisateur | - |

## 🔐 Routes Authentifiées

| Route | Description | Sprint | Rôle requis |
|-------|-------------|--------|-------------|
| `/venue/dashboard` | Dashboard salle | Sprint 2 | USER |
| `/organisateur/dashboard` | Dashboard organisateur | Sprint 4 | ORGANIZER |
| `/social` | Page sociale | Sprint 6 | USER |
| `/profil` | Profil utilisateur | - | USER |
| `/favoris` | Mes favoris | - | USER |

## 🛠️ Routes API Principales

### Salles (Sprint 1-2)
- `GET /api/venues/slug/[slug]` - Récupérer salle par slug
- `GET /api/venues/me` - Mes salles
- `POST /api/venues` - Créer salle
- `PATCH /api/venues/[id]` - Modifier salle
- `GET /api/venues/[id]/stats` - Statistiques salle
- `GET /api/geocode?address=...` - Géocoder une adresse

### Demandes de réservation (Sprint 3)
- `POST /api/venue-requests` - Créer demande
- `GET /api/venue-requests?venueId=...` - Liste pour salle
- `GET /api/venue-requests?organizerId=...` - Liste pour organisateur
- `PATCH /api/venue-requests/[id]` - Accepter/refuser

### IA Organisateurs (Sprint 4)
- `POST /api/ai/event-assistant` - Assistant événement
- `POST /api/ai/content-generator` - Générateur contenu
- `POST /api/ai/budget-calculator` - Calculateur budget

### IA Salles (Sprint 5)
- `POST /api/ai/venue-suggestions` - Suggestions
- `POST /api/ai/venue-matching` - Matching
- `GET /api/venues/[id]/occupation-stats` - Stats occupation

### Social (Sprint 6)
- `POST /api/users/follow` - Suivre utilisateur
- `DELETE /api/users/follow?userId=...` - Défollow
- `GET /api/users/following` - Liste des utilisateurs suivis
- `GET /api/users/friends/events` - Événements des amis
- `GET /api/trending?scope=...` - Événements tendance
- `POST /api/events/invitations` - Envoyer invitation
- `GET /api/events/invitations?type=...` - Mes invitations
- `PATCH /api/events/invitations/[id]` - Répondre invitation

### Monétisation (Sprint 7)
- `GET /api/subscriptions/plans?type=...` - Plans disponibles
- `GET /api/subscriptions/organizer` - Abonnement organisateur
- `POST /api/subscriptions/organizer` - Créer abonnement
- `GET /api/subscriptions/venue?venueId=...` - Abonnement salle
- `POST /api/subscriptions/venue` - Créer abonnement

---

## 🎯 Parcours Utilisateur Recommandé

### Parcours Organisateur
1. `/organisateur/mon-profil` - Créer profil
2. `/organisateur/dashboard` - Dashboard
3. `/organisateur/dashboard` → Outils IA - Tester les outils
4. `/salle/[slug]` - Voir une salle
5. Cliquer "Demander cette salle" - Tester demande réservation
6. `/organisateur/dashboard` → Abonnement - Voir les plans

### Parcours Propriétaire de Salle
1. `/venue/dashboard` - Dashboard
2. Créer une salle
3. Voir la page publique `/salle/[slug]`
4. `/venue/dashboard` → Demandes de réservation - Gérer demandes
5. `/venue/dashboard` → Outils IA - Tester les outils
6. `/venue/dashboard` → Abonnement - Voir les plans

### Parcours Utilisateur Social
1. Se connecter
2. `/social` - Page sociale
3. Suivre des utilisateurs (via API ou UI)
4. Favoriser des événements
5. `/social` → Mes amis - Voir événements des amis
6. `/social` → Tendance - Voir événements tendance
7. Sur un événement → "Inviter des amis"
8. `/social` → Invitations - Gérer invitations

---

## 🔑 Comptes de Test Recommandés

Pour tester efficacement, créez :

1. **Compte Organisateur**
   - Email : `organisateur@test.com`
   - Rôle : ORGANIZER
   - Créer des événements

2. **Compte Propriétaire de Salle**
   - Email : `salle@test.com`
   - Rôle : USER
   - Créer des salles

3. **Compte Utilisateur Social**
   - Email : `user1@test.com`
   - Rôle : USER
   - Favoriser des événements

4. **Compte Utilisateur Social 2**
   - Email : `user2@test.com`
   - Rôle : USER
   - Suivre user1, recevoir invitations

---

## 📱 Navigation Rapide

### Depuis la page d'accueil
- Cliquer sur un événement → `/evenement/[id]`
- Si événement a une salle avec slug → Lien vers `/salle/[slug]`
- Si connecté → Bouton "Inviter des amis" sur événement

### Depuis le menu Navigation
- **Profil** → `/profil`
- **Favoris** → `/favoris`
- **Dashboard Organisateur** → `/organisateur/dashboard` (si organisateur)
- **Dashboard Salle** → `/venue/dashboard` (si utilisateur)

### Liens directs
- `/top-5` - Liste des Top 5
- `/social` - Page sociale
- `/organisateur/mon-profil` - Créer profil organisateur

---

## 🧪 Commandes Utiles

```bash
# Lancer le serveur
npm run dev

# Ouvrir Prisma Studio
npx prisma studio

# Vérifier les types
npm run typecheck

# Tests automatisés
./scripts/test-all-sprints.sh
```

---

## 📖 Documentation Complète

- `GUIDE_ACCES_SPRINTS.md` - Ce guide détaillé
- `PLAN_TEST_COMPLET.md` - Plan de test complet
- `TESTING_GUIDE.md` - Guide de test rapide
- `TROUBLESHOOTING.md` - Dépannage
- `SPRINT*.md` - Documentation de chaque sprint
