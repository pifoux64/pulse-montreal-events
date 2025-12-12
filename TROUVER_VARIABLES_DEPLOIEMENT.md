# 🔍 Comment Trouver les Variables d'Environnement d'un Déploiement Vercel

## 📍 Méthode 1 : Via l'Interface Vercel (Recommandé)

### Étape 1 : Accéder aux Déploiements

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet (ex: `montreal-events` ou `pulse-event`)
3. Cliquez sur l'onglet **"Deployments"** (en haut de la page)

### Étape 2 : Sélectionner un Déploiement

1. Vous verrez une liste de tous vos déploiements
2. Trouvez un déploiement qui **fonctionnait** (avant votre changement)
   - Regardez la **date/heure** du déploiement
   - Les déploiements sont triés par date (plus récents en premier)
3. Cliquez sur le déploiement qui vous intéresse

### Étape 3 : Voir les Variables d'Environnement

Une fois dans le déploiement, vous avez plusieurs options :

#### Option A : Onglet "Settings" du Déploiement

1. Dans la page du déploiement, cherchez un onglet **"Settings"** ou **"Configuration"**
2. Cliquez dessus
3. Vous devriez voir une section **"Environment Variables"** ou **"Build Environment Variables"**

#### Option B : Via les Logs de Build

1. Dans la page du déploiement, cliquez sur l'onglet **"Build Logs"** ou **"Logs"**
2. Faites défiler jusqu'au début des logs
3. Cherchez une section qui affiche les variables d'environnement (parfois masquées pour sécurité)
4. Ou cherchez des références à `DATABASE_URL` dans les logs

#### Option C : Via l'API Vercel (Avancé)

Si l'interface ne montre pas les variables, vous pouvez utiliser l'API Vercel :

1. Allez sur https://vercel.com/account/tokens
2. Créez un token API
3. Utilisez l'API pour récupérer les variables :
   ```bash
   curl "https://api.vercel.com/v9/projects/[PROJECT_ID]/env" \
     -H "Authorization: Bearer [YOUR_TOKEN]"
   ```

---

## 📍 Méthode 2 : Via les Settings Globaux du Projet

Si vous ne trouvez pas les variables dans un déploiement spécifique :

1. Allez sur **Settings** (en haut de la page du projet)
2. Cliquez sur **"Environment Variables"** dans le menu de gauche
3. Vous verrez toutes les variables actuelles
4. **Note** : Cela montre les variables actuelles, pas celles d'un déploiement spécifique

---

## 📍 Méthode 3 : Via les Logs de Build (Plus Fiable)

### Étape 1 : Accéder aux Logs

1. Vercel Dashboard → **Deployments**
2. Cliquez sur un déploiement qui fonctionnait
3. Cliquez sur **"Build Logs"** ou **"Logs"**

### Étape 2 : Chercher dans les Logs

Dans les logs, cherchez :
- Des références à `DATABASE_URL`
- Des messages de connexion à la base de données
- Des erreurs ou succès de connexion

**Exemple de ce que vous pourriez voir** :
```
✓ Connected to database
✓ Using DATABASE_URL from environment
```

---

## 📍 Méthode 4 : Vérifier l'Historique Git

Si vous avez commité des changements de configuration :

1. Allez dans votre terminal
2. Regardez l'historique Git autour de la date du déploiement qui fonctionnait :
   ```bash
   git log --all --since="2025-01-01" --until="2025-01-15" -- "*env*" ".env*"
   ```

---

## 🔍 Où Exactement dans l'Interface Vercel ?

### Navigation Typique :

```
Vercel Dashboard
  → Votre Projet
    → Deployments (onglet en haut)
      → Cliquez sur un déploiement spécifique
        → Settings (onglet dans le déploiement)
          → Environment Variables (section)
```

OU

```
Vercel Dashboard
  → Votre Projet
    → Settings (en haut de la page)
      → Environment Variables (menu de gauche)
        → Voir toutes les variables actuelles
```

---

## ⚠️ Note Importante

**Vercel peut masquer les valeurs des variables d'environnement** pour des raisons de sécurité. Si vous ne voyez que les noms des variables mais pas leurs valeurs :

1. Les valeurs peuvent être masquées (affichées comme `••••••••`)
2. Vous devrez peut-être utiliser l'API Vercel pour voir les valeurs
3. Ou vous pouvez essayer de restaurer manuellement en vous basant sur votre `.env.local`

---

## 💡 Astuce Rapide

Si vous ne trouvez pas les variables dans un déploiement spécifique :

1. **Regardez les logs de build** du déploiement qui fonctionnait
2. **Cherchez des erreurs ou messages** qui mentionnent la base de données
3. **Comparez avec les logs actuels** pour voir la différence

---

## 🆘 Si Vous Ne Trouvez Toujours Pas

1. **Contactez le support Vercel** : Ils peuvent avoir un historique
2. **Vérifiez vos backups** : Si vous avez sauvegardé vos variables quelque part
3. **Essayez de restaurer** l'URL directe qui fonctionnait peut-être avant :
   ```
   postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require
   ```

