# ✅ Sources Légales et Durables pour Récupérer des Événements

Ce document liste toutes les sources **légales et durables** pour récupérer des événements à Montréal, sans scraping.

## 🎯 Principes

- ✅ **APIs officielles** : Utilisation d'APIs documentées et autorisées
- ✅ **Flux RSS** : Flux RSS publics et autorisés
- ✅ **Open Data** : Données ouvertes des institutions publiques
- ✅ **Partenariats** : Accords officiels avec les plateformes
- ❌ **Pas de scraping** : Le scraping HTML est illégal et non durable

---

## 🎫 Sources Actuellement Fonctionnelles

### 1. Ticketmaster Discovery API ⭐ (GRATUIT)

**Statut** : ✅ **Fonctionnel et actif - GRATUIT**

- **API officielle** : https://developer.ticketmaster.com/
- **Événements** : ~204 événements importés
- **Limite** : 5000 requêtes/jour (gratuit)
- **Coût** : **GRATUIT** ✅
- **Configuration** : Nécessite `TICKETMASTER_API_KEY`
- **Documentation** : https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

**Avantages** :
- API officielle et documentée
- **GRATUIT** ✅
- Grande quantité d'événements
- Données structurées et fiables
- Support officiel

---

## 🔧 Sources à Activer

### 2. Meetup API

**Statut** : ⚠️ **Payant - Nécessite Meetup Pro (55$ USD/mois minimum)**

- **API officielle** : https://www.meetup.com/api/
- **Type** : GraphQL API
- **Coût** : **55$ USD/mois par groupe** (abonnement Meetup Pro requis)
- **Configuration** : Nécessite `MEETUP_TOKEN` + abonnement Pro
- **Documentation** : https://www.meetup.com/api/guide/

**⚠️ Important** :
- L'accès à l'API nécessite un **abonnement Meetup Pro payant**
- Seuls les membres avec Meetup Pro peuvent créer des consommateurs OAuth
- Si l'abonnement expire, l'accès API est automatiquement révoqué

**Comment obtenir l'accès** :
1. Souscrire à Meetup Pro : https://secure.meetup.com/meetup-pro/ (55$ USD/mois minimum)
2. Créer un consommateur OAuth : https://secure.meetup.com/meetup_api/key/
3. Récupérer la clé API
4. Ajouter `MEETUP_TOKEN=votre_cle` dans `.env.local`

**Avantages** :
- API officielle GraphQL
- Événements communautaires variés
- Données structurées

**Inconvénients** :
- Coût élevé (55$ USD/mois minimum)
- Nécessite un abonnement actif

---

## 📞 Sources Nécessitant un Contact

### 3. Eventbrite

**Statut** : ❌ **Limitation API - Nécessite un contact**

**Problème** :
- L'API Eventbrite v3 ne permet **PAS** de rechercher des événements publics par localisation
- L'API est conçue uniquement pour gérer vos propres événements

**Solution** :
1. **Contacter le support Eventbrite** : support@eventbrite.com
2. **Demander l'accès à l'API Discovery** ou l'API de recherche publique
3. **Expliquer votre projet** : agrégation d'événements pour Montréal

**Contact** :
- Support : support@eventbrite.com
- Documentation : https://www.eventbrite.com/platform/api/
- Forum développeurs : https://www.eventbrite.com/platform/api/

---

### 4. Lepointdevente.com

**Statut** : ❌ **Pas d'API publique - Nécessite un contact**

**Solution** :
1. **Contacter Lepointdevente.com** : https://lepointdevente.com/contact/
2. **Demander un partenariat API** ou un accès aux données
3. **Expliquer votre projet** : agrégation d'événements culturels montréalais

**Options à demander** :
- API officielle pour récupérer les événements
- Flux RSS des événements
- Webhooks pour les nouveaux événements
- Partenariat de données

---

## 🌐 Open Data et Sources Publiques

### 5. Données Ouvertes de Montréal

**Statut** : ⚠️ **À explorer**

- **Site** : https://donnees.montreal.ca/
- **Type** : Open Data
- **Potentiel** : Événements publics, festivals, activités culturelles

**À faire** :
1. Explorer le catalogue de données ouvertes
2. Chercher des jeux de données sur les événements
3. Implémenter un connecteur si des données sont disponibles

**Ressources** :
- Catalogue : https://donnees.montreal.ca/
- API : À vérifier si disponible

---

### 6. Quartier des Spectacles

**Statut** : ⚠️ **À explorer**

- **Site** : https://www.quartierdesspectacles.com/
- **Type** : Organisme public
- **Potentiel** : Événements culturels du Quartier des Spectacles

**À faire** :
1. Contacter le Quartier des Spectacles
2. Demander un accès API ou un flux de données
3. Vérifier s'il y a un flux RSS disponible

**Contact** :
- Site : https://www.quartierdesspectacles.com/
- Email : À trouver sur le site

---

### 7. Tourisme Montréal

**Statut** : ⚠️ **Actuellement avec données mockées**

- **Site** : https://www.mtl.org/
- **Type** : Organisme de tourisme
- **Potentiel** : Événements touristiques et culturels

