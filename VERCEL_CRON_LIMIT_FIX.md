# 🔧 Fix Limite Cron Jobs Vercel (Plan Hobby)

## ⚠️ Problème

Vercel Plan Hobby a une limite stricte :
- **2 cron jobs maximum**
- **1 déclenchement par jour maximum** (pas toutes les heures)

Tu avais configuré **5 cron jobs**, ce qui causait l'échec du déploiement.

## ✅ Solution Implémentée

J'ai consolidé les 5 cron jobs en **2 cron jobs** qui respectent la limite Hobby :

### 1. `/api/cron/daily` - Tâches Quotidiennes
**Déclenchement :** Tous les jours à 2h du matin

**Tâches combinées :**
- ✅ Ingestion complète de toutes les sources d'événements
- ✅ Recalcul des profils de goûts utilisateurs
- ✅ Envoi du digest hebdomadaire (seulement le lundi)

### 2. `/api/cron/hourly` - Tâches Horaire
**Déclenchement :** Toutes les heures (mais limité à 1x/jour sur Hobby)

**Tâches combinées :**
- ✅ Vérification des nouveaux événements
- ✅ Envoi des notifications personnalisées
- ✅ Notifications push

## 📋 Anciens Cron Jobs (Supprimés)

Les anciens endpoints sont toujours disponibles mais ne sont plus dans `vercel.json` :
- `/api/cron/ingest` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/ingestion` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/personalized-notifications` → Fonctionnalité intégrée dans `/api/cron/hourly`
- `/api/cron/recompute-taste-profiles` → Fonctionnalité intégrée dans `/api/cron/daily`
- `/api/cron/weekly-digest` → Fonctionnalité intégrée dans `/api/cron/daily`

## 🚀 Déploiement

Après ce changement, le déploiement Vercel devrait réussir car on respecte maintenant la limite de 2 cron jobs.

## 💡 Alternative : Upgrade vers Pro

Si tu as besoin de plus de flexibilité :
- **Plan Pro** : 40 cron jobs, invocations illimitées
- **Plan Enterprise** : 100 cron jobs, invocations illimitées

Avec le plan Pro, tu pourrais avoir :
- Ingestion toutes les 2 heures
- Notifications toutes les heures
- Recalcul des profils toutes les nuits
- Digest hebdomadaire le lundi

## 📝 Notes

- Les endpoints individuels restent disponibles pour déclenchement manuel via le dashboard admin
- Le CRON horaire ne se déclenchera qu'**une fois par jour** sur le plan Hobby (limitation Vercel)
- Pour plus de fréquence, utilise le dashboard admin pour déclencher manuellement

