# 🔧 Fix Limite Cron Jobs Vercel (Plan Hobby)

## ⚠️ Problème

D'après la [documentation officielle Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing), le plan Hobby a des limites strictes :
- **2 cron jobs maximum par compte**
- **1 déclenchement par jour maximum** (même avec un schedule horaire comme `"0 * * * *"`)

Tu avais configuré **5 cron jobs**, puis réduit à **2 cron jobs** avec un schedule horaire, mais Vercel rejette les schedules horaires sur le plan Hobby car ils ne peuvent se déclencher qu'une fois par jour.

## ✅ Solution Finale

J'ai consolidé **tout en 1 seul cron job quotidien** qui respecte la limite Hobby :

### `/api/cron/daily` - Toutes les Tâches Quotidiennes
**Déclenchement :** Tous les jours à 2h du matin (`"0 2 * * *"`)

**Tâches combinées :**
- ✅ Ingestion complète de toutes les sources d'événements
- ✅ Recalcul des profils de goûts utilisateurs
- ✅ Envoi du digest hebdomadaire (seulement le lundi)
- ✅ Vérification des nouveaux événements des dernières 24h et envoi de notifications

## 📋 Anciens Cron Jobs (Supprimés)

Les anciens endpoints sont toujours disponibles mais ne sont plus dans `vercel.json` :
- `/api/cron/ingest` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/ingestion` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/personalized-notifications` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/recompute-taste-profiles` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/weekly-digest` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/hourly` → Fonctionnalité intégrée dans `/api/cron/daily`

## 🚀 Déploiement

Avec **1 seul cron job** avec un schedule quotidien, le déploiement Vercel devrait maintenant réussir.

## 💡 Alternative : Upgrade vers Pro

Si tu as besoin de plus de flexibilité :
- **Plan Pro** : 40 cron jobs, **invocations illimitées**
- **Plan Enterprise** : 100 cron jobs, **invocations illimitées**

Avec le plan Pro, tu pourrais avoir :
- Ingestion toutes les 2 heures (`"0 */2 * * *"`)
- Notifications toutes les heures (`"0 * * * *"`)
- Recalcul des profils toutes les nuits (`"0 2 * * *"`)
- Digest hebdomadaire le lundi (`"0 10 * * 1"`)

## 📝 Notes Importantes

- **Sur le plan Hobby** : Les cron jobs ne peuvent se déclencher qu'**une fois par jour maximum**, même avec un schedule horaire
- Les endpoints individuels restent disponibles pour déclenchement manuel via le dashboard admin
- Pour plus de fréquence, utilise le dashboard admin (`/admin/ingestion`) pour déclencher manuellement
- Les notifications vérifient maintenant les événements des **dernières 24h** au lieu de la dernière heure

## 🔍 Référence

- [Documentation Vercel - Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
