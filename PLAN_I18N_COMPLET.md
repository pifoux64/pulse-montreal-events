# 🌍 Plan d'Implémentation i18n Complet - Pulse Montréal

## Objectif
Ajouter le support multilingue complet (Français, Anglais, Espagnol) à tout le site Pulse.

---

## 📋 État Actuel

### ✅ Déjà en place
- `next-intl` installé et configuré
- Fichiers de traduction : `messages/fr.json`, `messages/en.json`
- Certains composants utilisent déjà `useTranslations()`
- Configuration i18n basique : `src/lib/i18n.ts`

### ❌ À faire
- Ajouter l'espagnol (es) aux locales
- Créer `messages/es.json` complet
- Mettre à jour le middleware pour gérer les routes multilingues
- Ajouter sélecteur de langue dans Navigation
- Traduire tous les textes manquants (onboarding, profil, etc.)
- Sauvegarder préférence langue dans UserPreferences

---

## 🚀 Implémentation

### Phase 1 : Configuration de base

1. **Mettre à jour `src/lib/i18n.ts`**
   - Ajouter `'es'` aux locales
   - Mettre à jour le type `Locale`

2. **Créer `messages/es.json`**
   - Traduire tous les textes depuis `fr.json` et `en.json`
   - S'assurer que toutes les clés sont présentes

3. **Mettre à jour `next.config.ts`**
   - Configurer next-intl pour les 3 langues
   - Routes : `/fr`, `/en`, `/es`

### Phase 2 : Middleware i18n

1. **Mettre à jour `src/middleware.ts`**
   - Intégrer `createMiddleware` de next-intl
   - Détecter la langue préférée (cookie, header Accept-Language, UserPreferences)
   - Rediriger vers la bonne locale si nécessaire
   - Conserver la logique onboarding existante

### Phase 3 : Sélecteur de langue

1. **Créer composant `LanguageSelector`**
   - Dropdown avec drapeaux/langues
   - Sauvegarder préférence dans UserPreferences
   - Mettre à jour cookie de locale

2. **Intégrer dans Navigation**
   - Ajouter le sélecteur dans le menu desktop et mobile

### Phase 4 : Traductions complètes

1. **Traduire onboarding**
   - Tous les textes de `src/app/onboarding/onboarding-client.tsx`
   - Options de sélection (genres, catégories, vibes)

2. **Traduire profil**
   - Tous les textes de `src/app/profil/profil-client.tsx`
   - Messages d'erreur et de succès

3. **Traduire autres pages**
   - Page "Pour toi"
   - Pages d'erreur
   - Footer
   - etc.

### Phase 5 : Sauvegarde préférence

1. **Mettre à jour UserPreferences**
   - Le champ `language` existe déjà (String @default("fr"))
   - Mettre à jour lors du changement de langue

2. **API route pour changer langue**
   - `PATCH /api/user/preferences/language`

---

## 📁 Structure des fichiers

```
messages/
  fr.json (existe)
  en.json (existe)
  es.json (à créer)

src/
  lib/
    i18n.ts (mettre à jour)
  middleware.ts (mettre à jour)
  components/
    LanguageSelector.tsx (nouveau)
  app/
    [locale]/ (structure next-intl)
      layout.tsx
      page.tsx
      ...
```

---

## 🔧 Configuration next-intl

### next.config.ts
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

export default withNextIntl({
  // ... config existante
});
```

### Structure des routes
- `/fr/*` - Français (défaut)
- `/en/*` - Anglais
- `/es/*` - Espagnol

---

## ✅ Checklist

### Phase 1
- [ ] Mettre à jour `src/lib/i18n.ts` avec 'es'
- [ ] Créer `messages/es.json` complet
- [ ] Mettre à jour `next.config.ts`

### Phase 2
- [ ] Mettre à jour middleware avec next-intl
- [ ] Tester détection automatique de langue
- [ ] Tester redirection vers locale

### Phase 3
- [ ] Créer composant LanguageSelector
- [ ] Intégrer dans Navigation
- [ ] Tester changement de langue

### Phase 4
- [ ] Traduire onboarding
- [ ] Traduire profil
- [ ] Traduire autres pages
- [ ] Vérifier tous les textes hardcodés

### Phase 5
- [ ] API route pour sauvegarder langue
- [ ] Mettre à jour UserPreferences
- [ ] Tester persistance

---

**Dernière mise à jour** : Janvier 2025

