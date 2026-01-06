# ✅ Checklist de Conformité Spotify - Pulse

Cette checklist permet de vérifier que l'application est prête pour la soumission de review Spotify.

---

## 🔐 Scopes

- [x] **Scope minimal** : Uniquement `user-top-read`
- [x] **Justification claire** : Documentée dans REVIEW_PACKAGE.md
- [x] **Pas de scopes inutiles** : `user-read-email` et `user-read-private` retirés
- [x] **Code vérifié** : `src/lib/music-services/spotify.ts` utilise uniquement `user-top-read`

---

## 📄 Privacy Policy

- [x] **Section Spotify complète** : Ajoutée dans `/politique-confidentialite`
- [x] **Données collectées** : Top artists, genres dérivés expliqués
- [x] **Utilisation** : Recommandations personnalisées expliquées
- [x] **Conservation** : Tant que compte connecté, suppression possible
- [x] **Partage** : Aucun partage avec tiers explicité
- [x] **Droits utilisateur** : Déconnexion, suppression, désactivation expliqués
- [x] **URL accessible** : https://pulse-event.ca/politique-confidentialite
- [x] **Date de mise à jour** : Affichée sur la page

---

## 📋 Terms of Service

- [x] **CGU à jour** : Page `/cgu` existe et est accessible
- [x] **URL accessible** : https://pulse-event.ca/cgu
- [x] **Section intégrations** : Optionnel, peut être ajoutée si nécessaire

---

## ⚙️ Configuration Technique

- [x] **Redirect URIs corrects** : 
  - Production : `https://pulse-event.ca/api/integrations/spotify/callback`
  - Development : `http://localhost:3000/api/integrations/spotify/callback`
- [x] **Variables d'environnement** :
  - `SPOTIFY_CLIENT_ID` configuré
  - `SPOTIFY_CLIENT_SECRET` configuré
  - `SPOTIFY_REDIRECT_URI` configuré
  - `ENCRYPTION_KEY` configuré
- [x] **Tokens chiffrés** : Module `src/lib/encryption.ts` créé et utilisé
- [x] **Refresh automatique** : Fonction `getValidAccessToken()` implémentée

---

## 🔒 Sécurité

- [x] **Chiffrement tokens** : `accessToken` et `refreshToken` chiffrés avant stockage
- [x] **Pas d'exposition** : Tokens jamais exposés dans les réponses API
- [x] **Refresh automatique** : Tokens rafraîchis automatiquement si < 5 min restantes
- [x] **Gestion d'erreurs** : Erreurs gérées sans exposer d'informations sensibles

---

## 👤 Fonctionnalités Utilisateur

- [x] **Disconnect flow** : Endpoint `/api/integrations/spotify/disconnect` fonctionne
- [x] **Delete data flow** : Option pour supprimer les données Spotify dérivées
- [x] **Toggle personnalisation** : API `/api/user/preferences/personalization` fonctionne
- [x] **Explications claires** : Section privacy dans `/profil` avec détails
- [x] **UI intuitive** : Modal de déconnexion avec options claires

---

## 📸 Screenshots

- [ ] **Screenshot 1** : Écran de connexion Spotify (`01-connect-screen.png`)
- [ ] **Screenshot 2** : Modal OAuth Spotify (`02-oauth-modal.png`)
- [ ] **Screenshot 3** : Genres détectés (`03-detected-genres.png`)
- [ ] **Screenshot 4** : Recommandations "Pour toi" (`04-for-you-recommendations.png`)
- [ ] **Screenshot 5** : Contrôles privacy (`05-privacy-controls.png`)

**Instructions** : Voir `SCREENSHOTS_INSTRUCTIONS.md`

---

## 📝 Documentation

- [x] **Review Package** : `REVIEW_PACKAGE.md` créé avec toutes les informations
- [x] **Instructions screenshots** : `SCREENSHOTS_INSTRUCTIONS.md` créé
- [x] **Checklist conformité** : Ce document
- [x] **Setup guide** : `SPOTIFY_SETUP.md` créé
- [x] **Guide production** : `SPOTIFY_PASSER_EN_PRODUCTION.md` créé

---

## 🧪 Tests

- [ ] **Test connexion** : Un utilisateur peut se connecter à Spotify
- [ ] **Test synchronisation** : La synchronisation des goûts fonctionne
- [ ] **Test recommandations** : Les recommandations utilisent les genres Spotify
- [ ] **Test disconnect** : La déconnexion fonctionne (disconnect only)
- [ ] **Test delete data** : La suppression des données fonctionne
- [ ] **Test toggle** : Le toggle de personnalisation fonctionne
- [ ] **Test en production** : Tester sur https://pulse-event.ca

---

## 🚀 Prêt pour Soumission

Une fois tous les éléments cochés :

1. **Vérifier les screenshots** : Tous les screenshots sont pris et sauvegardés
2. **Relire REVIEW_PACKAGE.md** : S'assurer que toutes les informations sont correctes
3. **Tester en production** : Vérifier que tout fonctionne sur https://pulse-event.ca
4. **Soumettre la review** : Suivre les étapes dans `REVIEW_PACKAGE.md`

---

## 📞 Support

Si un élément n'est pas coché :

- **Scopes** : Vérifier `src/lib/music-services/spotify.ts`
- **Privacy Policy** : Vérifier `src/app/politique-confidentialite/page.tsx`
- **Sécurité** : Vérifier `src/lib/encryption.ts` et `src/lib/music-services/spotify.ts`
- **Fonctionnalités** : Tester manuellement sur https://pulse-event.ca

---

**Dernière mise à jour** : Janvier 2025

