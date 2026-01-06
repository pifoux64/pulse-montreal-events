# 📄 Pulse Montréal - Document de Présentation pour Business Plan

**Version** : 1.0  
**Date** : Janvier 2025  
**Domaine** : https://pulse-event.ca

---

## 🎯 1. Présentation de Pulse Montréal

### 1.1 Qu'est-ce que Pulse ?

**Pulse Montréal** est une plateforme web moderne et intelligente dédiée à la découverte et à la promotion d'événements culturels, musicaux, sportifs et festifs à Montréal. Pulse combine une interface utilisateur intuitive, une technologie d'intelligence artificielle pour la classification automatique, et un système de recommandations personnalisées basé sur les goûts musicaux des utilisateurs.

### 1.2 Vision

Transformer la façon dont les Montréalais découvrent et partagent les événements qui les passionnent, en créant une expérience personnalisée et engageante qui connecte les organisateurs d'événements avec leur public cible.

### 1.3 Valeur Proposée

**Pour les utilisateurs :**
- Découverte intelligente d'événements adaptés à leurs goûts musicaux
- Recommandations personnalisées basées sur l'analyse de leur historique d'écoute (Spotify, Apple Music)
- Interface moderne et intuitive avec filtres avancés
- Notifications ciblées pour ne jamais manquer un événement qui les intéresse
- Partage facile avec leurs amis et leur réseau

**Pour les organisateurs :**
- Publication gratuite et illimitée d'événements
- Classification automatique par IA pour une meilleure visibilité
- Système de promotion pour mettre en avant leurs événements
- Publication multi-plateformes (Facebook, Eventbrite, Resident Advisor, Bandsintown) depuis une seule interface
- Statistiques détaillées sur les performances de leurs événements (plan PRO)
- Profil organisateur personnalisable avec badge "Vérifié"

---

## 🚀 2. Fonctionnalités Principales

### 2.1 Découverte d'Événements

