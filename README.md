# Pulse - Plateforme d'événements à Montréal

Une application web moderne pour découvrir et organiser des événements culturels, sportifs et festifs à Montréal.

## 🎯 Fonctionnalités

### 🏠 **Page d'accueil**
- Liste des événements avec filtres avancés
- Vue grille et liste
- Recherche en temps réel
- Filtres par catégorie, date, prix, localisation
- Détection automatique de la position GPS

### 🗺️ **Carte interactive**
- Carte Leaflet avec marqueurs d'événements
- Filtrage géographique
- Calcul de distance et rayon de recherche
- Vue satellite et plan

### 📅 **Calendrier**
- Vue mensuelle des événements
- Navigation entre les mois
- Filtrage par date
- Affichage des événements par jour

### ❤️ **Mes Favoris**
- Gestion des événements favoris
- Filtrage et tri des favoris
- Partage d'événements
- Export au format ICS

### ✨ **Publier un événement**
- Formulaire complet de création
- Validation des données
- Upload d'images
- Gestion des catégories et sous-catégories

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 15, React 19
- **Styling** : Tailwind CSS 4
- **Typographie** : Poppins (Google Fonts)
- **Cartographie** : Leaflet.js avec React-Leaflet
- **Formulaires** : React Hook Form avec Zod
- **Icônes** : Lucide React
- **Dates** : date-fns
- **Base de données** : PostgreSQL via Supabase
- **Déploiement** : Vercel (recommandé)

## 🎨 Palette de couleurs

L'application utilise une palette de couleurs personnalisée et moderne :

- **Primaire** : `#1abc9c` (Vert-bleu)
- **Secondaire** : `#2ecc71` (Vert)
- **Accent** : `#3498db` (Bleu)
- **Violet** : `#9b59b6`
- **Foncé** : `#34495e` (Bleu foncé)
- **Gris** : `#95a5a6`
- **Clair** : `#ecf0f1` (Blanc cassé)
- **Danger** : `#e74c3c` (Rouge)
- **Warning** : `#e67e22` (Orange)
- **Success** : `#f1c40f` (Jaune)

## 🗄️ Base de données

### Structure Supabase
- **Tables principales** : `users`, `events`, `categories`, `sub_categories`
- **Relations** : `favorites`, `user_preferences`, `notifications`
- **Extensions** : `postgis` pour la géolocalisation
- **Sécurité** : RLS (Row Level Security) activé
- **Données d'exemple** : Catégories et sous-catégories pré-remplies

### Schéma principal
```sql
-- Tables principales
events (id, title, description, dates, location, category, price, etc.)
categories (id, name, icon, color)
sub_categories (id, name, category_id)
users (id, email, name, role)
favorites (user_id, event_id)
```

## 🧩 Composants principaux

### Composants de base
- `Navigation` - Barre de navigation avec logo Pulse
- `EventCard` - Carte d'événement avec actions
- `EventFilters` - Filtres avancés avec géolocalisation
- `EventMap` - Carte interactive Leaflet

### Composants avancés
- `SearchBar` - Recherche intelligente avec suggestions
- `EventStats` - Statistiques et insights
- `Pagination` - Navigation entre pages
- `EventSort` - Tri des événements
- `Notification` - Système de notifications

## 📱 Pages

1. **Accueil** (`/`) - Liste des événements avec filtres
2. **Carte** (`/carte`) - Vue cartographique
3. **Calendrier** (`/calendrier`) - Vue calendaire
4. **Favoris** (`/favoris`) - Gestion des favoris
5. **Publier** (`/publier`) - Création d'événements

## 🎨 Personnalisation

### Thème
- Police Poppins pour tous les textes
- Palette de couleurs cohérente
- Composants réutilisables et personnalisables
- Design responsive et moderne

### Composants personnalisables
- Classes CSS utilitaires pour les couleurs
- Composants avec props configurables
- Système de badges et boutons cohérent
- Animations et transitions fluides

## 🚀 Fonctionnalités avancées

### Système de recherche
- Recherche en temps réel
- Suggestions intelligentes
- Historique des recherches
- Recherche par tags et catégories

### Géolocalisation
- Détection automatique de la position
- Calcul de distance et rayon
- Filtrage géographique
- Marqueurs de position utilisateur

### Accessibilité
- Support des lecteurs d'écran
- Navigation au clavier
- Contraste élevé
- Textes alternatifs

## 📋 Roadmap

### Phase 1 ✅ (Terminée)
- [x] Structure de base Next.js
- [x] Composants principaux
- [x] Pages de base
- [x] Palette de couleurs
- [x] Police Poppins
- [x] Logo Pulse

### Phase 2 🔄 (En cours)
- [ ] Intégration Supabase
- [ ] Authentification utilisateur
- [ ] CRUD événements
- [ ] Système de favoris

### Phase 3 📅 (Prévue)
- [ ] Notifications push
- [ ] Application mobile PWA
- [ ] API publique
- [ ] Analytics et métriques

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd montreal-events
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Supabase**
   - Créer un projet Supabase
   - Exécuter `database/schema.sql`
   - Configurer les variables d'environnement

4. **Lancer en développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir l'application**
   - Naviguer vers `http://localhost:3000`
   - L'application Pulse devrait s'afficher avec votre logo

## 🔧 Configuration

### Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Base de données
- Exécuter le script `database/schema.sql` dans Supabase
- Vérifier que les extensions `postgis` et `uuid-ossp` sont activées

## 🐛 Problèmes connus

- **Port 3000 occupé** : L'application utilise automatiquement le port suivant disponible
- **Images** : Utilisation d'images d'exemple depuis Unsplash
- **Données** : Données mockées pour le développement frontend

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **Next.js** pour le framework React
- **Tailwind CSS** pour le système de design
- **Supabase** pour la base de données
- **Leaflet** pour la cartographie
- **Poppins** pour la typographie
- **Lucide** pour les icônes

---

**Pulse** - Découvrez le rythme des événements montréalais ! 🎉
