# 🏛️ Configuration Open Data Montréal - Pulse Montreal

## 📋 Vue d'ensemble

Le connecteur Open Data Montréal permet d'importer des événements depuis les données ouvertes de la Ville de Montréal (donnees.montreal.ca).

## ⚙️ Configuration

### 1. Identifier un dataset d'événements

1. Visitez https://donnees.montreal.ca/
2. Recherchez des datasets d'événements (ex: "événements culturels", "festivals", "activités publiques")
3. Une fois un dataset trouvé, récupérez l'URL de l'API ou du fichier CSV

### 2. Formats supportés

#### Format JSON (Socrata)
```
https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
```

#### Format CSV
```
https://donnees.montreal.ca/dataset/XXXX/resource/XXXX/download/events.csv
```

### 3. Configuration de l'URL

Ajoutez la variable d'environnement :

```env
OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
```

Ou pour un fichier CSV :

```env
OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/dataset/XXXX/resource/XXXX/download/events.csv
```

### 4. Activation automatique

Le connecteur s'active automatiquement si `OPEN_DATA_MONTREAL_URL` est défini.

---

## 📊 Format de données attendu

Le connecteur supporte plusieurs formats de champs. Voici les mappings automatiques :

### Champs requis
- **Titre** : `title`, `nom`
- **Date de début** : `date_debut`, `start_date`, `date`, `start`
- **Lieu** : `lieu`, `venue`, `adresse`, `address`

### Champs optionnels
- **Description** : `description`, `description_fr`, `description_en`
- **Date de fin** : `date_fin`, `end_date`, `end`
- **Coordonnées** : `latitude`/`longitude`, `lat`/`lon`
- **Catégorie** : `categorie`, `category`, `type`
- **Prix** : `prix`, `price`
- **Gratuit** : `gratuit`, `free` (boolean ou string)
- **URL** : `url`, `lien`
- **Image** : `image`, `image_url`
- **Arrondissement** : `arrondissement`, `borough`

---

## 🔧 Exemple de dataset

### Format JSON (Socrata)
```json
{
  "meta": {
    "view": {
      "columns": [
        { "name": "id" },
        { "name": "title" },
        { "name": "date_debut" },
        { "name": "lieu" }
      ]
    }
  },
  "data": [
    ["1", "Festival de Jazz", "2025-07-01", "Place des Arts"],
    ["2", "Exposition d'art", "2025-07-15", "Musée des beaux-arts"]
  ]
}
```

### Format CSV
```csv
id,title,date_debut,lieu,description
1,Festival de Jazz,2025-07-01,Place des Arts,Grand festival de jazz
2,Exposition d'art,2025-07-15,Musée des beaux-arts,Exposition temporaire
```

### Format JSON simple
```json
[
  {
    "id": "1",
    "title": "Festival de Jazz",
    "date_debut": "2025-07-01",
    "lieu": "Place des Arts"
  }
]
```

---

## 🚀 Utilisation

Une fois configuré, le connecteur sera automatiquement utilisé lors de l'ingestion :

```bash
# L'ingestion inclura automatiquement Open Data Montréal si configuré
npm run ingest
```

Ou via l'API admin :

```bash
POST /api/admin/ingest/MTL_OPEN_DATA
```

---

## ⚠️ Limitations

1. **Format de données variable** : Les datasets Open Data Montréal peuvent avoir des formats différents. Le connecteur essaie de s'adapter automatiquement, mais certains champs peuvent nécessiter des ajustements.

2. **Géocodage** : Si les coordonnées ne sont pas fournies, le connecteur tentera de géocoder l'adresse. Cela peut être limité par les quotas de géocodage.

3. **Fréquence de mise à jour** : Les datasets Open Data Montréal peuvent ne pas être mis à jour en temps réel. Vérifiez la fréquence de mise à jour du dataset choisi.

---

## 🔍 Trouver des datasets

### Recherche recommandée
- "événements culturels"
- "festivals"
- "activités publiques"
- "programmation culturelle"
- "événements communautaires"

### Exemples de datasets potentiels
- Programmation culturelle de la Ville
- Festivals et événements majeurs
- Activités dans les parcs
- Événements communautaires par arrondissement

---

## 📝 Notes

- Le connecteur filtre automatiquement les événements passés
- Les événements sont dédupliqués avec les autres sources
- Le connecteur respecte les limites de taux (2 secondes entre requêtes)

---

**Dernière mise à jour** : Janvier 2025

