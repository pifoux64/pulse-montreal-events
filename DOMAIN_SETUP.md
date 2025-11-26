# 🌐 Configuration du Domaine pulse-event.ca

Guide complet pour connecter votre domaine HostPapa à votre déploiement Vercel.

## 📋 Prérequis

- ✅ Domaine `pulse-event.ca` acheté sur HostPapa
- ✅ Projet déployé sur Vercel
- ✅ Accès au panneau de contrôle HostPapa
- ✅ Accès au dashboard Vercel

## 🚀 Étapes de Configuration

### Étape 1: Ajouter le Domaine dans Vercel

1. **Connectez-vous à Vercel**
   - Allez sur https://vercel.com
   - Connectez-vous à votre compte

2. **Accédez aux Paramètres du Projet**
   - Sélectionnez votre projet `montreal-events`
   - Allez dans **Settings** → **Domains**

3. **Ajoutez le Domaine**
   - Cliquez sur **Add Domain**
   - Entrez `pulse-event.ca`
   - Cliquez sur **Add**

4. **Notez les Informations DNS**
   - Vercel vous donnera des instructions DNS spécifiques
   - Pour `pulse-event.ca`, vous devrez :
     - **Supprimer** l'enregistrement A existant : `66.102.137.52`
     - **Ajouter** un enregistrement A : `216.198.79.1`
   - Pour `www.pulse-event.ca`, vous devrez :
     - **Ajouter** un enregistrement CNAME : `www` → `7c323bf0cadbb7a8.vercel-dns-017.com.`

### Étape 2: Configurer les DNS dans HostPapa

1. **Connectez-vous à HostPapa**
   - Allez sur https://www.hostpapa.com
   - Connectez-vous à votre compte
   - Accédez au **Domain Manager** ou **DNS Management**

2. **Trouvez la Zone DNS**
   - Sélectionnez le domaine `pulse-event.ca`
   - Cherchez la section **DNS Records** ou **Zone Editor**

