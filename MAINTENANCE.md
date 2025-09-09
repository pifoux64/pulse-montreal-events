# 🛠️ Guide de Maintenance - Pulse Montreal

## 🚀 Site en Production
- **URL**: https://pulse-montreal-events.vercel.app (à confirmer)
- **GitHub**: https://github.com/pifoux64/pulse-montreal-events
- **Vercel**: https://vercel.com/pifoux64s-projects/pulse-montreal-events

## 🔄 Workflow de Développement

### Faire des Modifications
```bash
# 1. Modifier le code localement
# 2. Tester en local
npm run dev

# 3. Commiter et pousser
git add .
git commit -m "✨ Description des changements"
git push origin main

# 4. Vercel déploie automatiquement !
```

### Vérifier le Déploiement
- ✅ Check build logs dans Vercel dashboard
- ✅ Test API: https://ton-site.vercel.app/api/events-simple
- ✅ Test carte: https://ton-site.vercel.app/carte

## 📊 Monitoring

### APIs à Surveiller
- **Events API**: `/api/events-simple` (472+ événements)
- **Ticketmaster**: Token valide et limite pas atteinte
- **Ingestion CRON**: Toutes les 2h automatiquement

### Métriques Importantes
- **Nombre d'événements**: ~472 (varie selon disponibilité)
- **Sources actives**: 3 (Ticketmaster, Meetup, Ville MTL)
- **Performance**: Core Web Vitals dans Vercel

## 🔧 Maintenance Courante

### Hebdomadaire
- [ ] Vérifier le nombre d'événements
- [ ] Tester les principales fonctionnalités
- [ ] Check les logs Vercel pour erreurs

### Mensuelle  
- [ ] Vérifier les tokens API (expiration)
- [ ] Review des performances
- [ ] Mise à jour des dépendances si nécessaire

### Urgences
- **Site down**: Check Vercel status et logs
- **API errors**: Vérifier tokens et variables d'env
- **0 événements**: Problème ingestion, check logs CRON

## 🆕 Ajout de Fonctionnalités

### Nouvelles Sources d'Événements
1. Ajouter connecteur dans `src/ingestors/`
2. Mettre à jour `src/app/api/events-simple/route.ts`
3. Ajouter variables d'env sur Vercel
4. Tester et déployer

### Améliorations UI
1. Modifier composants dans `src/components/`
2. Tester responsive design
3. Push et auto-deploy

## 🔐 Sécurité

### Variables d'Environnement
- **TICKETMASTER_API_KEY**: À renouveler si nécessaire
- **NEXTAUTH_SECRET**: Ne jamais exposer
- **Database tokens**: Sécurisés sur Vercel

### Monitoring
- Vercel fournit monitoring gratuit
- Logs en temps réel disponibles
- Alertes automatiques si problème

## 📈 Évolutions Futures

### Court Terme
- [ ] Réactiver Eventbrite (nouveau endpoint)
- [ ] Ajouter plus de genres musicaux
- [ ] Améliorer filtres avancés

### Moyen Terme  
- [ ] Authentification utilisateur
- [ ] Système de favoris persistant
- [ ] Notifications push

### Long Terme
- [ ] App mobile (PWA)
- [ ] Partenariats avec organisateurs
- [ ] Monétisation (promotions payantes)

## 🆘 Support

### Problèmes Courants
- **Build failed**: Check package.json et dépendances
- **API timeout**: Réduire le nombre de requêtes
- **Images cassées**: Vérifier URLs et fallbacks

### Contacts
- **Vercel Support**: https://vercel.com/help
- **GitHub Issues**: Dans ton repository
- **Documentation**: README.md et guides dans /docs

---

🎉 **Pulse Montreal est maintenant un projet professionnel en production !**
