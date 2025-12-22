# 🛡️ Comment éviter que les emails aillent en spam

## Problème

Les emails arrivent mais sont classés en **spam/indésirables** par les fournisseurs email (ex: Noos, La Poste, Gmail).

**Si TOUS les emails vont en spam**, voir le plan d'action complet : `PLAN_ACTION_DELIVRABILITE.md`

## Solutions (par ordre de priorité)

### 🔴 Priorité 1 : Configurer DMARC

**Impact** : ⭐⭐⭐⭐⭐ (Très élevé)

DMARC est l'un des facteurs les plus importants pour éviter les spams.

1. **Ajoute l'enregistrement DMARC dans HostPapa** (voir `CONFIGURATION_DMARC_DNS.md`)
2. **Attends 5-30 minutes** pour la propagation DNS
3. **Vérifie dans Resend** que DMARC est détecté

**Pourquoi c'est important ?**
- Les fournisseurs français (Noos, La Poste) vérifient DMARC strictement
- Sans DMARC, les emails sont plus susceptibles d'aller en spam
- DMARC améliore la réputation du domaine

### 🟡 Priorité 2 : Changer l'adresse d'expéditeur

**Impact** : ⭐⭐⭐⭐ (Élevé)

Évite `noreply` et utilise une adresse plus "humaine".

1. **Dans Vercel** → **Project Settings** → **Environment Variables**
2. Change `EMAIL_FROM` :
   ```bash
   EMAIL_FROM="Pulse Montréal <hello@pulse-event.ca>"
   ```
   Ou :
   ```bash
   EMAIL_FROM="Pulse Montréal <contact@pulse-event.ca>"
   ```
3. **Redéploie** le projet

