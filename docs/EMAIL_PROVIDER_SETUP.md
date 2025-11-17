# 📧 Configuration Email avec Resend et Vercel

Ce guide explique comment configurer l'envoi de mails pour NextAuth (magic links) en utilisant [Resend](https://resend.com) et un domaine géré par Vercel.

---

## 1. Préparer Resend

1. Crée un compte Resend si ce n'est pas déjà fait.
2. Dans le dashboard Resend, va dans **Domains** et clique sur **Add Domain**.
3. Saisis ton domaine (ex: `pulse-mtl.ca`) puis valide.

Resend fournit immédiatement les entrées DNS à ajouter (SPF, DKIM, DMARC optionnel).

---

## 2. Ajouter les enregistrements DNS dans Vercel

Tu as deux scénarios possibles :

### Cas A — Domaine personnalisé déjà enregistré

1. Dans Vercel, ouvre ton projet > **Settings** > **Domains**.
2. Sélectionne ton domaine (ex: `pulse-mtl.ca`) puis clique sur **Edit DNS Records**.
3. Ajoute les enregistrements fournis par Resend :

### SPF (type `TXT`)

| Champ | Valeur |
| --- | --- |
| Name | `@` |
| Value | `v=spf1 include:resend.dev ~all` |

### DKIM (type `TXT`)

Resend génère un nom d'hôte (ex: `resend._domainkey`) et une valeur. Copie-les tels quels.

### DMARC (type `TXT`, optionnel mais recommandé)

| Champ | Valeur |
| --- | --- |
| Name | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:postmaster@pulse-mtl.ca` |

Les changements DNS peuvent prendre jusqu'à 24 h pour se propager, mais Vercel/Resend affichent généralement le statut en quelques minutes.

💡 DMARC te permet de recevoir des rapports sur l'utilisation de ton domaine. Tu peux ajuster la politique (`p=none/quarantine/reject`) plus tard.

### Cas B — Aucun domaine personnalisé (sous-domaine Vercel uniquement)

Resend n'autorise pas les domaines publics gratuits (`*.vercel.app`, `*.gmail.com`, etc.). Si tu tentes d'ajouter `pulse-mtl.vercel.app`, tu verras l'erreur “We don't allow free public domains. Please use a domain you own instead.”  

Tu as donc deux options :

1. **Acheter un domaine** (ex: `pulse-mtl.ca`) via Vercel, un registrar (Namecheap, Gandi, etc.) ou même Google Domains. Ensuite, ajoute-le dans Vercel (Project settings → Domains) et suis le **Cas A** ci-dessus pour créer les enregistrements DNS.
2. **Utiliser le “Sandbox Domain” de Resend** uniquement pour des tests. Resend fournit un domaine partagé (`@resend.dev`) qui permet d'envoyer des emails vers des adresses autorisées (whitelist). Va dans Resend → **Domains** → **Create domain** → **Sandbox domain** et suis leurs instructions. Attention : ce domaine ne convient pas pour la production (limité en volume, branding inexistant, certains providers filtrent ces emails).

Tant que tu n'as pas de domaine à toi, tu ne pourras pas envoyer d'emails en production avec Resend. Cela vaut pour tout provider SMTP sérieux (Postmark, Sendgrid, etc.) : il faut un domaine authentifié pour garantir la délivrabilité.

---

## 3. Vérifier le domaine dans Resend

Une fois les DNS propagés :

1. Retourne sur Resend > **Domains**.
2. Ton domaine affichera **Verified** lorsque SPF & DKIM sont détectés.
3. Tu peux maintenant envoyer des emails depuis `noreply@pulse-mtl.ca` (ou l'adresse désirée sur ce domaine).

---

## 4. Configurer NextAuth pour les magic links

Resend propose un accès SMTP (Beta) pratique pour NextAuth. Ajoute ces variables dans `.env.local` :

```bash
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_resend_api_key
EMAIL_SERVER_PASSWORD=your_resend_api_key
EMAIL_FROM="Pulse Montréal <noreply@pulse-mtl.ca>"
```

### Notes importantes

- Génère une `API Key` Resend (section **API Keys**) et utilise-la comme user & password SMTP.
- Le port `587` fonctionne en STARTTLS (`secure: false` côté NextAuth).
- Assure-toi que `EMAIL_FROM` utilise une adresse du domaine vérifié.

---

## 5. Tester en local

1. Redémarre ton serveur : `npm run dev`
2. Va sur `http://localhost:3000/auth/signin`
3. Choisis la connexion par email, saisis ton adresse → tu dois recevoir un magic link provenant de Resend

Si tu ne reçois pas l'email :
- Vérifie la console côté serveur pour détecter des erreurs SMTP.
- Confirme que le domaine est bien **Verified** dans Resend.
- Assure-toi que l'email n'est pas dans les spams.

---

## 6. Déployer sur Vercel

Pour la production :

1. Dans Vercel > **Project Settings** > **Environment Variables**, ajoute les mêmes variables (`EMAIL_SERVER_*`, `EMAIL_FROM`).
2. Ajoute également `NEXTAUTH_URL=https://ton-domaine.vercel.app` si ce n'est pas déjà fait.
3. Sur Resend, ajoute l'adresse `https://ton-domaine.vercel.app` à la liste des **Allowed Origins** si tu utilises l'API HTTP (optionnel pour SMTP).

---

## 7. Aller plus loin

- **Suivi des envois** : Resend > **Logs** permet de vérifier chaque email envoyé.
- **Politique DMARC** : Une fois sûr que tout fonctionne, change `p=none` vers `quarantine` ou `reject` pour protéger le domaine.
- **Alias d'envoi** : Configure d'autres adresses `support@`, `events@` si besoin dans Resend.

---

✨ Tu as maintenant un provider email fiable pour NextAuth, avec un domaine propre (`noreply@pulse-mtl.ca`). N'hésite pas à demander si tu veux automatiser l'envoi de tests ou intégrer un design d'email personnalisé.

