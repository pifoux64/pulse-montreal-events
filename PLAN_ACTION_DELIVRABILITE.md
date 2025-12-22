# 🚨 Plan d'action immédiat : Emails en spam pour tout le monde

## Situation actuelle

✅ **DMARC configuré** (mais récent, besoin de temps pour prendre effet)
❌ **Tous les emails vont en spam** malgré DMARC
⚠️ **Adresse "noreply" toujours utilisée** (gros problème)
⚠️ **Domaine nouveau** (réputation faible)

## Actions immédiates (Aujourd'hui - Priorité absolue)

### 🔴 Action 1 : Changer l'adresse d'expéditeur (URGENT - 5 minutes)

**Impact** : ⭐⭐⭐⭐⭐ (Très élevé - peut résoudre 30-50% du problème)

L'adresse `noreply` est un **gros drapeau rouge** pour les filtres anti-spam.

1. **Dans Vercel** :
   - Va dans **Project Settings** → **Environment Variables**
   - Trouve `EMAIL_FROM`
   - Change de :
     ```bash
     EMAIL_FROM="Pulse Montréal <noreply@pulse-event.ca>"
     ```
     Vers :
     ```bash
     EMAIL_FROM="Pulse Montréal <hello@pulse-event.ca>"
     ```
   - **Important** : Assure-toi que c'est configuré pour **Production**, **Preview**, et **Development**
   - Sauvegarde

2. **Redéploie immédiatement** :
   - Va dans **Deployments**
   - Clique sur les trois points (⋯) du dernier déploiement
   - Sélectionne **Redeploy**

3. **Teste** :
   - Envoie un email de test
   - Vérifie que l'expéditeur est bien `hello@pulse-event.ca`

**Pourquoi c'est urgent ?**
- `noreply` est filtré par 80%+ des anti-spam
- C'est souvent la cause principale des emails en spam
- Impact immédiat après redéploiement

### 🟡 Action 2 : Demander aux utilisateurs de marquer comme "Non spam"

**Impact** : ⭐⭐⭐⭐ (Élevé - améliore la réputation)

Chaque fois qu'un utilisateur marque ton email comme "Non spam", cela apprend au filtre que tes emails sont légitimes.

**Actions à demander aux utilisateurs** :

1. **Marquer comme "Non spam"** :
   - Ouvrir l'email dans les indésirables
   - Clique sur "Non spam" / "Marquer comme légitime"
   - Cela apprend au filtre que tes emails sont légitimes

2. **Ajouter aux contacts** :
   - Ajouter `hello@pulse-event.ca` aux contacts
   - Garantit que les futurs emails arrivent en boîte de réception

3. **Créer une règle de filtrage** (si possible) :
   - Dans leur client email, créer une règle pour mettre les emails de `pulse-event.ca` directement en boîte de réception

**Comment communiquer** :
- Ajoute un message dans l'email : "Si cet email est dans vos indésirables, merci de le marquer comme 'Non spam'"
- Ou envoie un email séparé avec ces instructions

### 🟡 Action 3 : Améliorer le contenu de l'email

**Impact** : ⭐⭐⭐ (Moyen - peut aider)

Vérifie que le contenu de l'email ne déclenche pas les filtres.

**À vérifier** :

1. **Éviter les mots déclencheurs** :
   - ❌ "Gratuit", "Offre limitée", "Cliquez maintenant", "Urgent"
   - ✅ Langage naturel et professionnel

2. **Équilibrer texte et HTML** :
   - ✅ Mélange de texte et d'images (ratio 60/40)
   - ✅ Version texte (`text`) incluse

3. **Lien de désinscription** (si applicable) :
   - ✅ Lien clair pour se désinscrire

4. **Informations de contact** :
   - ✅ Adresse physique ou de contact
   - ✅ Lien vers le site web

### 🟢 Action 4 : Vérifier la configuration technique

