# 🔧 Variables à Ajouter dans Vercel

## ⚠️ Variables OBLIGATOIRES Manquantes

D'après ta capture d'écran Vercel, il manque **3 variables obligatoires** qui bloquent probablement le déploiement :

### 1. NEXTAUTH_SECRET (CRITIQUE ⚠️)

**Sans cette variable, NextAuth ne fonctionne pas et le build peut échouer !**

```
NEXTAUTH_SECRET = 76e7m3yzmKBKvcKS7ftUzPb5hlZwKGAH/hnhb4GSnww=
```

**Comment l'ajouter :**
1. Va dans Vercel → Settings → Environment Variables
2. Clique "Add New"
3. Nom : `NEXTAUTH_SECRET`
4. Valeur : `76e7m3yzmKBKvcKS7ftUzPb5hlZwKGAH/hnhb4GSnww=`
5. Environnements : ✅ Production, ✅ Preview, ✅ Development
6. Clique "Save"

### 2. NEXT_PUBLIC_SUPABASE_URL

```
NEXT_PUBLIC_SUPABASE_URL = https://dtveugfincrygcgsuyxo.supabase.co
```
*(Vérifie l'URL exacte dans ton dashboard Supabase)*

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY

```
NEXT_PUBLIC_SUPABASE_ANON_KEY = [ta clé anon depuis Supabase]
```
*(Récupère-la dans Supabase → Settings → API → anon public key)*

## 📋 Où Trouver les Clés Supabase

1. Va sur https://app.supabase.com
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Copie :
   - **Project URL** → pour `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Après Ajout des Variables

1. **Redéploie manuellement** :
   - Va dans **Deployments**
   - Clique sur les trois points (⋯) du dernier déploiement
   - Sélectionne **Redeploy**

2. **Ou attends le prochain push** :
   - Les nouveaux commits déclencheront automatiquement un déploiement

## 🔍 Vérification

Une fois les variables ajoutées, vérifie que :
- ✅ Toutes les variables sont visibles dans Vercel
- ✅ Elles sont configurées pour **Production**, **Preview**, et **Development**
- ✅ Un nouveau déploiement est déclenché
- ✅ Le build passe sans erreur

## 💡 Note

Si `NEXTAUTH_SECRET` était déjà configuré mais masqué dans la capture, vérifie quand même qu'il est bien présent. Les secrets sont parfois masqués par sécurité dans l'interface Vercel.

