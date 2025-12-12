# 🔒 Vérifier les Restrictions IP sur Supabase

## ❌ Problème Actuel

Même avec l'URL directe qui fonctionnait avant, l'erreur persiste :
```
Can't reach database server at `db.dtveugfincrygcgsuyxo.supabase.co:5432`
```

**Cela indique probablement un problème de restrictions IP sur Supabase.**

---

## ✅ Solution : Autoriser les IPs de Vercel

### Étape 1 : Accéder aux Paramètres de Sécurité

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Cherchez la section **"Network Restrictions"** ou **"IP Allowlist"** ou **"Connection Pooling"** → **"IP Allowlist"**

### Étape 2 : Vérifier les Restrictions Actuelles

1. Regardez si des IPs sont listées
2. Si des IPs sont listées, elles peuvent bloquer Vercel
3. Les IPs de Vercel sont dynamiques et changent constamment

### Étape 3 : Autoriser Toutes les IPs (Recommandé pour Vercel)

**Option A : Autoriser toutes les IPs (0.0.0.0/0)**

1. Dans la section **"IP Allowlist"** ou **"Network Restrictions"**
2. Cliquez sur **"Add IP"** ou **"Allow all"**
3. Entrez `0.0.0.0/0` pour autoriser toutes les IPs
4. Sauvegardez

**Option B : Autoriser les IPs de Vercel spécifiquement**

Si vous préférez être plus restrictif, vous pouvez autoriser les plages d'IPs de Vercel :
- `76.76.21.0/24`
- `76.223.126.0/24`
- Et d'autres plages Vercel (consultez la documentation Vercel)

**Mais pour simplifier, `0.0.0.0/0` est recommandé.**

---

## 🔍 Où Trouver les Restrictions IP dans Supabase

### Méthode 1 : Via Database Settings

1. **Settings** → **Database**
2. Section **"Connection pooling"** → **"IP Allowlist"**
3. Ou section **"Network Restrictions"**

### Méthode 2 : Via Project Settings

1. **Settings** → **General**
2. Cherchez **"Network"** ou **"Security"**
3. Section **"IP Allowlist"**

### Méthode 3 : Via Connection Pooling

1. **Settings** → **Database**
2. Section **"Connection pooling"**
3. Cliquez sur **"Configure"** ou **"Settings"**
4. Cherchez **"IP Allowlist"** ou **"Allowed IPs"**

---

## ⚠️ Important

**Si vous avez activé des restrictions IP récemment**, cela peut expliquer pourquoi ça ne fonctionne plus même avec l'URL qui fonctionnait avant.

**Les restrictions IP s'appliquent à :**
- Les connexions directes (`db.xxx.supabase.co`)
- Les connexions via pooler (`xxx.pooler.supabase.com`)

---

## 📋 Checklist

- [ ] Vérifier les restrictions IP sur Supabase
- [ ] Autoriser `0.0.0.0/0` si nécessaire
- [ ] Attendre 1-2 minutes après modification
- [ ] Redéployer sur Vercel (si nécessaire)
- [ ] Tester la connexion

---

## 🔄 Après Avoir Modifié les Restrictions IP

1. **Attendez 1-2 minutes** pour que les changements prennent effet
2. **Rafraîchissez votre site** https://pulse-event.ca
3. **Vérifiez** que les événements s'affichent maintenant

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifiez les logs Vercel** : Functions → Logs pour voir l'erreur exacte
2. **Testez en local** : Vérifiez que la même URL fonctionne en local
3. **Vérifiez le mot de passe** : Assurez-vous que le mot de passe est correct
4. **Contactez le support Supabase** : Si le problème persiste

---

## 💡 Note

**Les restrictions IP sont souvent la cause principale** de ce type d'erreur. Même si l'URL fonctionnait avant, si des restrictions IP ont été ajoutées ou modifiées, cela peut bloquer les connexions depuis Vercel.

