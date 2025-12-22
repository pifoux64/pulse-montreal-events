# 🔧 Problème : Emails de connexion non reçus (Délivrabilité)

## Problème identifié

Les emails de lien de connexion ne sont pas reçus par certaines adresses email françaises :
- `anne.fouilloux@laposte.net` → **Bounced** (rejeté)
- `jmfouilloux@noos.fr` → **Delivered** mais non reçu
- `pierrefouilloux59@gmail.com` → Fonctionne correctement

## Configuration actuelle

✅ **Domaine vérifié** : `pulse-event.ca` est bien configuré dans Resend
- ✅ DKIM vérifié
- ✅ SPF vérifié  
- ✅ MX vérifié
- ⚠️ DMARC non configuré (optionnel mais recommandé)
- 🌍 **Région** : North Virginia (us-east-1)

## Causes probables

### 1. Réputation du domaine (Cause principale probable)

Le domaine `pulse-event.ca` est **nouveau (26 jours)**. Les fournisseurs email français (La Poste, Noos) sont souvent **plus stricts** avec les nouveaux domaines :
- Pas de réputation établie
- Pas d'historique d'envoi
- Filtres anti-spam plus agressifs

### 2. Fournisseurs français plus stricts

Les fournisseurs email français (`laposte.net`, `noos.fr`, `orange.fr`, etc.) ont tendance à être plus stricts que Gmail :
- Filtres anti-spam plus agressifs
- Vérification SPF/DKIM plus stricte
- Réputation requise plus élevée

### 3. Région (Impact mineur)

La région **North Virginia (us-east-1)** peut avoir un impact mineur sur la délivrabilité vers la France, mais ce n'est **pas la cause principale**. Resend utilise AWS SES qui a une bonne réputation mondiale.

### 4. DMARC non configuré

DMARC n'est pas configuré (optionnel dans Resend), mais cela peut aider à améliorer la délivrabilité, surtout avec les fournisseurs français.

## Solutions

### Solution 1 : Configurer DMARC (Recommandé - Amélioration immédiate)

DMARC peut améliorer la délivrabilité, surtout avec les fournisseurs français :

1. **Dans Resend** :
   - Va sur **Domains** > `pulse-event.ca`
   - Regarde la section **DMARC (Optional)**
   - Resend te donnera les enregistrements à ajouter

2. **Dans Vercel** :
   - Va dans **Settings** > **Domains** > `pulse-event.ca` > **Edit DNS Records**
   - Ajoute un enregistrement **TXT** :
     - **Name** : `_dmarc`
     - **Value** : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
     - **TTL** : Auto

3. **Attendre la propagation DNS** (quelques minutes à quelques heures)

⚠️ **Note** : Commence avec `p=none` (monitoring uniquement). Une fois que tout fonctionne bien, tu peux passer à `p=quarantine` puis `p=reject`.

### Solution 2 : Améliorer la réputation du domaine (Long terme)

La réputation s'améliore avec le temps et l'utilisation :

1. **Envoi régulier** : Continue à envoyer des emails (magic links, notifications)
2. **Taux d'engagement** : Plus les utilisateurs ouvrent/cliquent, meilleure la réputation
3. **Éviter les bounces** : Vérifie que les adresses email sont valides avant d'envoyer
4. **Temps** : La réputation s'améliore généralement après 1-3 mois d'utilisation régulière

### Solution 3 : Vérifier les détails des bounces

Pour comprendre pourquoi `anne.fouilloux@laposte.net` a bounced :

1. Dans Resend, clique sur l'email "Bounced"
2. Regarde la section **Events** ou **Details**
3. Note la raison exacte (ex: `550 5.1.1 User unknown` ou `550 5.7.1 Message rejected`)
4. Cela t'aidera à comprendre si c'est :
   - L'adresse qui n'existe pas
   - Un problème de réputation
   - Un problème de configuration

### Solution 4 : Changer de région (Optionnel - Impact limité)

Si tu veux essayer une région plus proche de la France :

1. Dans Resend, tu peux créer un nouveau domaine dans une autre région
2. Cependant, l'impact sera probablement **minimal** car :
   - Resend utilise AWS SES qui a une bonne réputation mondiale
   - La région n'affecte pas vraiment la délivrabilité
   - Les fournisseurs français filtrent surtout sur la réputation, pas la région

## Cas spécifiques observés

### Cas 1 : Email "Bounced" - "Inbox is full" (`anne.fouilloux@laposte.net`)

**Statut** : `Bounced` avec le message **"Recipient's inbox is full"**

**⚠️ C'est probablement un FAUX BOUNCE !**

Si la boîte mail reçoit d'autres emails, ce n'est **pas vraiment pleine**. Les fournisseurs français (comme La Poste) utilisent souvent ce prétexte pour rejeter des emails qu'ils considèrent comme suspects.

**Pourquoi ce faux bounce ?**

1. **Pas de DMARC configuré** : Les insights Resend montrent "No DMARC record found"
2. **Utilisation de "noreply"** : Resend recommande d'éviter "noreply" car cela réduit la confiance
3. **Réputation faible** : Le domaine est nouveau (26 jours), La Poste est très strict
4. **Filtres anti-spam agressifs** : Les fournisseurs français filtrent plus strictement que Gmail

**Solutions immédiates** :

1. **✅ Configurer DMARC** (Priorité 1)
   - Ajoute l'enregistrement DMARC dans HostPapa (voir `CONFIGURATION_DMARC_DNS.md`)
   - Cela améliorera significativement la délivrabilité

