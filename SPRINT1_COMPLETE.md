# ✅ SPRINT 1 - COMPLÉTÉ

## 🎯 Objectif
Refonte complète de la page d'accueil avec mode "Aujourd'hui" / "Ce week-end" selon les spécifications du document Pulse.

## 📋 Livrables

### 1. ✅ Endpoint GET /api/events amélioré

**Fichier modifié:** `src/app/api/events/route.ts`

**Nouveaux paramètres supportés:**
- `scope=today|weekend|all` - Filtre temporel selon le mode
- `tag=string` - Filtre par tag unique
- `lat`, `lng` (ou `lon`) - Coordonnées optionnelles
- `radius` (ou `distanceKm`) - Rayon de recherche optionnel

**Logique temporelle implémentée:**
- `scope=today` : Événements du jour (00:00 à 23:59, timezone Montréal)
- `scope=weekend` : Événements du week-end (vendredi 00:00 à dimanche 23:59)
- Calcul automatique du week-end selon le jour actuel

**Exemples d'utilisation:**
```bash
# Événements d'aujourd'hui
GET /api/events?scope=today

# Événements du week-end
GET /api/events?scope=weekend

# Événements avec tag spécifique
GET /api/events?scope=today&tag=musique

# Événements avec géolocalisation
GET /api/events?scope=today&lat=45.5088&lng=-73.5542&radius=10
```

### 2. ✅ Nouvelle page d'accueil

**Fichiers créés/modifiés:**
- `src/app/page.tsx` - Point d'entrée simplifié
- `src/components/HomePage.tsx` - Nouvelle page d'accueil complète

**Fonctionnalités:**
- ✅ Hero section avec titre clair
- ✅ Sous-titre explicatif
- ✅ Boutons CTA "Que faire aujourd'hui ?" et "Que faire ce week-end ?"
- ✅ Lien "Voir sur la carte"
- ✅ État local `mode` = "today" | "weekend"
- ✅ Liste dynamique d'événements
- ✅ Cartes d'événements simples avec:
  - Image
  - Titre
  - Date et heure formatées
  - Lieu
  - Tags
  - Prix
  - Bouton favori
  - Bouton "Voir l'événement"
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Message si aucun événement

**Design:**
- Fond dégradé sombre (slate-900 → slate-800)
- Cartes avec glassmorphism (backdrop-blur)
- Animations subtiles
- UX claire et intuitive

## 🧪 Comment tester

### 1. Démarrer le serveur de développement

```bash
npm run dev
```

### 2. Accéder à la page d'accueil

Ouvrir: `http://localhost:3000`

### 3. Tester les fonctionnalités

**Test du mode "Aujourd'hui":**
1. Cliquer sur "Que faire aujourd'hui ?"
2. Vérifier que seuls les événements d'aujourd'hui s'affichent
3. Vérifier le format de date/heure

**Test du mode "Ce week-end":**
1. Cliquer sur "Que faire ce week-end ?"
2. Vérifier que seuls les événements du week-end s'affichent
3. Vérifier que le week-end est correctement calculé (vendredi-dimanche)

**Test des interactions:**
1. Cliquer sur le bouton favori (cœur) - doit changer de couleur
2. Cliquer sur "Voir l'événement" - doit rediriger vers la page détail
3. Cliquer sur "Voir sur la carte" - doit rediriger vers `/carte`

**Test de l'API directement:**

```bash
# Événements d'aujourd'hui
curl "http://localhost:3000/api/events?scope=today"

# Événements du week-end
curl "http://localhost:3000/api/events?scope=weekend"

# Avec tag
curl "http://localhost:3000/api/events?scope=today&tag=musique"
```

## 📝 Notes techniques

### Timezone Montréal
La logique temporelle utilise le timezone `America/Montreal` pour:
- Calculer le début/fin de journée
- Calculer le week-end (vendredi-dimanche)
- Formater les dates affichées

### Performance
- Cache React Query: 2 minutes
- Pagination: 50 événements par défaut
- Images lazy-loaded

### Compatibilité
- ✅ Responsive (mobile, tablette, desktop)
- ✅ Accessible (contraste, labels)
- ✅ SEO-friendly (meta tags, structure)

## 🚀 Prochaines étapes (SPRINT 2)

1. POST /api/events/[id]/favorite
2. GET /api/me/favorites
3. Page /favoris
4. UX favoris améliorée

## 📚 Références

- Document de contexte: `pulse_cursor_context_full.pdf`
- Schéma Prisma: `prisma/schema.prisma`
- Types TypeScript: `src/types/index.ts`












