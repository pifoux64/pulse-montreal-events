/**
 * Catégories principales de l'application Pulse
 * Utilisées partout dans l'app pour la classification des événements
 */

import { CATEGORY_LABELS, MAIN_CATEGORIES } from './tagging/taxonomy';
import { EventCategory } from '@/types';

/**
 * Catégories principales standardisées pour toute l'application
 */
export const MAIN_CATEGORIES_LIST: EventCategory[] = [
  {
    id: 'MUSIC',
    name: CATEGORY_LABELS.MUSIC.fr,
    nameEn: CATEGORY_LABELS.MUSIC.en,
    icon: CATEGORY_LABELS.MUSIC.icon,
    color: CATEGORY_LABELS.MUSIC.color,
    subCategories: [
      { id: 'MUSIC-1', name: 'Reggae', nameEn: 'Reggae', categoryId: 'MUSIC' },
      { id: 'MUSIC-2', name: 'Dub', nameEn: 'Dub', categoryId: 'MUSIC' },
      { id: 'MUSIC-3', name: 'Hip-hop', nameEn: 'Hip-hop', categoryId: 'MUSIC' },
      { id: 'MUSIC-4', name: 'Rock', nameEn: 'Rock', categoryId: 'MUSIC' },
      { id: 'MUSIC-5', name: 'Jazz', nameEn: 'Jazz', categoryId: 'MUSIC' },
      { id: 'MUSIC-6', name: 'Électronique', nameEn: 'Electronic', categoryId: 'MUSIC' },
      { id: 'MUSIC-7', name: 'Pop', nameEn: 'Pop', categoryId: 'MUSIC' },
      { id: 'MUSIC-8', name: 'R&B / Soul', nameEn: 'R&B / Soul', categoryId: 'MUSIC' },
      { id: 'MUSIC-9', name: 'Latin', nameEn: 'Latin', categoryId: 'MUSIC' },
      { id: 'MUSIC-10', name: 'Afrobeat', nameEn: 'Afrobeat', categoryId: 'MUSIC' },
    ],
  },
  {
    id: 'ART_CULTURE',
    name: CATEGORY_LABELS.ART_CULTURE.fr,
    nameEn: CATEGORY_LABELS.ART_CULTURE.en,
    icon: CATEGORY_LABELS.ART_CULTURE.icon,
    color: CATEGORY_LABELS.ART_CULTURE.color,
    subCategories: [
      { id: 'ART_CULTURE-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: 'ART_CULTURE' },
      { id: 'ART_CULTURE-2', name: 'Théâtre', nameEn: 'Theater', categoryId: 'ART_CULTURE' },
      { id: 'ART_CULTURE-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: 'ART_CULTURE' },
      { id: 'ART_CULTURE-4', name: 'Danse', nameEn: 'Dance', categoryId: 'ART_CULTURE' },
      { id: 'ART_CULTURE-5', name: 'Photographie', nameEn: 'Photography', categoryId: 'ART_CULTURE' },
    ],
  },
  {
    id: 'SPORT',
    name: CATEGORY_LABELS.SPORT.fr,
    nameEn: CATEGORY_LABELS.SPORT.en,
    icon: CATEGORY_LABELS.SPORT.icon,
    color: CATEGORY_LABELS.SPORT.color,
    subCategories: [
      { id: 'SPORT-1', name: 'Football', nameEn: 'Soccer', categoryId: 'SPORT' },
      { id: 'SPORT-2', name: 'Basketball', nameEn: 'Basketball', categoryId: 'SPORT' },
      { id: 'SPORT-3', name: 'Hockey', nameEn: 'Hockey', categoryId: 'SPORT' },
      { id: 'SPORT-4', name: 'Course', nameEn: 'Running', categoryId: 'SPORT' },
      { id: 'SPORT-5', name: 'Fitness', nameEn: 'Fitness', categoryId: 'SPORT' },
    ],
  },
  {
    id: 'FAMILY',
    name: CATEGORY_LABELS.FAMILY.fr,
    nameEn: CATEGORY_LABELS.FAMILY.en,
    icon: CATEGORY_LABELS.FAMILY.icon,
    color: CATEGORY_LABELS.FAMILY.color,
    subCategories: [
      { id: 'FAMILY-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: 'FAMILY' },
      { id: 'FAMILY-2', name: 'Parcs', nameEn: 'Parks', categoryId: 'FAMILY' },
      { id: 'FAMILY-3', name: 'Ateliers créatifs', nameEn: 'Creative workshops', categoryId: 'FAMILY' },
      { id: 'FAMILY-4', name: 'Spectacles enfants', nameEn: 'Kids shows', categoryId: 'FAMILY' },
    ],
  },
];

/**
 * Mapping des catégories vers leurs valeurs Prisma/DB
 */
export const CATEGORY_TO_DB_MAP: Record<string, string> = {
  MUSIC: 'MUSIC',
  ART_CULTURE: 'ARTS',
  SPORT: 'SPORTS',
  FAMILY: 'FAMILY',
};

/**
 * Mapping inverse (DB → Catégorie principale)
 */
export const DB_TO_CATEGORY_MAP: Record<string, string> = {
  MUSIC: 'MUSIC',
  ARTS: 'ART_CULTURE',
  SPORTS: 'SPORT',
  FAMILY: 'FAMILY',
  'ART & CULTURE': 'ART_CULTURE',
  'Art & Culture': 'ART_CULTURE',
};

/**
 * Vérifie si une catégorie est une catégorie principale valide
 */
export function isMainCategory(category: string): boolean {
  return MAIN_CATEGORIES.includes(category as any);
}

/**
 * Normalise une catégorie vers une catégorie principale
 */
export function normalizeToMainCategory(category: string): string | null {
  const upper = category.toUpperCase();
  if (isMainCategory(upper)) return upper;
  return DB_TO_CATEGORY_MAP[upper] || DB_TO_CATEGORY_MAP[category] || null;
}

