# ✅ Sources GRATUITES pour Récupérer des Événements

Ce document liste toutes les sources **gratuites** et légales pour récupérer des événements à Montréal.

## 🎯 Principe

Seules les sources **100% gratuites** sont listées ici. Pour les sources payantes, voir `SOURCES_LEGALES.md`.

---

## 🎫 Sources Gratuites Disponibles

### 1. Ticketmaster Discovery API ⭐

**Statut** : ✅ **Actif et GRATUIT**

- **API officielle** : https://developer.ticketmaster.com/
- **Événements** : ~204 événements importés
- **Limite** : 5000 requêtes/jour (gratuit)
- **Coût** : **GRATUIT** ✅
- **Configuration** : Nécessite `TICKETMASTER_API_KEY` (gratuit)
- **Documentation** : https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

**Comment obtenir la clé** :
1. Créer un compte : https://developer.ticketmaster.com/
2. Cliquer sur "Get Your API Key"
3. Remplir le formulaire (gratuit)
4. Récupérer la clé API
5. Ajouter `TICKETMASTER_API_KEY=votre_cle` dans `.env.local`

**Avantages** :
- ✅ **GRATUIT**
- API officielle et documentée
- Grande quantité d'événements
- Données structurées et fiables
- Support officiel

---

## 🌐 Open Data et Sources Publiques Gratuites

### 2. Données Ouvertes de Montréal

**Statut** : ⚠️ **À explorer - GRATUIT**

- **Site** : https://donnees.montreal.ca/
- **Type** : Open Data (données publiques)
- **Coût** : **GRATUIT** ✅
- **Potentiel** : Événements publics, festivals, activités culturelles

**À faire** :
1. Explorer le catalogue : https://donnees.montreal.ca/
2. Chercher des jeux de données sur les événements
3. Vérifier s'il y a une API disponible
4. Implémenter un connecteur si des données sont disponibles

**Ressources** :
- Catalogue : https://donnees.montreal.ca/
- API : À vérifier si disponible

---

### 3. Quartier des Spectacles

**Statut** : ⚠️ **À explorer - Potentiellement GRATUIT**

- **Site** : https://www.quartierdesspectacles.com/
- **Type** : Organisme public
- **Coût** : **Potentiellement GRATUIT** (à confirmer)
- **Potentiel** : Événements culturels du Quartier des Spectacles

**À faire** :
1. Contacter le Quartier des Spectacles
2. Demander un accès API ou un flux de données (gratuit si organisme public)
3. Vérifier s'il y a un flux RSS disponible
4. Implémenter un connecteur

**Contact** :
- Site : https://www.quartierdesspectacles.com/
- Email : À trouver sur le site

---

### 4. Tourisme Montréal

**Statut** : ⚠️ **À explorer - Potentiellement GRATUIT**

- **Site** : https://www.mtl.org/
- **Type** : Organisme de tourisme
- **Coût** : **Potentiellement GRATUIT** (à confirmer)
- **Potentiel** : Événements touristiques et culturels

**À faire** :
1. Contacter Tourisme Montréal
2. Demander un accès API ou un flux de données
3. Expliquer que c'est pour un projet d'agrégation d'événements
4. Remplacer les données mockées par de vraies données

**Contact** :
- Site : https://www.mtl.org/
- Email : À trouver sur le site

---

## 🎵 Sources Spécialisées Gratuites

### 5. Bandsintown API (Concerts)

**Statut** : ⚠️ **À vérifier - Potentiellement GRATUIT**

- **API** : https://www.bandsintown.com/api/overview
- **Type** : API REST
- **Focus** : Concerts et spectacles musicaux
- **Coût** : **À vérifier** (peut avoir un plan gratuit)

**À faire** :
1. Vérifier les plans tarifaires
2. Voir s'il y a un plan gratuit ou développeur
3. Obtenir une clé API si gratuit
4. Implémenter le connecteur

**Ressources** :
- API : https://www.bandsintown.com/api/overview
- Documentation : À consulter

---

### 6. Songkick API (Concerts)

**Statut** : ⚠️ **À vérifier - Potentiellement GRATUIT**

- **API** : https://www.songkick.com/developer
- **Type** : API REST
- **Focus** : Concerts et festivals
- **Coût** : **À vérifier** (peut avoir un plan gratuit)

**À faire** :
1. Vérifier les plans tarifaires
2. Voir s'il y a un plan gratuit ou développeur
3. Obtenir une clé API si gratuit
4. Implémenter le connecteur

**Ressources** :
- API : https://www.songkick.com/developer
- Documentation : À consulter

---

## 📋 Plan d'Action Recommandé (Gratuit)

### Priorité 1 : Maximiser Ticketmaster (Déjà actif) ✅

1. **Vérifier que Ticketmaster fonctionne bien**
   - Vérifier les logs d'ingestion
   - Vérifier le nombre d'événements récupérés
   - Optimiser les requêtes si nécessaire

### Priorité 2 : Explorer Open Data

2. **Données Ouvertes de Montréal** 🔍
   - Explorer le catalogue : https://donnees.montreal.ca/
   - Identifier les jeux de données pertinents
   - Implémenter un connecteur si disponible

### Priorité 3 : Contacter les Organismes Publics

3. **Quartier des Spectacles** 📧
   - Contacter pour obtenir un accès API/RSS gratuit
   - Expliquer le projet
   - Implémenter le connecteur si accord

4. **Tourisme Montréal** 📧
   - Contacter pour obtenir un accès API gratuit
   - Expliquer le projet
   - Remplacer les données mockées

### Priorité 4 : Évaluer les APIs de Concerts

5. **Bandsintown** 🎸
   - Vérifier s'il y a un plan gratuit
   - Implémenter si gratuit

6. **Songkick** 🎸
   - Vérifier s'il y a un plan gratuit
   - Implémenter si gratuit

---

## ✅ Checklist Sources Gratuites

- [x] Ticketmaster (actif et gratuit) ✅
- [ ] Explorer Données Ouvertes Montréal
- [ ] Contacter Quartier des Spectacles
- [ ] Contacter Tourisme Montréal
- [ ] Évaluer Bandsintown (plan gratuit ?)
- [ ] Évaluer Songkick (plan gratuit ?)

---

## 📚 Ressources

- **APIs d'événements gratuites** : https://www.programmableweb.com/category/events/apis
- **Open Data Montréal** : https://donnees.montreal.ca/
- **Ticketmaster API** : https://developer.ticketmaster.com/

---

## 💡 Recommandation

**Pour maximiser les événements GRATUITEMENT** :

1. ✅ **Ticketmaster** est déjà actif et fonctionne bien
2. 🔍 **Explorer Open Data Montréal** pour des événements publics
3. 📧 **Contacter les organismes publics** (Quartier des Spectacles, Tourisme Montréal)
4. 🎸 **Évaluer les APIs de concerts** pour voir s'il y a des plans gratuits

**Avec seulement Ticketmaster, vous avez déjà ~204 événements. En ajoutant les sources publiques, vous pourriez facilement atteindre 500+ événements gratuitement !**

---

**Dernière mise à jour** : Décembre 2025
**Focus** : Sources 100% gratuites uniquement

