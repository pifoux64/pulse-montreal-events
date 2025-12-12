# 📊 Statut des Sources d'Ingestion - Pulse Montreal

## ✅ Sources Fonctionnelles

### Ticketmaster ⭐
- **Statut** : ✅ Actif et fonctionnel
- **Événements** : ~204 événements importés
- **Configuration** : Nécessite `TICKETMASTER_API_KEY` dans les variables d'environnement
- **Note** : Source principale, fonctionne parfaitement

### Tourisme Montréal
- **Statut** : ✅ Activé (mais données mockées)
- **Événements** : ~6 événements (données hardcodées)
- **Limitation** : Utilise des événements de démonstration hardcodés, pas de vrai scraper
- **Action** : Fonctionne mais avec des données limitées

---

## ⚠️ Sources avec Limitations

### Eventbrite
- **Statut** : ❌ Limitation API majeure
- **Problème** : L'API Eventbrite v3 ne permet **PAS** de rechercher des événements publics par localisation
- **Détail** : L'API est conçue uniquement pour gérer vos propres événements, pas pour chercher des événements publics
- **Résultat** : Retourne toujours un tableau vide (0 événements)
- **Solution** : 
  - Contacter le support Eventbrite pour obtenir l'accès à l'API de recherche publique
  - Utiliser d'autres sources (Ticketmaster, Meetup, etc.)
- **Référence** : `docs/EVENTBRITE_SETUP.md`

---

## 🔴 Sources Désactivées

Les sources suivantes sont désactivées dans l'orchestrateur (`enabled: false`) :

### Meetup
- **Statut** : 🔴 Désactivé (Payant)
- **Raison** : Nécessite un abonnement **Meetup Pro** (55$ USD/mois minimum)
- **Coût** : 55$ USD/mois par groupe
- **Activation** : Souscrire à Meetup Pro + définir `MEETUP_TOKEN`
- **Note** : L'accès API est révoqué si l'abonnement expire

### LaVitrine
- **Statut** : 🔴 Désactivé
- **Raison** : Événements de démo uniquement (données mockées)
- **Note** : Connecteur existe mais utilise des données hardcodées

### AllEvents
- **Statut** : 🔴 Désactivé
- **Raison** : Événements de démo uniquement (données mockées)
- **Note** : Connecteur existe mais utilise des données hardcodées

### Open Data Montréal
- **Statut** : ⚠️ Prêt mais nécessite configuration
- **Configuration** : Nécessite `OPEN_DATA_MONTREAL_URL` dans les variables d'environnement
- **Note** : Connecteur implémenté, mais nécessite d'identifier un dataset d'événements sur donnees.montreal.ca
- **Référence** : `docs/OPEN_DATA_MONTREAL_SETUP.md`

### Quartier Spectacles
- **Statut** : 🔴 Désactivé
- **Raison** : Événements de test uniquement, pas de vrai scraper
- **Note** : Connecteur existe mais limité

---

## 📝 Résumé

| Source | Statut | Événements | Limitation |
|--------|--------|------------|------------|
| **Ticketmaster** | ✅ Actif | ~204 | Aucune |
| **Tourisme Montréal** | ✅ Actif | ~6 | Données mockées |
| **Eventbrite** | ⚠️ Limité | 0 | API ne permet pas recherche publique |
| **Meetup** | 🔴 Désactivé (Payant) | 0 | Nécessite Meetup Pro (55$ USD/mois) |
| **LaVitrine** | 🔴 Désactivé | 0 | Données mockées uniquement |
| **AllEvents** | 🔴 Désactivé | 0 | Données mockées uniquement |
| **Quartier Spectacles** | 🔴 Désactivé | 0 | Pas de vrai scraper |

---

## 🔧 Actions Recommandées

### Pour activer plus de sources :

1. **Meetup** : ⚠️ **Payant** - Souscrire à Meetup Pro (55$ USD/mois) + définir `MEETUP_TOKEN`
2. **LaVitrine / AllEvents** : Activer si vous voulez des données de démo (hardcodées)
3. **Eventbrite** : Contacter le support Eventbrite pour l'API de recherche publique
4. **Open Data Montréal** : Explorer le catalogue gratuit (https://donnees.montreal.ca/)
5. **Quartier des Spectacles** : Contacter pour un accès API/RSS gratuit
6. **Tourisme Montréal** : Contacter pour un accès API gratuit

### Pour améliorer les sources existantes :

1. **Tourisme Montréal** : Implémenter un vrai scraper pour remplacer les données mockées
2. **Quartier Spectacles** : Implémenter un vrai scraper

---

## 📌 Conclusion

**Ticketmaster est la seule source vraiment fonctionnelle et GRATUITE avec de vraies données.**

Les autres sources ont soit :
- Des limitations d'API (Eventbrite)
- Des coûts payants (Meetup - 55$ USD/mois)
- Des données mockées (Tourisme Montréal, LaVitrine, AllEvents)
- Sont désactivées

**Pour avoir plus d'événements GRATUITEMENT, il faut :**
1. ✅ Ticketmaster (déjà actif - gratuit)
2. 🔍 Explorer Open Data Montréal (gratuit)
3. 📧 Contacter les organismes publics (Quartier des Spectacles, Tourisme Montréal) pour des accès API gratuits
4. 📧 Contacter Eventbrite pour l'API de recherche publique

**Voir `docs/SOURCES_GRATUITES.md` pour toutes les options gratuites disponibles.**



