# 📧 Configuration DMARC pour pulse-event.ca

## Où ajouter les enregistrements DNS ?

Cela dépend de **qui gère les DNS** de ton domaine. Voici comment le déterminer :

### 🔍 Comment vérifier qui gère les DNS ?

1. **Dans Vercel** :
   - Va dans **Settings** → **Domains** → `pulse-event.ca`
   - Regarde la section **DNS Records** ou **Configuration**
   - Si tu vois un bouton **"Edit DNS Records"** ou **"Manage DNS"**, alors **Vercel gère les DNS**
   - Si tu vois juste des instructions à suivre ailleurs, alors **HostPapa gère les DNS**

2. **Dans HostPapa** :
   - Va dans **Domain Manager** ou **DNS Management**
   - Si tu peux voir et modifier les enregistrements DNS, alors **HostPapa gère les DNS**

### 📍 Scénario 1 : Vercel gère les DNS (Nameservers de Vercel)

Si tu as changé les nameservers pour pointer vers Vercel :

**✅ Ajoute les enregistrements dans VERCEL** :

1. Va dans Vercel → **Settings** → **Domains** → `pulse-event.ca`
2. Clique sur **"Edit DNS Records"** ou **"Manage DNS"**
3. Ajoute l'enregistrement DMARC :
   - **Type** : `TXT`
   - **Name** : `_dmarc`
   - **Value** : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
   - **TTL** : Auto (ou 3600)

### 📍 Scénario 2 : HostPapa gère les DNS (Nameservers de HostPapa)

Si les nameservers pointent toujours vers HostPapa :

**✅ Ajoute les enregistrements dans HOSTPAPA** :

1. Connecte-toi à HostPapa : https://www.hostpapa.com
2. Va dans **Domain Manager** ou **DNS Management**
3. Sélectionne le domaine `pulse-event.ca`
4. Va dans **DNS Records** ou **Zone Editor**
5. Ajoute un nouvel enregistrement :
   - **Type** : `TXT`
   - **Name** : `_dmarc` (ou `_dmarc.pulse-event.ca` selon l'interface)
   - **Value** : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
   - **TTL** : 3600 (ou Auto)

💡 **Note HostPapa** : Si l'interface demande un nom complet, utilise `_dmarc.pulse-event.ca`. Sinon, utilise juste `_dmarc`.

## 📋 Enregistrement DMARC à ajouter

Quel que soit l'endroit où tu ajoutes l'enregistrement, utilise ces valeurs :

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca
TTL: Auto (ou 3600)
```

### Explication des valeurs :

- **`v=DMARC1`** : Version du protocole DMARC
- **`p=none`** : Politique en mode monitoring (ne bloque rien, juste surveillance)
- **`rua=mailto:postmaster@pulse-event.ca`** : Adresse pour recevoir les rapports DMARC

⚠️ **Important** : Commence avec `p=none` (monitoring uniquement). Une fois que tout fonctionne bien, tu peux passer à `p=quarantine` puis `p=reject`.

## ✅ Vérification

Après avoir ajouté l'enregistrement :

1. **Attends 5-30 minutes** pour la propagation DNS
2. **Vérifie dans Resend** :
   - Va dans Resend → **Domains** → `pulse-event.ca`
   - Regarde la section **DMARC**
   - Le statut devrait passer à **Verified** une fois détecté
3. **Vérifie avec un outil en ligne** :
   - Va sur https://mxtoolbox.com/dmarc.aspx
   - Tape `pulse-event.ca`
   - Tu devrais voir l'enregistrement DMARC

## 🔄 Autres enregistrements DNS pour Resend

Si tu dois aussi ajouter d'autres enregistrements pour Resend (SPF, DKIM, MX), ajoute-les **au même endroit** que DMARC :

- Si Vercel gère les DNS → Ajoute tout dans Vercel
- Si HostPapa gère les DNS → Ajoute tout dans HostPapa

⚠️ **Important** : Ne mélange pas ! Si Vercel gère les DNS, n'ajoute rien dans HostPapa (et vice versa).

## ✅ Confirmation pour pulse-event.ca

**Nameservers actuels** : `ns1.hostpapa.com` et `ns2.hostpapa.com`

➡️ **HostPapa gère les DNS** → Ajoute tous les enregistrements DNS dans **HostPapa**

## 📝 Instructions spécifiques pour HostPapa

### Étape 1 : Se connecter à HostPapa

1. Va sur https://www.hostpapa.com
2. Connecte-toi à ton compte
3. Accède au **Domain Manager** ou **DNS Management**

### Étape 2 : Trouver la zone DNS

1. Sélectionne le domaine `pulse-event.ca`
2. Va dans **DNS Records** ou **Zone Editor**

### Étape 3 : Ajouter l'enregistrement DMARC

1. Clique sur **"Add Record"** ou **"Add DNS Record"**
2. Remplis les champs :
   - **Type** : `TXT`
   - **Name** : `_dmarc` (ou `_dmarc.pulse-event.ca` si l'interface le demande)
   - **Value** : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
   - **TTL** : `3600` (ou Auto si disponible)
3. Clique sur **Save** ou **Add Record**

### Étape 4 : Vérifier

1. Attends 5-30 minutes pour la propagation DNS
2. Vérifie dans Resend → **Domains** → `pulse-event.ca` → Section **DMARC**
3. Le statut devrait passer à **Verified** une fois détecté

## 🆘 Besoin d'aide ?

Si tu as des difficultés dans HostPapa :
- Contacte le support HostPapa : https://www.hostpapa.com/support
- Ou vérifie leur documentation sur la gestion DNS

