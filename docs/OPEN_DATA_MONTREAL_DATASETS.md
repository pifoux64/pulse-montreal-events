# 🔍 Datasets Open Data Montréal - Guide de Recherche

## 📋 Comment Trouver un Dataset d'Événements

### 1. Accéder au Portail
Visitez : https://donnees.montreal.ca/

### 2. Rechercher des Datasets
Mots-clés à rechercher :
- "événements culturels"
- "festivals"
- "programmation culturelle"
- "activités publiques"
- "événements communautaires"
- "calendrier événements"

### 3. Formats Supportés
Le connecteur supporte :
- **JSON (Socrata)** : `https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json`
- **CSV** : `https://donnees.montreal.ca/dataset/XXXX/resource/XXXX/download/events.csv`
- **JSON simple** : Tableau d'objets JSON

### 4. Configuration
Une fois un dataset trouvé, ajoutez l'URL dans `.env.local` :

```env
OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
```

### 5. Champs Requis dans le Dataset
Le connecteur cherche automatiquement ces champs (avec variations) :

**Obligatoires** :
- Titre : `title`, `nom`
- Date de début : `date_debut`, `start_date`, `date`, `start`

**Optionnels** :
- Description : `description`, `description_fr`, `description_en`
- Date de fin : `date_fin`, `end_date`, `end`
- Lieu : `lieu`, `venue`, `adresse`, `address`
- Coordonnées : `latitude`/`longitude`, `lat`/`lon`
- Catégorie : `categorie`, `category`, `type`
- Prix : `prix`, `price`
- Gratuit : `gratuit`, `free`
- URL : `url`, `lien`
- Image : `image`, `image_url`
- Arrondissement : `arrondissement`, `borough`

---

## 🔗 Datasets Potentiels à Explorer

### Quartier des Spectacles
- Rechercher : "quartier spectacles" ou "programmation quartier spectacles"
- URL potentielle : API ou CSV du Quartier des Spectacles

### Festivals de Montréal
- Rechercher : "festivals montreal" ou "calendrier festivals"
- Peut contenir : Jazz Fest, Just for Laughs, etc.

### Activités Culturelles
- Rechercher : "activités culturelles" ou "programmation culturelle"
- Peut contenir : Expositions, spectacles, concerts

### Événements Communautaires
- Rechercher : "événements communautaires" ou "activités arrondissements"
- Peut contenir : Événements par arrondissement

---

## ⚠️ Note Importante

**Pour l'instant, aucun dataset spécifique n'a été identifié.**

Pour activer Open Data Montréal :
1. Visitez https://donnees.montreal.ca/
2. Recherchez un dataset d'événements
3. Copiez l'URL de l'API ou du fichier CSV
4. Ajoutez-la dans `.env.local` comme `OPEN_DATA_MONTREAL_URL`

Le connecteur s'activera automatiquement une fois l'URL configurée.

---

**Dernière mise à jour** : Janvier 2025

