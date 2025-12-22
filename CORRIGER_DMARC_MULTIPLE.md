# 🔧 Corriger : Enregistrements DMARC multiples

## Problème détecté

Le test DMARC montre : **"DMARC Multiple Records"** ❌

Il y a **plusieurs enregistrements DMARC** pour `pulse-event.ca`, ce qui est une **erreur de configuration**. Il ne doit y avoir qu'**un seul** enregistrement DMARC.

## Impact

- ❌ Les fournisseurs email peuvent rejeter ou mettre en spam les emails
- ❌ Configuration DMARC invalide
- ❌ Peut causer des problèmes de délivrabilité

## Solution : Supprimer les doublons

### Étape 1 : Vérifier dans HostPapa

1. **Connecte-toi à HostPapa** : https://www.hostpapa.com
2. Va dans **Domain Manager** ou **DNS Management**
3. Sélectionne le domaine `pulse-event.ca`
4. Va dans **DNS Records** ou **Zone Editor**

### Étape 2 : Trouver tous les enregistrements DMARC

1. **Cherche tous les enregistrements de type `TXT`** avec le nom `_dmarc`
2. Tu devrais voir **plusieurs enregistrements** comme :
   - `_dmarc` → `v=DMARC1; p=none; rua=mailto:you@pulse-event.ca`
   - `_dmarc` → `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
   - Ou d'autres variantes

### Étape 3 : Supprimer tous les enregistrements DMARC existants

1. **Supprime TOUS les enregistrements DMARC** existants
2. Ne garde **aucun** enregistrement `_dmarc` pour l'instant
3. Sauvegarde

### Étape 4 : Ajouter UN SEUL enregistrement DMARC correct

1. **Ajoute un nouvel enregistrement** :
   - **Type** : `TXT`
   - **Name** : `_dmarc` (ou `_dmarc.pulse-event.ca` selon l'interface)
   - **Value** : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`
   - **TTL** : `3600` (ou Auto)

2. **Important** : 
   - Il ne doit y avoir qu'**UN SEUL** enregistrement DMARC
   - L'adresse `rua` doit être une vraie adresse email (pas `you@pulse-event.ca`)

### Étape 5 : Vérifier

1. **Attends 5-30 minutes** pour la propagation DNS
2. **Reteste avec MXToolbox** :
   - Va sur https://mxtoolbox.com/SuperTool.aspx
   - Tape `pulse-event.ca`
   - Clique sur **DMARC Lookup**
   - Le test "DMARC Multiple Records" devrait maintenant être ✅

## Correction de l'adresse RUA

L'adresse actuelle `you@pulse-event.ca` est un placeholder. Utilise une vraie adresse :

### Option 1 : Utiliser une adresse Gmail (Recommandé pour commencer)

```txt
v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca,mailto:pierrefouilloux59@gmail.com
```

Cela enverra les rapports DMARC à ton adresse Gmail.

### Option 2 : Créer une adresse dans HostPapa

1. **Dans HostPapa**, crée une adresse email `postmaster@pulse-event.ca`
2. Configure un forward vers une vraie boîte email (ex: `pierrefouilloux59@gmail.com`)
3. Utilise ensuite : `v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca`

### Option 3 : Utiliser plusieurs adresses

Tu peux spécifier plusieurs adresses séparées par des virgules :

```txt
v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca,mailto:pierrefouilloux59@gmail.com
```

## Enregistrement DMARC final recommandé

```txt
v=DMARC1; p=none; rua=mailto:postmaster@pulse-event.ca,mailto:pierrefouilloux59@gmail.com
```

**Explication** :
- `v=DMARC1` : Version du protocole
- `p=none` : Mode monitoring (ne bloque rien, juste surveillance)
- `rua=...` : Adresses pour recevoir les rapports DMARC (2 adresses pour être sûr de recevoir les rapports)

## Checklist de correction

- [ ] Connecté à HostPapa
- [ ] Trouvé tous les enregistrements `_dmarc` (il y en a plusieurs)
- [ ] **Supprimé TOUS** les enregistrements `_dmarc` existants
- [ ] Ajouté **UN SEUL** nouvel enregistrement DMARC avec la bonne valeur
- [ ] Attendu 5-30 minutes pour la propagation
- [ ] Retesté avec MXToolbox - "DMARC Multiple Records" devrait être ✅

## Vérification finale

Après correction, le test MXToolbox devrait montrer :

- ✅ **DMARC Record Published** : Trouvé
- ✅ **DMARC Syntax Check** : Valide
- ✅ **DMARC Multiple Records** : **PASS** (plus d'erreur !)
- ⚠️ **DMARC Policy Not Enabled** : Normal (on commence avec `p=none`)

## Prochaines étapes

Une fois que DMARC est correctement configuré :

1. **Attends 1-2 semaines** pour recevoir des rapports DMARC
2. **Analyse les rapports** pour voir si tout fonctionne bien
3. **Passe progressivement** à une politique plus stricte :
   - Après 2-4 semaines : `p=quarantine` (mettre en quarantaine les emails qui échouent)
   - Après 1-2 mois : `p=reject` (rejeter les emails qui échouent)

## Notes importantes

- ⚠️ **Ne garde qu'UN SEUL enregistrement DMARC**
- ✅ Utilise une vraie adresse email pour `rua` (pas `you@pulse-event.ca`)
- ✅ Commence avec `p=none` (monitoring uniquement)
- ⏳ La propagation DNS peut prendre jusqu'à 30 minutes