2. **✅ Changer l'adresse d'expéditeur** (Priorité 2)
   - Au lieu de `noreply@pulse-event.ca`, utilise `hello@pulse-event.ca` ou `contact@pulse-event.ca`
   - Cela améliore la confiance et permet aux utilisateurs de répondre
   - Met à jour `EMAIL_FROM` dans Vercel

3. **⏳ Améliorer la réputation** (Long terme)
   - Continue à envoyer des emails régulièrement
   - La réputation s'améliore après 1-3 mois

**Comment vérifier** :
1. Dans Resend, clique sur l'email "Bounced"
2. Regarde la section **Events** ou **Details** pour voir le message exact
3. Si c'est "inbox is full" mais que la boîte reçoit d'autres emails → C'est un faux bounce (filtre anti-spam)

### Cas 2 : Email "Delivered" mais dans les spams (`jmfouilloux@noos.fr`)

**Statut** : `Delivered` (vert) signifie que le serveur email du destinataire a **accepté** l'email, mais il arrive dans les **indésirables/spam**.

**Causes principales** :
1. **Pas de DMARC configuré** : Les fournisseurs français vérifient DMARC strictement
2. **Utilisation de "noreply"** : Réduit la confiance et déclenche les filtres anti-spam
3. **Réputation faible** : Le domaine `pulse-event.ca` est nouveau (26 jours), Noos est très strict
4. **Filtres anti-spam agressifs** : Les fournisseurs français filtrent plus strictement que Gmail

**Solutions immédiates** :

1. **✅ Configurer DMARC** (Priorité 1)
   - Ajoute l'enregistrement DMARC dans HostPapa (voir `CONFIGURATION_DMARC_DNS.md`)
   - Impact immédiat sur la délivrabilité

2. **✅ Changer l'adresse d'expéditeur** (Priorité 2)
   - Change `noreply@pulse-event.ca` vers `hello@pulse-event.ca` (voir `CHANGER_ADRESSE_EXPEDITEUR.md`)
   - Met à jour `EMAIL_FROM` dans Vercel

3. **✅ Actions du destinataire** (Priorité 3)
   - Demande au destinataire de **marquer comme "Non spam"**
   - Demande d'**ajouter `hello@pulse-event.ca` aux contacts**
   - Cela apprend au filtre que tes emails sont légitimes

4. **⏳ Améliorer la réputation** (Long terme)
   - Continue à envoyer des emails régulièrement
   - La réputation s'améliore après 1-3 mois

**Guide complet** : Voir `EVITER_EMAILS_SPAM.md` pour toutes les solutions détaillées

## Vérification

### Vérifier les détails d'un email dans Resend

1. Va sur Resend > **Emails** (ou **Logs**)
2. Clique sur l'email en question
3. Regarde la section **Events** ou **Details** pour voir :
   - La raison exacte d'un bounce
   - Les événements de livraison
   - Les codes d'erreur SMTP

### Vérifier la configuration actuelle

1. **Dans Resend** :
   - Va sur **Domains** > `pulse-event.ca`
   - Vérifie que tous les enregistrements sont **Verified** (DKIM, SPF, MX)
   - Note si DMARC est configuré ou non

2. **Dans Vercel** :
   - Va dans **Project Settings** > **Environment Variables**
   - Vérifie que `EMAIL_FROM` utilise `noreply@pulse-event.ca` (ou similaire)

3. **Vérifier les logs Resend** :
   - Va sur Resend > **Emails** (ou **Logs**)
   - Clique sur les emails qui ont des problèmes
   - Regarde les détails pour comprendre la raison exacte

## Actions immédiates (Priorités)

### 🔴 Priorité 1 : Configurer DMARC

**Impact** : Améliore significativement la délivrabilité avec les fournisseurs français

1. Ajoute l'enregistrement DMARC dans **HostPapa** (voir `CONFIGURATION_DMARC_DNS.md`)
2. Attends 5-30 minutes pour la propagation
3. Vérifie dans Resend que DMARC est détecté

### 🟡 Priorité 2 : Changer l'adresse d'expéditeur

**Impact** : Améliore la confiance et réduit les faux bounces

1. Au lieu de `noreply@pulse-event.ca`, utilise :
   - `hello@pulse-event.ca` (recommandé)
   - `contact@pulse-event.ca`
   - `info@pulse-event.ca`

2. **Dans Vercel** :
   - Va dans **Project Settings** → **Environment Variables**
   - Modifie `EMAIL_FROM` :
     ```bash
     EMAIL_FROM="Pulse Montréal <hello@pulse-event.ca>"
     ```
   - Redéploie le projet

3. **Dans le code** (si nécessaire) :
   - Vérifie `src/lib/auth.ts` et `src/lib/email/resend.ts`
   - Assure-toi que l'adresse par défaut est mise à jour

### 🟢 Priorité 3 : Améliorer la réputation (Long terme)

- ⏳ Continue à envoyer des emails régulièrement
- ⏳ Surveille les taux de bounce et d'engagement
- ⏳ Après 1-3 mois, la délivrabilité devrait s'améliorer naturellement

## Références

- [Documentation Resend - Sandbox Domain](https://resend.com/docs/dashboard/domains/introduction)
- [Guide de configuration email](./docs/EMAIL_PROVIDER_SETUP.md)