**Pourquoi c'est important ?**
- `noreply` est souvent filtré par les anti-spam
- Une adresse "humaine" inspire plus confiance
- Permet aux utilisateurs de répondre (améliore l'engagement)

Voir le guide complet : `CHANGER_ADRESSE_EXPEDITEUR.md`

### 🟢 Priorité 3 : Améliorer le contenu de l'email

**Impact** : ⭐⭐⭐ (Moyen)

Le contenu de l'email peut déclencher les filtres anti-spam.

#### ✅ À faire :

1. **Éviter les mots déclencheurs de spam** :
   - ❌ "Gratuit", "Offre limitée", "Cliquez maintenant", "Urgent"
   - ✅ Utilise un langage naturel et professionnel

2. **Équilibrer texte et images** :
   - ❌ Email avec seulement des images
   - ✅ Mélange de texte et d'images (ratio 60/40)

3. **Inclure une version texte** :
   - ✅ Toujours inclure une version texte (`text`) en plus du HTML

4. **Éviter les liens suspects** :
   - ❌ URLs raccourcies (bit.ly, etc.)
   - ✅ URLs complètes et claires

5. **Inclure un lien de désinscription** (si applicable) :
   - ✅ Lien clair pour se désinscrire

#### 📝 Exemple de bon contenu :

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #10b981;">Connexion à Pulse Montréal</h1>
  <p>Bonjour,</p>
  <p>Vous avez demandé à vous connecter à votre compte Pulse Montréal.</p>
  <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
  <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Se connecter
  </a>
  <p style="color: #6b7280; font-size: 14px;">Ou copiez ce lien dans votre navigateur :</p>
  <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${url}</p>
  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
    Ce lien expire dans 24 heures.<br>
    Si vous n'avez pas demandé cette connexion, ignorez cet email.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #9ca3af; font-size: 11px;">
    Pulse Montréal - Votre guide des événements à Montréal<br>
    <a href="https://pulse-event.ca" style="color: #9ca3af;">pulse-event.ca</a>
  </p>
</div>
```

### 🟢 Priorité 4 : Actions du destinataire

**Impact** : ⭐⭐⭐⭐ (Élevé pour ce destinataire spécifique)

Demande au destinataire (`jmfouilloux@noos.fr`) de :

1. **Marquer comme "Non spam"** :
   - Ouvre l'email dans les indésirables
   - Clique sur "Non spam" ou "Marquer comme légitime"
   - Cela apprend au filtre que tes emails sont légitimes

2. **Ajouter à ses contacts** :
   - Ajoute `hello@pulse-event.ca` (ou l'adresse utilisée) à ses contacts
   - Cela garantit que les futurs emails arrivent en boîte de réception

3. **Créer une règle de filtrage** (si possible) :
   - Dans Noos, crée une règle pour mettre les emails de `pulse-event.ca` directement en boîte de réception

### 🟢 Priorité 5 : Vérifier la configuration technique

**Impact** : ⭐⭐⭐ (Moyen)

Assure-toi que tout est bien configuré :

1. **Dans Resend** → **Domains** → `pulse-event.ca` :
   - ✅ DKIM : **Verified**
   - ✅ SPF : **Verified**
   - ✅ MX : **Verified**
   - ⚠️ DMARC : À configurer (voir Priorité 1)

2. **Vérifier avec des outils en ligne** :
   - https://mxtoolbox.com/SuperTool.aspx
   - Tape `pulse-event.ca`
   - Vérifie que SPF, DKIM, DMARC sont bien configurés

### 🟢 Priorité 6 : Améliorer la réputation (Long terme)

**Impact** : ⭐⭐⭐⭐⭐ (Très élevé sur le long terme)

La réputation s'améliore avec le temps et l'utilisation :

1. **Envoi régulier** :
   - Continue à envoyer des emails (magic links, notifications)
   - Un envoi régulier et cohérent améliore la réputation

2. **Taux d'engagement** :
   - Plus les utilisateurs ouvrent/cliquent, meilleure la réputation
   - Encourage les utilisateurs à interagir avec tes emails

3. **Éviter les bounces** :
   - Vérifie que les adresses email sont valides avant d'envoyer
   - Supprime les adresses qui bounce régulièrement

4. **Temps** :
   - La réputation s'améliore généralement après **1-3 mois** d'utilisation régulière
   - Les fournisseurs français sont plus stricts avec les nouveaux domaines

## Checklist complète

### Actions immédiates (Aujourd'hui)

- [ ] Configurer DMARC dans HostPapa
- [ ] Changer `EMAIL_FROM` de `noreply` vers `hello` ou `contact`
- [ ] Redéployer le projet
- [ ] Demander au destinataire de marquer comme "Non spam"
- [ ] Demander au destinataire d'ajouter à ses contacts

### Actions à court terme (Cette semaine)

- [ ] Vérifier que SPF/DKIM/DMARC sont bien configurés avec un outil en ligne
- [ ] Améliorer le contenu des emails (éviter les mots déclencheurs)
- [ ] Tester l'envoi vers différentes adresses

### Actions à long terme (1-3 mois)

- [ ] Continuer à envoyer des emails régulièrement
- [ ] Surveiller les taux de bounce et d'engagement
- [ ] Ajuster la politique DMARC (passer de `p=none` à `p=quarantine` puis `p=reject`)

## Outils de vérification

### Vérifier la configuration DNS

1. **MXToolbox** : https://mxtoolbox.com/SuperTool.aspx
   - Tape `pulse-event.ca`
   - Vérifie SPF, DKIM, DMARC

2. **DMARC Analyzer** : https://www.dmarcanalyzer.com/
   - Analyse la configuration DMARC

3. **Mail-Tester** : https://www.mail-tester.com/
   - Envoie un email à l'adresse fournie
   - Obtiens un score de délivrabilité (0-10)
   - Recommandations pour améliorer

### Tester le contenu

1. **Mail-Tester** (mentionné ci-dessus)
   - Analyse aussi le contenu de l'email

2. **SpamAssassin** : https://spamassassin.apache.org/
   - Outil open-source pour tester le score de spam

## Résumé des actions prioritaires

1. **🔴 DMARC** : Configure DMARC dans HostPapa (5 minutes)
2. **🟡 Adresse** : Change `noreply` vers `hello` dans Vercel (2 minutes)
3. **🟢 Destinataire** : Demande de marquer comme "Non spam" et ajouter aux contacts
4. **🟢 Contenu** : Améliore le contenu des emails (évite les mots déclencheurs)
5. **🟢 Réputation** : Continue à envoyer régulièrement (1-3 mois)

## Résultat attendu

Après avoir appliqué ces solutions :
- ✅ Les emails devraient arriver en boîte de réception (pas en spam)
- ✅ La délivrabilité devrait s'améliorer progressivement
- ✅ Les fournisseurs français devraient faire plus confiance au domaine

**Temps estimé pour voir des résultats** :
- **Immédiat** : Après avoir configuré DMARC et changé l'adresse
- **1-2 semaines** : Amélioration notable avec les actions du destinataire
- **1-3 mois** : Réputation établie, délivrabilité optimale

