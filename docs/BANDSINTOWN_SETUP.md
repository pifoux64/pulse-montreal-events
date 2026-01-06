# 🎸 Configuration Bandsintown - Pulse Montréal

## Vue d'ensemble

Bandsintown est une plateforme de découverte de concerts et événements musicaux. L'API Bandsintown permet de récupérer les événements musicaux à Montréal.

---

## 🔑 Configuration

### Variable d'environnement

**Nom** : `BANDSINTOWN_APP_ID`

**Description** : Identifiant de l'application pour l'API Bandsintown. Bandsintown nécessite un `app_id` pour toutes les requêtes API, mais ce n'est pas une clé API stricte - c'est juste un identifiant pour votre application.

**Valeur par défaut** : Si non configuré, utilise `"pulse-montreal"`

**Format** : Chaîne de caractères (peut être n'importe quelle valeur)

### Configuration locale (.env.local)

```env
BANDSINTOWN_APP_ID="29e8f59587ab546860bfca7ae5c8311e"
```

### Configuration Vercel (Production)

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `pulse-montreal-events`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter :
   - **Name** : `BANDSINTOWN_APP_ID`
   - **Value** : `29e8f59587ab546860bfca7ae5c8311e`
   - **Environments** : Production, Preview, Development
5. Cliquer sur **Save**

---

## 📡 API Bandsintown

### Endpoint utilisé

```
GET https://rest.bandsintown.com/events/search
```

### Paramètres

- `app_id : Identifiant de votre application
- `location` : `"Montreal,QC,Canada"`
- `date` : `"upcoming"` (tous les événements futurs)
- `radius` : `"50"` (50km autour de Montréal)

### Documentation

- **API Documentation** : https://artists.bandsintown.com/support/bandsintown-api
- **Rate Limit** : Pas de limite stricte documentée, mais nous utilisons 2 requêtes/seconde par précaution

---

## 🔍 Fonctionnalités

### Récupération des événements

- Recherche par localisation (Montréal)
- Filtrage automatique des événements passés
- Limite de 200 événements par import

### Mapping des données

- **Titre** : Nom de l'artiste + lineup
- **Description** : Description de l'événement ou générée automatiquement
- **Lieu** : Venue avec coordonnées géographiques
- **Genre musical** : Détection automatique basée sur le nom de l'artiste
- **URL de ticket** : Récupérée depuis les "offers" de l'événement

### Géocodage

Si les coordonnées géographiques ne sont pas disponibles dans l'API, le système effectue un géocodage automatique de l'adresse.

---

## ✅ Statut

- ✅ Connecteur implémenté : `src/ingestors/bandsintown.ts`
- ✅ Activé dans l'orchestrateur : `src/lib/orchestrator.ts`
- ✅ Rate limiting : 2 requêtes/seconde
- ✅ Filtrage des événements passés
- ✅ Mapping complet vers format unifié

---

## 🧪 Test

Pour tester l'intégration Bandsintown :

1. Vérifier que `BANDSINTOWN_APP_ID` est configuré
2. Lancer l'ingestion manuellement ou attendre le cron job
3. Vérifier les logs pour voir les événements récupérés
4. Vérifier dans la base de données que les événements sont bien importés

---

## 📝 Notes

- Bandsintown ne fournit pas les prix dans l'API publique
- Les images sont récupérées depuis `artist.image_url` si disponibles
- Le système détecte automatiquement le genre musical à partir du nom de l'artiste
- Les événements sont catégorisés automatiquement comme `MUSIC`

---

**Dernière mise à jour** : Janvier 2025