**À faire** :
1. Contacter Tourisme Montréal
2. Demander un accès API ou un flux de données
3. Remplacer les données mockées par de vraies données

**Contact** :
- Site : https://www.mtl.org/
- Email : À trouver sur le site

---

## 🎵 Sources Spécialisées

### 8. Bandsintown API (Concerts)

**Statut** : ✅ **API disponible**

- **API** : https://www.bandsintown.com/api/overview
- **Type** : API REST
- **Focus** : Concerts et spectacles musicaux
- **Limite** : Variable selon le plan

**Avantages** :
- Spécialisé dans les concerts
- API officielle
- Données de qualité

**Configuration** :
- Nécessite une clé API
- Voir : https://www.bandsintown.com/api/overview

---

### 9. Songkick API (Concerts)

**Statut** : ✅ **API disponible**

- **API** : https://www.songkick.com/developer
- **Type** : API REST
- **Focus** : Concerts et festivals
- **Limite** : Variable selon le plan

**Avantages** :
- Spécialisé dans les concerts
- API officielle
- Données de qualité

**Configuration** :
- Nécessite une clé API
- Voir : https://www.songkick.com/developer

---

## 📋 Plan d'Action Recommandé

### Priorité 1 : Activer les sources gratuites

1. **Ticketmaster** ✅ (Déjà actif - gratuit)
   - Vérifier que `TICKETMASTER_API_KEY` est configuré
   - Source principale fonctionnelle

### Priorité 1.5 : Sources payantes (si budget disponible)

1. **Meetup** 💰 (55$ USD/mois)
   - Évaluer si le budget le permet
   - Souscrire à Meetup Pro si nécessaire
   - Obtenir un token Meetup
   - Ajouter `MEETUP_TOKEN` dans `.env.local`
   - Tester l'ingestion

### Priorité 2 : Contacter les plateformes

2. **Eventbrite** 📧
   - Envoyer un email au support Eventbrite
   - Demander l'accès à l'API Discovery
   - Expliquer le projet

3. **Lepointdevente.com** 📧
   - Contacter via leur site
   - Demander un partenariat API
   - Proposer un partenariat de données

4. **Tourisme Montréal** 📧
   - Contacter pour obtenir un accès API
   - Remplacer les données mockées

5. **Quartier des Spectacles** 📧
   - Contacter pour obtenir un accès API ou RSS
   - Implémenter le connecteur

### Priorité 3 : Explorer Open Data

6. **Données Ouvertes Montréal** 🔍
   - Explorer le catalogue
   - Identifier les jeux de données pertinents
   - Implémenter un connecteur si disponible

### Priorité 4 : Sources spécialisées

7. **Bandsintown** 🎸
   - Obtenir une clé API
   - Implémenter le connecteur

8. **Songkick** 🎸
   - Obtenir une clé API
   - Implémenter le connecteur

---

## 📝 Modèles d'Emails de Contact

### Email pour Eventbrite

```
Sujet : Demande d'accès à l'API Discovery Eventbrite pour Pulse Montreal

Bonjour,

Je développe Pulse Montreal, une plateforme d'agrégation d'événements 
culturels à Montréal. Nous souhaitons intégrer les événements Eventbrite 
de manière légale et durable via votre API.

Actuellement, l'API v3 ne permet pas de rechercher des événements publics 
par localisation. Pourriez-vous nous donner accès à l'API Discovery ou 
l'API de recherche publique ?

Notre projet :
- Plateforme open source d'agrégation d'événements
- Focus sur les événements culturels montréalais
- Respect des conditions d'utilisation et des données

Merci pour votre considération.

Cordialement,
[Votre nom]
```

### Email pour Lepointdevente.com

```
Sujet : Demande de partenariat API pour Pulse Montreal

Bonjour,

Je développe Pulse Montreal, une plateforme d'agrégation d'événements 
culturels à Montréal. Nous souhaitons intégrer les événements de 
Lepointdevente.com de manière légale et durable.

Auriez-vous :
- Une API officielle pour récupérer les événements ?
- Un flux RSS des événements ?
- La possibilité d'un partenariat de données ?

Notre projet :
- Plateforme open source d'agrégation d'événements
- Focus sur les événements culturels montréalais
- Respect des conditions d'utilisation

Merci pour votre considération.

Cordialement,
[Votre nom]
```

---

## ✅ Checklist

- [ ] Obtenir un token Meetup et l'activer
- [ ] Contacter Eventbrite pour l'API Discovery
- [ ] Contacter Lepointdevente.com pour un partenariat
- [ ] Contacter Tourisme Montréal pour un accès API
- [ ] Contacter Quartier des Spectacles pour un accès API/RSS
- [ ] Explorer les Données Ouvertes de Montréal
- [ ] Évaluer Bandsintown et Songkick pour les concerts

---

## 📚 Ressources

- **APIs d'événements** : https://www.programmableweb.com/category/events/apis
- **Open Data Montréal** : https://donnees.montreal.ca/
- **APIs de concerts** : Bandsintown, Songkick, Ticketmaster

---

**Dernière mise à jour** : Décembre 2025
**Principe** : Seules les sources légales et durables sont utilisées

