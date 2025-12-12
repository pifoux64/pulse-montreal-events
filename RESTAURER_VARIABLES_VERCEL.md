# 🔄 Restaurer les Variables d'Environnement sur Vercel

## ❌ Problème

Vous avez remplacé toutes les variables d'environnement en important `.env.local` sur Vercel, et maintenant ça ne fonctionne plus. **Ça fonctionnait avant !**

## ✅ Solution : Restaurer l'Ancienne Configuration

### Option 1 : Voir l'Historique sur Vercel (Si Disponible)

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Cherchez un bouton **"History"** ou **"View History"** (si disponible)
5. Si l'historique est disponible, vous pouvez voir les anciennes valeurs

**Note** : Vercel ne garde pas toujours l'historique des variables d'environnement, mais ça vaut la peine de vérifier.

---

### Option 2 : Vérifier les Logs Vercel pour l'Ancienne URL

1. Allez sur Vercel Dashboard → **Deployments**
2. Trouvez un déploiement **qui fonctionnait** (avant votre changement)
3. Cliquez sur ce déploiement
4. Allez dans **Functions** → **Logs**
5. Regardez les logs de ce déploiement
6. Cherchez des références à `DATABASE_URL` ou des connexions réussies

---

### Option 3 : Vérifier Git pour l'Ancienne Configuration

Si vous aviez un fichier `.env.example` ou une documentation avec l'ancienne configuration :

```bash
# Chercher dans l'historique Git
git log --all --full-history -- .env.example
git log --all --full-history -- "*env*"
```

---

### Option 4 : Restaurer l'URL Directe (Temporaire)

Si l'URL directe fonctionnait avant, vous pouvez la remettre temporairement :

```
postgresql://postgres:Pulse2025%21%40%23@db.dtveugfincrygcgsuyxo.supabase.co:5432/postgres?sslmode=require
```

**Note** : Cette URL ne devrait pas fonctionner sur Vercel normalement, mais si elle fonctionnait avant, il y avait peut-être une configuration spéciale.

---

### Option 5 : Vérifier les Variables d'Environnement dans un Ancien Déploiement

1. Allez sur Vercel Dashboard → **Deployments**
2. Trouvez un déploiement qui fonctionnait
3. Cliquez dessus
4. Regardez les **"Environment Variables"** utilisées pour ce déploiement
5. Copiez l'ancienne `DATABASE_URL`

---

## 🔍 Comment Identifier l'Ancienne Configuration

### Méthode 1 : Vérifier les Logs d'Erreur Avant

Si vous avez des logs d'erreur d'avant, ils peuvent contenir des indices sur l'ancienne configuration.

### Méthode 2 : Vérifier les Backups Vercel

Vercel peut avoir des backups automatiques. Vérifiez dans **Settings** → **General** → **Backups** (si disponible).

### Méthode 3 : Vérifier les Variables dans le Code

Si vous aviez hardcodé une URL de test quelque part dans le code :

```bash
# Chercher dans le code
grep -r "DATABASE_URL" src/
grep -r "supabase" src/
```

---

## 📋 Checklist pour Restaurer

1. [ ] Vérifier l'historique Vercel (si disponible)
2. [ ] Vérifier les logs d'un ancien déploiement qui fonctionnait
3. [ ] Vérifier Git pour des fichiers `.env.example` ou documentation
4. [ ] Essayer l'URL directe (si c'était celle qui fonctionnait)
5. [ ] Vérifier les variables dans un ancien déploiement

---

## ⚠️ Important

Si vous trouvez l'ancienne configuration qui fonctionnait :
1. **Notez-la** quelque part pour référence future
2. **Comprenez pourquoi** elle fonctionnait (peut-être une configuration spéciale Supabase)
3. **Testez** si elle fonctionne toujours avant de la remettre en production

---

## 💡 Astuce

Si vous ne trouvez pas l'ancienne configuration, vous pouvez :
1. **Créer un nouveau projet Supabase** pour tester
2. **Utiliser l'URL du pooler** avec les restrictions IP autorisées (comme suggéré dans `SOLUTION_IMMEDIATE_DATABASE.md`)
3. **Contacter le support Vercel** pour voir s'ils ont un historique

---

## 🔄 Après Avoir Restauré

Une fois que vous avez restauré l'ancienne configuration qui fonctionnait :
1. **Testez** que tout fonctionne
2. **Documentez** la configuration qui fonctionne
3. **Ne changez qu'une variable à la fois** à l'avenir pour identifier les problèmes

