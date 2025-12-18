# 🔧 Fix : Page d'accueil brisée - https://pulse-event.ca/

**Date** : Décembre 2025  
**Problème** : Le site affichait uniquement "Chargement de Pulse Montréal..." et ne se chargeait pas

---

## 🐛 Problème Identifié

Le site https://pulse-event.ca/ affichait uniquement le message "Chargement de Pulse Montréal..." (le fallback du Suspense) et ne se chargeait jamais.

### Causes Probables

1. **`useSearchParams()` sans Suspense boundary correct**
   - `HomePage` utilisait `useSearchParams()` directement
   - Next.js 13+ nécessite que `useSearchParams()` soit dans un Suspense boundary
   - Le composant restait bloqué sur le fallback

2. **Import `Image` manquant**
   - `HomePage` utilisait `<Image>` de Next.js sans l'importer
   - Cela causait une erreur JavaScript côté client

---

## ✅ Solution Implémentée

### 1. Création de `HomePageContent` wrapper

Création d'un composant wrapper qui gère `useSearchParams()` dans un Suspense boundary :

```typescript
// src/components/HomePageContent.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HomePage from './HomePage';

function HomePageWithSearchParams() {
  const searchParams = useSearchParams();
  return <HomePage searchParams={searchParams} />;
}

export default function HomePageContent() {
  return (
    <Suspense fallback={...}>
      <HomePageWithSearchParams />
    </Suspense>
  );
}
```

### 2. Modification de `HomePage`

- `HomePage` accepte maintenant `searchParams` en props (requis)
- Suppression de l'utilisation directe de `useSearchParams()`
- Ajout de l'import `Image` manquant

### 3. Mise à jour de `src/app/page.tsx`

- Utilisation de `HomePageContent` au lieu de `HomePage` directement
- Double Suspense boundary pour gérer correctement `useSearchParams`

---

## 📝 Fichiers Modifiés

1. **`src/components/HomePageContent.tsx`** (nouveau)
   - Wrapper pour gérer `useSearchParams()` dans Suspense

2. **`src/components/HomePage.tsx`**
   - Accepte `searchParams` en props
   - Suppression de `useSearchParams()` direct
   - Ajout import `Image`

3. **`src/app/page.tsx`**
   - Utilise `HomePageContent` au lieu de `HomePage`
   - Fallback amélioré avec spinner

---

## 🧪 Tests

- ✅ Build passe sans erreurs
- ✅ Aucune erreur de lint
- ✅ Structure Suspense correcte

---

## 🚀 Déploiement

Les changements ont été commités et pushés. Vercel devrait redéployer automatiquement.

**Commits** :
- `3c0579d` - fix: Correction finale HomePage - searchParams requis en props
- `266fa55` - fix: Correction chargement page d'accueil - useSearchParams dans Suspense

---

## 🔍 Vérification Post-Déploiement

Après le déploiement sur Vercel, vérifier :

1. **Console navigateur** : Aucune erreur JavaScript
2. **Network tab** : Les requêtes API se chargent correctement
3. **Page d'accueil** : Affiche le contenu au lieu du fallback
4. **Navigation** : Les autres pages fonctionnent

---

## 📚 Références

- [Next.js useSearchParams Documentation](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js Suspense Boundaries](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

---

**Dernière mise à jour** : Décembre 2025