**Impact** : ⭐⭐⭐ (Moyen - s'assurer que tout est OK)

1. **Dans Resend** → **Domains** → `pulse-event.ca` :
   - ✅ DKIM : **Verified**
   - ✅ SPF : **Verified**
   - ✅ MX : **Verified**
   - ✅ DMARC : **Verified** (vient d'être configuré)

2. **Vérifier avec MXToolbox** :
   - https://mxtoolbox.com/SuperTool.aspx
   - Tape `pulse-event.ca`
   - Vérifie que SPF, DKIM, DMARC sont tous ✅

## Actions à court terme (Cette semaine)

### 📅 Jour 1-2 : Attendre la propagation DMARC

- DMARC vient d'être configuré
- Il faut **24-48h** pour que les fournisseurs email prennent en compte DMARC
- La délivrabilité devrait s'améliorer progressivement

### 📅 Jour 3-7 : Surveiller et ajuster

1. **Surveiller les logs Resend** :
   - Va dans Resend → **Emails** (ou **Logs**)
   - Regarde les taux de bounce et de délivrabilité
   - Identifie les patterns

2. **Tester avec Mail-Tester** :
   - https://www.mail-tester.com/
   - Envoie un email à l'adresse fournie
   - Obtiens un score de délivrabilité (0-10)
   - Objectif : Score de 8/10 ou plus

3. **Demander aux utilisateurs de marquer comme "Non spam"** :
   - Continue à encourager les utilisateurs
   - Chaque action améliore la réputation

## Actions à long terme (1-3 mois)

### ⏳ Améliorer la réputation du domaine

La réputation s'améliore avec le temps et l'utilisation :

1. **Envoi régulier** :
   - Continue à envoyer des emails régulièrement
   - Un envoi cohérent améliore la réputation

2. **Taux d'engagement** :
   - Plus les utilisateurs ouvrent/cliquent, meilleure la réputation
   - Encourage l'interaction avec les emails

3. **Éviter les bounces** :
   - Vérifie que les adresses email sont valides
   - Supprime les adresses qui bounce régulièrement

4. **Temps** :
   - La réputation s'améliore généralement après **1-3 mois**
   - Les fournisseurs français sont plus stricts avec les nouveaux domaines

### 📊 Surveiller et ajuster DMARC

Après 2-4 semaines :

1. **Analyser les rapports DMARC** :
   - Vérifie que tout fonctionne bien
   - Identifie les problèmes éventuels

2. **Passer progressivement à une politique plus stricte** :
   - Après 2-4 semaines : `p=quarantine` (mettre en quarantaine)
   - Après 1-2 mois : `p=reject` (rejeter)

## Checklist complète

### Aujourd'hui (Urgent)

- [ ] **Changer `EMAIL_FROM` de `noreply` vers `hello` dans Vercel**
- [ ] **Redéployer le projet**
- [ ] **Tester que l'expéditeur est bien `hello@pulse-event.ca`**
- [ ] **Demander aux utilisateurs de marquer comme "Non spam"**
- [ ] **Vérifier la configuration technique (SPF/DKIM/DMARC)**

### Cette semaine

- [ ] Surveiller les logs Resend
- [ ] Tester avec Mail-Tester (objectif : 8/10)
- [ ] Continuer à encourager les utilisateurs à marquer comme "Non spam"
- [ ] Analyser les patterns de bounce

### Ce mois

- [ ] Continuer à envoyer régulièrement
- [ ] Surveiller l'amélioration de la réputation
- [ ] Analyser les rapports DMARC
- [ ] Ajuster la politique DMARC si nécessaire

## Résultat attendu

### Immédiat (Après changement d'adresse)

- ✅ Amélioration de 30-50% de la délivrabilité
- ✅ Moins d'emails en spam grâce à l'adresse "humaine"

### 24-48h (Propagation DMARC)

- ✅ Amélioration supplémentaire de 20-30%
- ✅ Les fournisseurs email prennent en compte DMARC

### 1-2 semaines (Actions utilisateurs)

- ✅ Amélioration continue grâce aux actions "Non spam"
- ✅ Réputation qui s'améliore progressivement

### 1-3 mois (Réputation établie)

- ✅ Délivrabilité optimale (80-90% en boîte de réception)
- ✅ Réputation du domaine établie
- ✅ Moins de problèmes avec les fournisseurs français

## Outils de monitoring

1. **Resend Logs** : https://resend.com/emails
   - Surveille les taux de bounce et de délivrabilité

2. **Mail-Tester** : https://www.mail-tester.com/
   - Teste le score de délivrabilité

3. **MXToolbox** : https://mxtoolbox.com/SuperTool.aspx
   - Vérifie la configuration DNS (SPF/DKIM/DMARC)

4. **DMARC Reports** : Vérifie ta boîte email pour les rapports DMARC

## Messages à communiquer aux utilisateurs

### Email de notification

```
Si cet email est dans vos indésirables, merci de :
1. Le marquer comme "Non spam" / "Légitime"
2. Ajouter hello@pulse-event.ca à vos contacts

Cela garantit que vous recevrez bien nos futurs emails.
```

### Page d'aide sur le site

Crée une page d'aide expliquant comment marquer les emails comme "Non spam" pour les différents clients email (Gmail, Outlook, etc.).

## Résumé des priorités

1. **🔴 URGENT** : Changer `noreply` → `hello` (5 minutes, impact immédiat)
2. **🟡 Important** : Demander aux utilisateurs de marquer comme "Non spam"
3. **🟡 Important** : Améliorer le contenu de l'email
4. **🟢 Long terme** : Améliorer la réputation (1-3 mois)

**L'action la plus importante est de changer l'adresse d'expéditeur maintenant !**

