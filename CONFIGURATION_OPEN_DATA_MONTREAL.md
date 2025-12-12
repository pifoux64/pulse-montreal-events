# 🏛️ Configuration Open Data Montréal - Guide Complet

## 📋 État Actuel

**Statut** : ⚠️ Connecteur prêt mais nécessite configuration d'un dataset

Le connecteur Open Data Montréal est **implémenté et fonctionnel**, mais nécessite l'identification d'un dataset d'événements sur le portail de données ouvertes de Montréal.

---

## 🔍 Comment Trouver un Dataset

### 1. Accéder au Portail
Visitez : **https://donnees.montreal.ca/**

### 2. Rechercher des Datasets d'Événements

**Mots-clés à rechercher** :
- "événements culturels"
- "festivals"
- "programmation culturelle"
- "activités publiques"
- "événements communautaires"
- "calendrier événements"
- "quartier spectacles"

### 3. Vérifier le Format

Le connecteur supporte :
- ✅ **JSON (Socrata)** : Format API avec `meta` et `data`
- ✅ **CSV** : Fichiers CSV téléchargeables
- ✅ **JSON simple** : Tableau d'objets JSON

### 4. Vérifier les Champs

Le connecteur cherche automatiquement ces champs (avec variations) :

**Obligatoires** :
- Titre : `title`, `nom`
- Date de début : `date_debut`, `start_date`, `date`, `start`

**Optionnels** (mais recommandés) :
- Description : `description`, `description_fr`, `description_en`
- Lieu : `lieu`, `venue`, `adresse`, `address`
- Coordonnées : `latitude`/`longitude`, `lat`/`lon`
- Catégorie : `categorie`, `category`, `type`

---

## ⚙️ Configuration

### Étape 1 : Identifier l'URL du Dataset

Une fois un dataset trouvé, récupérez son URL :

**Pour JSON (Socrata)** :
```
https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
```

**Pour CSV** :
```
https://donnees.montreal.ca/dataset/XXXX/resource/XXXX/download/events.csv
```

### Étape 2 : Ajouter dans les Variables d'Environnement

Ajoutez l'URL dans votre fichier `.env.local` :

```env
OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
```

### Étape 3 : Redémarrer l'Application

Le connecteur s'activera automatiquement lors de la prochaine ingestion.

---

## 🧪 Tester la Configuration

### Test Manuel

```bash
# Tester le connecteur directement
npx tsx -e "
import { OpenDataMontrealConnector } from './src/ingestors/open-data-montreal';

async function test() {
  const connector = new OpenDataMontrealConnector(process.env.OPEN_DATA_MONTREAL_URL);
  const events = await connector.listUpdatedSince(new Date(), 10);
  console.log('Événements récupérés:', events.length);
  if (events.length > 0) {
    console.log('Exemple:', events[0]);
  }
}

test();
"
```

### Test via Ingestion

```bash
# Lancer une ingestion complète
npx tsx scripts/run-full-ingestion.ts
```

---

## 📊 Datasets Potentiels à Explorer

### 1. Quartier des Spectacles
- **Rechercher** : "quartier spectacles" ou "programmation quartier spectacles"
- **Contenu potentiel** : Événements du Quartier des Spectacles

### 2. Festivals de Montréal
- **Rechercher** : "festivals montreal" ou "calendrier festivals"
- **Contenu potentiel** : Jazz Fest, Just for Laughs, etc.

### 3. Activités Culturelles
- **Rechercher** : "activités culturelles" ou "programmation culturelle"
- **Contenu potentiel** : Expositions, spectacles, concerts

### 4. Événements Communautaires
- **Rechercher** : "événements communautaires" ou "activités arrondissements"
- **Contenu potentiel** : Événements par arrondissement

---

## ⚠️ Limitations Connues

1. **Format variable** : Les datasets peuvent avoir des formats différents. Le connecteur essaie de s'adapter automatiquement.

2. **Géocodage** : Si les coordonnées ne sont pas fournies, le connecteur tentera de géocoder l'adresse (limité par les quotas de géocodage).

3. **Fréquence de mise à jour** : Les datasets peuvent ne pas être mis à jour en temps réel. Vérifiez la fréquence de mise à jour du dataset choisi.

---

## 🔧 Dépannage

### Problème : Aucun événement récupéré

1. Vérifier que `OPEN_DATA_MONTREAL_URL` est bien défini
2. Vérifier que l'URL est accessible (tester dans un navigateur)
3. Vérifier le format du dataset (JSON/CSV)
4. Vérifier que le dataset contient des événements futurs

### Problème : Erreur de parsing

1. Vérifier le format du dataset
2. Vérifier que les champs requis (titre, date) sont présents
3. Consulter les logs pour plus de détails

---

## 📝 Exemple de Configuration

```env
# .env.local
OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/api/views/abc123-def456/rows.json
```

Une fois configuré, le connecteur sera automatiquement utilisé lors de l'ingestion :

```bash
# Lancer l'ingestion
npx tsx scripts/run-full-ingestion.ts
```

---

## ✅ Checklist de Configuration

- [ ] Dataset identifié sur donnees.montreal.ca
- [ ] URL du dataset récupérée
- [ ] `OPEN_DATA_MONTREAL_URL` ajouté dans `.env.local`
- [ ] Test du connecteur effectué
- [ ] Ingestion complète lancée
- [ ] Événements vérifiés dans la base de données

---

**Dernière mise à jour** : Janvier 2025  
**Statut** : Connecteur prêt, nécessite configuration d'un dataset

