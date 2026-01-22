# 🧪 Guide de Test Rapide

## 🚀 Démarrage rapide

### 1. Préparer l'environnement

```bash
# Installer les dépendances
npm install

# Vérifier les variables d'environnement
cat .env | grep -E "(DATABASE_URL|NEXTAUTH|STRIPE|OPENAI)"

# Générer le client Prisma
npx prisma generate

# Lancer le serveur
npm run dev
```

### 2. Lancer les tests automatisés

```bash
# Exécuter le script de test
./scripts/test-all-sprints.sh
```

### 3. Tests manuels par sprint

Suivez le plan détaillé dans `PLAN_TEST_COMPLET.md`

---

## 🎯 Tests essentiels (ordre recommandé)

### Phase 1 : Fondations (Sprints 0-2)
1. ✅ Créer un compte utilisateur
2. ✅ Créer un profil organisateur
3. ✅ Créer une salle
4. ✅ Vérifier la page publique de la salle
5. ✅ Créer un événement

### Phase 2 : Fonctionnalités métier (Sprints 3-5)
6. ✅ Demander une réservation de salle
7. ✅ Accepter/refuser une demande
8. ✅ Tester les outils IA (organisateur)
9. ✅ Tester les outils IA (salle)

### Phase 3 : Social (Sprint 6)
10. ✅ Suivre un utilisateur
11. ✅ Voir les événements des amis
12. ✅ Envoyer une invitation
13. ✅ Accepter une invitation

### Phase 4 : Monétisation (Sprint 7)
14. ✅ Voir les plans d'abonnement
15. ✅ S'abonner (test Stripe)
16. ✅ Vérifier l'abonnement actif

---

## 🔧 Outils de test

### 1. Prisma Studio
```bash
npx prisma studio
```
- Inspecter les données
- Vérifier les relations
- Tester les requêtes

### 2. Stripe Dashboard (mode test)
- https://dashboard.stripe.com/test
- Voir les paiements
- Tester les webhooks
- Cartes de test : `4242 4242 4242 4242`

### 3. DevTools navigateur
- Console : voir les erreurs JS
- Network : voir les requêtes API
- Application : voir le localStorage/sessionStorage

---

## 🐛 Dépannage rapide

### Erreur : "Prisma Client not generated"
```bash
npx prisma generate
```

### Erreur : "Database connection failed"
- Vérifier `DATABASE_URL` dans `.env`
- Vérifier que Supabase est accessible

### Erreur : "Stripe not configured"
- Vérifier `STRIPE_SECRET_KEY` dans `.env`
- Utiliser les clés de test Stripe

### Erreur : "OpenAI API error"
- Vérifier `OPENAI_API_KEY` dans `.env`
- Vérifier les crédits OpenAI

### Page blanche / Erreur 500
- Vérifier les logs du serveur (`npm run dev`)
- Vérifier la console navigateur
- Vérifier les logs Supabase

---

## 📊 Checklist de test

### Avant de commencer
- [ ] Serveur lancé (`npm run dev`)
- [ ] Base de données accessible
- [ ] Variables d'environnement configurées
- [ ] Au moins 2 comptes utilisateurs créés

### Après chaque sprint
- [ ] Fonctionnalités principales testées
- [ ] Erreurs identifiées et corrigées
- [ ] Performance acceptable
- [ ] Responsive vérifié

### Tests finaux
- [ ] Tous les sprints testés
- [ ] Pas d'erreurs critiques
- [ ] Documentation à jour
- [ ] Prêt pour la production

---

## 💡 Conseils

1. **Testez avec plusieurs comptes** : Créez au moins 2-3 comptes pour tester les interactions sociales
2. **Utilisez des données réalistes** : Cela aide à identifier les problèmes UX
3. **Testez les cas limites** : Champs vides, valeurs extrêmes, etc.
4. **Vérifiez les permissions** : Assurez-vous que les utilisateurs ne peuvent accéder qu'à leurs données
5. **Testez sur mobile** : Utilisez les DevTools pour simuler différents appareils

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs (serveur + navigateur)
2. Vérifiez `PLAN_TEST_COMPLET.md` pour les détails
3. Utilisez Prisma Studio pour inspecter la base de données
4. Vérifiez la configuration (`.env`, Stripe, OpenAI)