#### Page d'Accueil
- **Liste d'événements** avec vue grille et vue liste
- **Filtres avancés** :
  - Par catégorie (Musique, Culture, Sport, Famille)
  - Par genre musical (Reggae, Hip-Hop, Techno, Jazz, etc.)
  - Par type d'événement (Concert, DJ Set, Festival, etc.)
  - Par ambiance (Salle de concert, Warehouse, Extérieur, etc.)
  - Par public (18+, 21+, Tous publics)
  - Par prix (Gratuit, Payant, Tous)
  - Par localisation (GPS automatique + rayon de recherche)
  - Par date (Aujourd'hui, Ce week-end, Cette semaine)
- **Recherche en temps réel** avec suggestions intelligentes
- **Sections "Trending"** : Top événements du jour et du week-end
- **Détection automatique de la position GPS** pour des résultats géolocalisés

#### Carte Interactive
- **Carte Leaflet** avec marqueurs d'événements
- **Filtrage géographique** avec calcul de distance
- **Rayon de recherche** personnalisable
- **Vue satellite et plan** interchangeables
- **Clustering** des marqueurs pour une meilleure lisibilité

#### Calendrier
- **Vue mensuelle** des événements
- **Navigation entre les mois** fluide
- **Affichage des événements par jour**
- **Filtrage par date** et catégorie

### 2.2 Recommandations Personnalisées

#### Connexion Musicale
- **Intégration Spotify** : Connexion OAuth pour analyser l'historique d'écoute
- **Intégration Apple Music** : Connexion OAuth (en développement)
- **Synchronisation automatique** des goûts musicaux toutes les 24h
- **Détection automatique** des genres et styles musicaux préférés

#### Page "Pour toi"
- **Recommandations ultra-personnalisées** basées sur :
  - Analyse de l'historique d'écoute Spotify/Apple Music (40%)
  - Préférences manuelles renseignées (30%)
  - Historique d'interactions (favoris, vues) (20%)
  - Popularité des événements (10%)
- **Explications** : "Recommandé car vous aimez le reggae"
- **Badges** : "Basé sur Spotify" / "Basé sur vos préférences"

#### Notifications Personnalisées
- **Alertes ciblées** pour nouveaux événements correspondant aux goûts
- **Rappels** 24h et 1h avant les événements favoris
- **Notifications push** et email

### 2.3 Gestion des Favoris

- **Sauvegarde d'événements** en favoris
- **Page dédiée** avec filtres et tri
- **Export au format ICS** pour calendrier (Google Calendar, Apple Calendar, Outlook)
- **Partage d'événements** avec deep links (WhatsApp, Messenger, SMS)
- **Animations et feedback visuel** lors de l'ajout

### 2.4 Pulse Picks (Contenu Éditorial)

#### Top 5 Hebdomadaires
- **Sélections éditoriales** par thème (genre musical, catégorie, etc.)
- **Génération automatique** par IA avec validation humaine
- **Pages publiques partageables** avec images OG dynamiques
- **Workflow éditorial** : Brouillon → Review → Publication → Archive
- **Bouton "Sauvegarder les 5"** pour ajouter tous les événements en favoris

#### Pages Publiques
- **`/ce-soir`** : Événements de ce soir (partageable)
- **`/ce-weekend`** : Événements du week-end (partageable)
- **`/picks`** : Liste de tous les Pulse Picks publiés
- **`/top-5/[slug]`** : Détail d'un Top 5 avec CTAs

### 2.5 Publication d'Événements

#### Formulaire de Création
- **Champs complets** : Titre, description, dates, lieu, prix, images
- **Classification IA automatique** : Tags structurés (type, genre, ambiance, public)
- **Champs avancés** : Lineup (artistes), description longue
- **Upload d'images** multiples
- **Gestion des catégories et sous-catégories**

#### Publication Multi-Plateformes
- **"Publier partout"** : Publication simultanée sur :
  - Facebook Events (via Graph API)
  - Eventbrite (via API OAuth)
  - Resident Advisor (export fichier)
  - Bandsintown (via API)
- **Connexions OAuth** pour Facebook et Eventbrite
- **Synchronisation automatique** des modifications
- **Logs de publication** avec statuts

### 2.6 Dashboard Organisateur

#### Fonctionnalités de Base (Gratuit)
- **Création d'événements illimitée**
- **Profil organisateur personnalisable**
- **Statistiques de base** : Vues, favoris
- **1 promotion active** à la fois
- **Promotions en brouillon illimitées**

#### Fonctionnalités PRO (29$ CAD/mois)
- **Tout du plan BASIC**
- **Statistiques détaillées** : Vues, clics, conversions
- **Import ICS en masse** pour plusieurs événements
- **Promotions actives illimitées**
- **Support prioritaire**
- **Badge "Vérifié"** sur le profil
- **Publication multi-plateformes** (à venir)

### 2.7 Système de Promotions

- **Types de promotions** :
  - Mise en avant sur la page d'accueil
  - Top de liste dans les résultats
  - Top de carte (marqueur en avant)
- **Gestion des promotions** : Création, activation, désactivation
- **Prix** : Dépend de la durée et du type
- **Plan BASIC** : 1 promotion active, brouillons illimités
- **Plan PRO** : Promotions actives illimitées

### 2.8 Partage Social et Viralité

#### Partage d'Événements
- **Modal de partage** avec deep links (WhatsApp, Messenger, SMS)
- **Web Share API** avec fallback
- **URLs avec UTM parameters** pour tracking
- **Images OG dynamiques** pour chaque événement

#### Partage de Top 5
- **Modal de partage** pour les Pulse Picks
- **Prompt "Send this list to someone"** après vue depuis lien partagé
- **Tracking des landing views** depuis liens partagés

#### Social Proof
- **Badge "Trending"** pour événements populaires
- **Compteur "{X} saves today"** sur les EventCards
- **Moteur de trending** basé sur favoris, vues et recency

### 2.9 Notifications

#### Types de Notifications
- **Push notifications** (Web Push API)
- **Email notifications** (Resend)
- **Rappels** : 24h et 1h avant événements favoris
- **Notifications personnalisées** : Nouveaux événements correspondant aux goûts
- **Notifications organisateur** : Nouvelles interactions, statistiques

#### Préférences Utilisateur
- **Page de paramètres** pour gérer les préférences
- **Choix des types** de notifications à recevoir
- **Choix des genres/styles** pour notifications personnalisées

### 2.10 Système de Tags Structurés

#### Taxonomie Complète
- **Genres musicaux** : Reggae, Hip-Hop, Techno, Jazz, Rock, etc. (30+ genres)
- **Types d'événements** : Concert, DJ Set, Festival, Soirée, etc.
- **Ambiances** : Salle de concert, Warehouse, Extérieur, Intimate, etc.
- **Publics** : 18+, 21+, Tous publics, Famille

#### Classification IA
- **Analyse automatique** de la description, titre, et métadonnées
- **Attribution de tags** structurés pour chaque événement
- **78% des événements** ont des tags IA structurés
- **Amélioration continue** de la précision

---

## 🛠️ 3. Technologies et Architecture

### 3.1 Stack Technique

#### Frontend
- **Next.js 15** : Framework React avec Server Components
- **React 19** : Bibliothèque UI moderne
- **TypeScript** : Typage statique pour la robustesse
- **Tailwind CSS 4** : Framework CSS utilitaire
- **Lucide React** : Bibliothèque d'icônes
- **date-fns** : Manipulation de dates

#### Backend
- **Next.js API Routes** : API REST intégrée
- **Prisma ORM** : Gestion de base de données
- **PostgreSQL** : Base de données relationnelle (via Supabase)
- **NextAuth.js** : Authentification (OAuth Google, Email magic links)

#### Services Externes
- **Supabase** : Base de données PostgreSQL + authentification
- **Vercel** : Hébergement et déploiement
- **Resend** : Service d'envoi d'emails
- **Stripe** : Paiements (intégration prévue)
- **Spotify API** : Analyse des goûts musicaux
- **Apple Music API** : Analyse des goûts musicaux (en développement)

#### Cartographie
- **Leaflet.js** : Bibliothèque de cartes open-source
- **React-Leaflet** : Composants React pour Leaflet

#### Intelligence Artificielle
- **OpenAI API** : Classification automatique des événements
- **Taxonomie contrôlée** : Mapping des genres/styles musicaux

### 3.2 Architecture

#### Ingestion d'Événements
- **Connecteurs** : Ticketmaster, Meetup, Open Data Montréal
- **Orchestrateur** : Coordination de tous les connecteurs
- **Déduplication** : Éviter les doublons
- **Enrichissement IA** : Classification automatique
- **CRON jobs** : Ingestion automatique toutes les 2h

#### Système de Recommandations
- **User Profile Builder** : Construction du profil utilisateur
- **Recommendation Engine** : Calcul de scores de pertinence
- **Scoring algorithm** : 40% genre, 30% style, 20% historique, 10% popularité

#### Système de Partage
- **Share Utils** : Génération de deep links et URLs
- **Analytics Tracking** : Suivi des partages et landing views
- **OG Image Generation** : Images dynamiques pour réseaux sociaux

### 3.3 Sécurité et Performance

#### Sécurité
- **Row Level Security (RLS)** : Sécurité au niveau des lignes (Supabase)
- **Authentification OAuth** : Google, Spotify, Apple Music
- **Validation Zod** : Validation des données API
- **HTTPS** : Chiffrement des communications
- **Tokens sécurisés** : Stockage chiffré des tokens OAuth

#### Performance
- **Server Components** : Rendu côté serveur pour performance
- **Caching** : Cache des recommandations et trending (TTL 5 min)
- **Images optimisées** : Next.js Image component
- **Code splitting** : Chargement à la demande
- **Edge Functions** : Génération d'images OG en runtime edge

---

## 💰 4. Modèle Économique

### 4.1 Plans Tarifaires

#### Plan BASIC (Gratuit)
- ✅ Création d'événements illimitée
- ✅ Profil organisateur personnalisable
- ✅ Statistiques de base (vues, favoris)
- ✅ Classification IA automatique
- ✅ 1 promotion active à la fois
- ✅ Promotions en brouillon illimitées
- ✅ Apparition sur carte et calendrier
- ❌ Statistiques détaillées
- ❌ Import ICS en masse
- ❌ Promotions actives illimitées

#### Plan PRO (29$ CAD/mois)
- ✅ Tout du plan BASIC
- ✅ Statistiques détaillées (vues, clics, conversions)
- ✅ Import ICS en masse
- ✅ Promotions actives illimitées
- ✅ Support prioritaire
- ✅ Badge "Vérifié" sur le profil
- ✅ Publication multi-plateformes (à venir)

### 4.2 Sources de Revenus

#### 1. Abonnements PRO
- **Prix** : 29$ CAD/mois par organisateur
- **Cible** : Organisateurs d'événements réguliers
- **Projection** : 100 organisateurs PRO = 2 900$ CAD/mois

#### 2. Promotions d'Événements
- **Prix** : Variable selon durée et type
- **Types** :
  - Mise en avant page d'accueil : 10-50$ CAD
  - Top de liste : 5-30$ CAD
  - Top de carte : 5-30$ CAD
- **Cible** : Organisateurs souhaitant augmenter la visibilité

#### 3. Notifications Payantes (À venir)
- **Prix** : Par notification envoyée
- **Cible** : Organisateurs souhaitant notifier leur audience

#### 4. Boosts d'Événements (À venir)
- **Prix** : Variable selon durée
- **Cible** : Organisateurs souhaitant mettre en avant un événement spécifique

### 4.3 Projections Financières

#### Année 1 (Objectifs)
- **Organisateurs PRO** : 50-100
- **Revenus mensuels** : 1 450$ - 2 900$ CAD
- **Revenus annuels** : 17 400$ - 34 800$ CAD
- **Promotions** : 20-50/mois × 20$ = 400$ - 1 000$ CAD/mois

#### Année 2 (Croissance)
- **Organisateurs PRO** : 200-500
- **Revenus mensuels** : 5 800$ - 14 500$ CAD
- **Revenus annuels** : 69 600$ - 174 000$ CAD

---

## 📊 5. État Actuel du Projet

### 5.1 Fonctionnalités Implémentées ✅

#### Sprint 1 : Ingestion Légale et Stable ✅
- Sources d'ingestion légales (Ticketmaster, Meetup, Open Data Montréal)
- 474+ événements futurs ingérés
- Dashboard admin pour monitoring
- Orchestrateur stable avec gestion d'erreurs

#### Sprint 2 : Classification IA & Tagging Intelligent ✅
- Taxonomie complète (genres, types, ambiances, publics)
- Classification IA automatique (78% des événements taggés)
- Filtres avancés sur toutes les pages
- Affichage des tags dans EventCard et EventPage

#### Sprint 3 : Notifications & Favoris Avancés ✅
- Web Push notifications
- Email notifications (Resend)
- Préférences utilisateur
- Favoris avec animations et export ICS

#### Sprint 4 : Publish Once → Publish Everywhere ✅
- Publication multi-plateformes (Facebook, Eventbrite, RA, Bandsintown)
- Connexions OAuth
- Page d'intégrations organisateur
- Synchronisation automatique

#### Sprint V1-V3 : Viral Mechanics ✅
- Système de partage complet
- Pages publiques partageables (`/ce-soir`, `/ce-weekend`)
- Moteur de trending
- Pulse Picks (Top 5) avec workflow éditorial
- Images OG dynamiques

#### Sprint 6 : Recommandations Personnalisées (85% complété) 🔄
- ✅ Connexion Spotify OAuth
- ✅ Analyse des goûts musicaux
- ✅ Page profil avec préférences
- ✅ Moteur de recommandations
- ✅ Page "Pour toi"
- ✅ Notifications personnalisées
- ❌ Connexion Apple Music (en attente)

### 5.2 Fonctionnalités en Attente ⏸️

#### Sprint 5 : Monétisation
- Intégration Stripe complète
- Système de boosts d'événements
- Notifications payantes
- Dashboard PRO avec statistiques détaillées

### 5.3 Métriques Actuelles

- **Événements ingérés** : 474+ événements futurs
- **Sources actives** : 3 (Ticketmaster, Meetup, Open Data Montréal)
- **Tags IA** : 78% des événements ont des tags structurés
- **Performance** : Core Web Vitals optimisés
- **Disponibilité** : 99.9% (Vercel)

---

## 🎯 6. Différenciation et Avantages Concurrentiels

### 6.1 Recommandations Basées sur l'Écoute Réelle
- **Unique au marché** : Analyse automatique de l'historique Spotify/Apple Music
- **Précision** : Recommandations ultra-pertinentes basées sur les goûts réels
- **Expérience** : Découverte d'événements que l'utilisateur n'aurait pas trouvés autrement

### 6.2 Classification IA Automatique
- **Efficacité** : Pas besoin de catégoriser manuellement
- **Précision** : 78% des événements correctement taggés
- **Taxonomie structurée** : Filtres avancés cohérents

### 6.3 Publication Multi-Plateformes
- **Gain de temps** : Publier une fois, diffuser partout
- **Synchronisation** : Modifications automatiquement propagées
- **Intégrations** : Facebook, Eventbrite, Resident Advisor, Bandsintown

### 6.4 Contenu Éditorial (Pulse Picks)
- **Valeur ajoutée** : Sélections hebdomadaires par thème
- **Partageabilité** : Pages publiques optimisées pour le partage
- **Engagement** : Contenu qui génère du trafic organique

### 6.5 Interface Moderne et Intuitive
- **Design** : Interface moderne avec glassmorphism
- **Responsive** : Optimisé mobile, tablette, desktop
- **Performance** : Chargement rapide, animations fluides

---

## 🚀 7. Roadmap et Perspectives

### 7.1 Court Terme (3-6 mois)

#### Finalisation Sprint 6
- Connexion Apple Music OAuth
- Amélioration du moteur de recommandations
- Analytics dashboard pour visualiser les métriques

#### Améliorations UX
- Badge compteur favoris dans la navigation
- Suggestions basées sur favoris
- Amélioration de la page favoris

#### Notifications Push
- Finalisation des notifications push fonctionnelles
- Amélioration de la fiabilité

### 7.2 Moyen Terme (6-12 mois)

#### Sprint 5 : Monétisation
- Intégration Stripe complète
- Système de boosts d'événements
- Notifications payantes
- Dashboard PRO avec statistiques détaillées

#### Expansion
- Ajout de nouvelles sources d'ingestion
- Expansion à d'autres villes (Québec, Toronto)
- Application mobile native (iOS/Android)

#### Fonctionnalités Sociales
- Feed d'activité des utilisateurs
- Groupes par intérêts musicaux
- Programme d'affiliation

### 7.3 Long Terme (12-24 mois)

#### Internationalisation
- Expansion à d'autres villes canadiennes
- Support multi-langues (anglais, français)
- Adaptation aux spécificités locales

#### Intelligence Artificielle Avancée
- Prédiction de popularité des événements
- Recommandations basées sur le comportement
- Analyse de sentiment des commentaires

#### Partenariats
- Partenariats avec des festivals majeurs
- Intégrations avec des plateformes de billetterie
- Programme pour influenceurs

---

## 📈 8. Métriques de Succès

### 8.1 Métriques Utilisateurs
- **Utilisateurs actifs mensuels (MAU)** : Objectif 10 000 en année 1
- **Taux de rétention** : 40% retour mensuel
- **Temps moyen sur site** : 5+ minutes
- **Taux de conversion** : 5% visiteurs → utilisateurs inscrits

### 8.2 Métriques Organisateurs
- **Organisateurs actifs** : 200+ en année 1
- **Organisateurs PRO** : 50-100 en année 1
- **Taux de conversion BASIC → PRO** : 10-15%
- **Événements publiés/mois** : 500+

### 8.3 Métriques Engagement
- **Favoris ajoutés** : 1 000+/mois
- **Partages d'événements** : 500+/mois
- **Connexions Spotify** : 20% des utilisateurs
- **Notifications ouvertes** : 30% taux d'ouverture

### 8.4 Métriques Business
- **Revenus mensuels récurrents (MRR)** : 2 900$ CAD (100 PRO)
- **Revenus promotions** : 1 000$ CAD/mois
- **Taux de churn** : <5% mensuel
- **LTV (Lifetime Value)** : 348$ CAD (12 mois × 29$)

---

## 🎨 9. Design et Expérience Utilisateur

### 9.1 Identité Visuelle
- **Logo** : Cœur rouge avec texte "Pulse"
- **Palette de couleurs** :
  - Primaire : Vert-bleu (#1abc9c)
  - Secondaire : Vert (#2ecc71)
  - Accent : Bleu (#3498db)
  - Fond : Slate-950 (noir/gris foncé)
- **Typographie** : Poppins (Google Fonts)
- **Style** : Glassmorphism moderne avec backdrop blur

### 9.2 Expérience Utilisateur
- **Navigation intuitive** : Menu clair et accessible
- **Recherche rapide** : Barre de recherche avec suggestions
- **Filtres avancés** : Faciles à utiliser, visuellement clairs
- **Feedback visuel** : Animations et transitions fluides
- **Responsive** : Optimisé pour tous les appareils

### 9.3 Accessibilité
- **Support lecteurs d'écran** : ARIA labels
- **Navigation au clavier** : Tous les éléments accessibles
- **Contraste élevé** : Respect des standards WCAG
- **Textes alternatifs** : Images avec descriptions

---

## 🔒 10. Conformité et Légalité

### 10.1 Protection des Données
- **RGPD** : Conformité avec le règlement général sur la protection des données
- **Politique de confidentialité** : Transparente et accessible
- **Consentement utilisateur** : Opt-in pour toutes les données sensibles
- **Droit à l'oubli** : Possibilité de supprimer son compte et ses données

### 10.2 Conditions d'Utilisation
- **CGU** : Conditions générales d'utilisation claires
- **Mentions légales** : Informations légales complètes
- **Propriété intellectuelle** : Respect des droits d'auteur

### 10.3 Sources Légales
- **Ingestion légale** : Uniquement via APIs officielles
- **Pas de scraping** : Respect des conditions d'utilisation des plateformes
- **Attribution** : Crédits aux sources d'événements

---

## 📞 11. Contact et Support

### 11.1 Informations de Contact
- **Site web** : https://pulse-event.ca
- **Email** : hello@pulse-event.ca (à configurer)
- **Support** : Via formulaire de contact sur le site

### 11.2 Support Utilisateurs
- **Documentation** : Guides et FAQ sur le site
- **Support email** : Réponse sous 24-48h
- **Support PRO** : Prioritaire pour les organisateurs PRO

---

## 📝 12. Conclusion

Pulse Montréal est une plateforme innovante qui transforme la découverte d'événements à Montréal en combinant intelligence artificielle, recommandations personnalisées et une expérience utilisateur exceptionnelle. Avec un modèle économique clair, des fonctionnalités différenciantes et une roadmap ambitieuse, Pulse est positionné pour devenir la référence en matière de découverte d'événements à Montréal.

**Points Clés à Retenir :**
- ✅ Plateforme fonctionnelle et déployée en production
- ✅ Recommandations personnalisées basées sur l'écoute réelle (unique au marché)
- ✅ Classification IA automatique pour une meilleure découverte
- ✅ Publication multi-plateformes pour les organisateurs
- ✅ Modèle économique clair avec plans BASIC (gratuit) et PRO (29$ CAD/mois)
- ✅ Roadmap ambitieuse avec expansion prévue

---

**Document créé le** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025  
**Version** : 1.0

