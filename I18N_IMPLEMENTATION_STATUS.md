# 🌍 Statut d'Implémentation i18n - Pulse Montréal

## ✅ Ce qui a été fait

### 1. Configuration de base
- ✅ Ajout de l'espagnol (es) aux locales dans `src/lib/i18n.ts`
- ✅ Création de `messages/es.json` avec toutes les traductions
- ✅ Mise à jour de `next.config.ts` avec le plugin next-intl
- ✅ Ajout des traductions manquantes dans `messages/fr.json` et `messages/en.json` :
  - Section `onboarding` (tous les textes)
  - Section `pourToi` (page "Pour toi")
  - Section `language` (sélecteur de langue)

### 2. Composant sélecteur de langue
- ✅ Création de `src/components/LanguageSelector.tsx`
  - Dropdown avec drapeaux et noms de langues
  - Sauvegarde dans le cookie `NEXT_LOCALE`
  - Sauvegarde dans UserPreferences via API
  - Rechargement de la page pour appliquer la langue

### 3. Intégration dans Navigation
- ✅ Ajout du sélecteur dans le menu desktop
- ✅ Ajout du sélecteur dans le menu mobile

### 4. API pour sauvegarder la langue
- ✅ Création de `src/app/api/user/preferences/language/route.ts`
  - PATCH pour mettre à jour la langue préférée
  - Validation de la langue (fr, en, es)
  - Sauvegarde dans UserPreferences.language

---

## ⚠️ Ce qui reste à faire

### 1. Utiliser les traductions dans les composants

#### Onboarding (`src/app/onboarding/onboarding-client.tsx`)
- [ ] Remplacer les textes hardcodés par `useTranslations('onboarding')`
- [ ] Traduire les labels des genres musicaux
- [ ] Traduire les labels des catégories d'événements
- [ ] Traduire les labels des vibes
- [ ] Traduire les messages d'erreur

#### Page "Pour toi" (`src/app/pour-toi/page.tsx`)
- [ ] Utiliser `useTranslations('pourToi')` pour tous les textes

#### Autres composants
- [ ] Vérifier tous les composants pour les textes hardcodés
- [ ] Remplacer par des traductions

### 2. Middleware pour détection automatique

Actuellement, le middleware ne détecte pas automatiquement la langue. Il faudrait :

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { locales, defaultLocale } from '@/lib/i18n';

export async function middleware(request: NextRequest) {
  // Détecter la langue depuis :
  // 1. Cookie NEXT_LOCALE
  // 2. UserPreferences.language (si connecté)
  // 3. Header Accept-Language
  // 4. defaultLocale (fr)
  
  // ... logique de détection ...
  
  // Conserver la logique onboarding existante
  // ...
}
```

### 3. Structure des routes avec [locale] (optionnel)

Pour une implémentation complète next-intl, il faudrait restructurer :

```
src/app/
  [locale]/
    layout.tsx
    page.tsx
    onboarding/
    profil/
    ...
```

Cela nécessiterait de :
- Déplacer toutes les pages dans `[locale]/`
- Mettre à jour tous les liens pour inclure la locale
- Mettre à jour le middleware pour gérer les routes

**Note** : Cette restructuration est optionnelle. La solution actuelle fonctionne avec la structure existante.

---

## 📝 Comment utiliser les traductions

### Dans un composant client

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('onboarding');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('step1.title')}</p>
    </div>
  );
}
```

### Dans un composant serveur

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('home');
  
  return <h1>{t('title')}</h1>;
}
```

---

## 🔧 Configuration actuelle

### Langues supportées
- `fr` (Français) - Langue par défaut
- `en` (English)
- `es` (Español)

### Fichiers de traduction
- `messages/fr.json` - Français
- `messages/en.json` - Anglais
- `messages/es.json` - Espagnol

### Cookie de langue
- Nom : `NEXT_LOCALE`
- Durée : 1 an
- Path : `/`

### Base de données
- Champ : `UserPreferences.language` (String, default: "fr")
- Sauvegarde automatique lors du changement de langue

---

## 🚀 Prochaines étapes recommandées

1. **Tester le sélecteur de langue**
   - Vérifier que le changement de langue fonctionne
   - Vérifier que la préférence est sauvegardée

2. **Traduire l'onboarding**
   - Remplacer tous les textes hardcodés
   - Tester avec les 3 langues

3. **Traduire la page "Pour toi"**
   - Utiliser les traductions créées

4. **Mettre à jour le middleware** (optionnel)
   - Détection automatique de la langue
   - Redirection vers la bonne locale

5. **Vérifier tous les composants**
   - Identifier les textes hardcodés
   - Les remplacer par des traductions

---

**Dernière mise à jour** : Janvier 2025