3. **Configurez les Enregistrements DNS**

   **Option A: Utiliser les Nameservers de Vercel (Recommandé)**
   
   Si HostPapa vous permet de changer les nameservers :
   - Dans Vercel, allez dans **Settings** → **Domains** → `pulse-event.ca`
   - Vercel vous donnera des nameservers (ex: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
   - Dans HostPapa, changez les nameservers pour utiliser ceux de Vercel
   - ⏳ Attendez 24-48h pour la propagation

   **Option B: Configurer les Enregistrements DNS Manuellement**
   
   Si vous devez garder les nameservers de HostPapa, suivez ces étapes :

   **⚠️ ÉTAPE CRITIQUE : Supprimer les Anciens Enregistrements**
   
   Avant d'ajouter de nouveaux enregistrements, vous DEVEZ supprimer tous les anciens :
   
   1. **Cherchez tous les enregistrements existants pour :**
      - Le domaine racine (`pulse-event.ca` ou `@`)
      - Le sous-domaine `www`
   
   2. **Supprimez TOUS les enregistrements A, CNAME, AAAA existants** pour ces noms
      - ⚠️ **Important** : Un CNAME ne peut pas coexister avec d'autres enregistrements du même nom
      - Si vous voyez plusieurs CNAME pour `www`, supprimez-les TOUS
      - Si vous voyez un A et un CNAME pour le même nom, supprimez-les
   
   3. **Gardez uniquement** :
      - Les enregistrements MX (pour l'email)
      - Les enregistrements TXT (pour la vérification, etc.)
   
   **Ajouter les Nouveaux Enregistrements**
   
   Une fois les anciens supprimés, ajoutez ces enregistrements avec les valeurs EXACTES de Vercel :

   **1. Modifier l'Enregistrement A (domaine racine) :**
   
   ⚠️ **IMPORTANT** : Vous devez d'abord SUPPRIMER l'enregistrement A existant qui pointe vers `66.102.137.52` (c'est l'IP de votre WordPress HostPapa).
   
   Ensuite, ajoutez le nouvel enregistrement A :
   ```
   Type: A
   Name: pulse-event.ca (ou laissez le champ complètement vide selon l'interface)
   Value: 216.198.79.1
   TTL: 14400 (ou Auto)
   ```
   
   💡 **Note HostPapa** : Si l'interface ne permet pas "@" ou vide :
   - Essayez de mettre `pulse-event.ca` dans le champ Name
   - Ou laissez le champ complètement vide (sans rien)
   - Ou mettez juste un point `.`
   
   **2. Ajouter l'Enregistrement CNAME (www) :**
   ```
   Type: CNAME
   Name: www (sans le domaine, juste "www")
   Value: 7c323bf0cadbb7a8.vercel-dns-017.com.
   TTL: 14400 (ou Auto)
   ```
   
   ⚠️ **Important**: 
   - Ces valeurs sont spécifiques à votre projet Vercel
   - Assurez-vous qu'il n'y a QU'UN SEUL CNAME pour `www` après avoir ajouté le nouveau
   - Le point final (`.`) dans la valeur CNAME est important

### Étape 3: Vérifier la Configuration dans Vercel

1. **Retournez dans Vercel**
   - Allez dans **Settings** → **Domains** → `pulse-event.ca`
   - Vérifiez le statut :
     - ✅ **Valid Configuration**: Tout est bon !
     - ⏳ **Pending**: En attente de propagation DNS
     - ❌ **Invalid Configuration**: Vérifiez vos DNS

2. **Attendez la Propagation DNS**
   - La propagation peut prendre de 5 minutes à 48 heures
   - En général, c'est actif dans les 1-2 heures
   - Vous pouvez vérifier avec: https://dnschecker.org

### Étape 4: Mettre à Jour les Variables d'Environnement

1. **Dans Vercel, allez dans Settings → Environment Variables**

2. **Mettez à jour `NEXTAUTH_URL`**
   - Changez de: `https://montreal-events.vercel.app`
   - Vers: `https://pulse-event.ca`
   - Ou: `https://www.pulse-event.ca` (selon votre préférence)

3. **Redeployez le Projet**
   - Allez dans **Deployments**
   - Cliquez sur les trois points (⋯) du dernier déploiement
   - Sélectionnez **Redeploy**

### Étape 5: Configurer HTTPS (Automatique)

- ✅ Vercel configure automatiquement le certificat SSL (HTTPS)
- ✅ Le certificat est émis par Let's Encrypt
- ✅ Aucune action requise de votre part
- ⏳ Peut prendre quelques minutes après la propagation DNS

## 🔍 Vérification

### Tester la Configuration

1. **Vérifiez que le domaine fonctionne**
   ```bash
   curl -I https://pulse-event.ca
   ```
   Vous devriez voir un code HTTP 200

2. **Vérifiez les redirections**
   - `http://pulse-event.ca` → devrait rediriger vers `https://pulse-event.ca`
   - `http://www.pulse-event.ca` → devrait rediriger vers `https://www.pulse-event.ca`

3. **Testez dans le navigateur**
   - Ouvrez https://pulse-event.ca
   - Vérifiez que votre site s'affiche correctement

## 🛠️ Troubleshooting

### Le domaine ne fonctionne pas après 24h

1. **Vérifiez les DNS**
   - Utilisez https://dnschecker.org
   - Tapez `pulse-event.ca` et vérifiez que les enregistrements correspondent à ceux de Vercel

2. **Vérifiez dans HostPapa**
   - Assurez-vous que les enregistrements DNS sont corrects
   - Vérifiez qu'il n'y a pas de typos dans les valeurs

3. **Vérifiez dans Vercel**
   - Allez dans **Settings** → **Domains**
   - Vérifiez les erreurs affichées
   - Vercel vous dira exactement ce qui ne va pas

### Erreur "Invalid Configuration"

- Vérifiez que les enregistrements DNS correspondent exactement à ceux demandés par Vercel
- Assurez-vous qu'il n'y a pas d'enregistrements conflictuels
- Attendez quelques minutes et rafraîchissez la page

### Erreur "multiple RRs of singleton type" (CNAME)

Cette erreur signifie qu'il y a **plusieurs enregistrements CNAME** pour le même nom (ex: `www`), ce qui n'est pas autorisé.

**Solution :**

1. **Dans HostPapa, allez dans la gestion DNS**
2. **Cherchez TOUS les enregistrements CNAME pour `www`**
3. **Supprimez-les TOUS** (même les anciens)
4. **Ajoutez UN SEUL nouveau CNAME** avec la valeur fournie par Vercel
5. **Vérifiez qu'il n'y a pas d'autres enregistrements** (A, AAAA) pour `www` qui pourraient entrer en conflit

**Règle importante** : Un nom de domaine ne peut avoir qu'UN SEUL type d'enregistrement à la fois. Si vous avez un CNAME pour `www`, vous ne pouvez pas avoir d'enregistrement A pour `www` en même temps.

### Problème avec le champ "Name" pour l'enregistrement A

Si HostPapa ne permet pas "@" ou vide pour le type A :

1. **Essayez ces options dans l'ordre :**
   - Laissez le champ complètement vide (ne tapez rien)
   - Mettez `pulse-event.ca` (le domaine complet)
   - Mettez juste un point `.`
   - Mettez `@` si l'interface l'accepte

2. **Vérifiez dans la liste des enregistrements** comment les autres enregistrements A sont formatés et utilisez le même format

### Le site charge mais avec un certificat invalide

- Attendez 10-15 minutes, Vercel doit générer le certificat SSL
- Si le problème persiste, contactez le support Vercel

### Redirection www vs non-www

Par défaut, Vercel redirige automatiquement:
- `www.pulse-event.ca` → `pulse-event.ca`

Si vous préférez l'inverse, vous pouvez configurer dans Vercel:
- **Settings** → **Domains** → Configurez la redirection préférée

## 📝 Notes Importantes

- ⏳ **Propagation DNS**: Peut prendre jusqu'à 48h, mais généralement 1-2h
- 🔒 **HTTPS**: Automatique et gratuit avec Vercel
- 🔄 **Redéploiement**: Après avoir changé `NEXTAUTH_URL`, redéployez le projet
- 📧 **Email**: Si vous utilisez l'email avec ce domaine, gardez les enregistrements MX dans HostPapa

## 🎯 URLs Finales

Une fois configuré, votre site sera accessible sur:
- ✅ https://pulse-event.ca
- ✅ https://www.pulse-event.ca (redirige vers pulse-event.ca)

## 📞 Support

- **Vercel Support**: https://vercel.com/support
- **HostPapa Support**: https://www.hostpapa.com/support
- **Documentation Vercel**: https://vercel.com/docs/concepts/projects/domains

