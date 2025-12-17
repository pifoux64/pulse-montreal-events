/**
 * Validateurs pour chaque plateforme
 * 
 * Valide qu'un événement contient tous les champs requis
 * et que les valeurs sont dans les formats acceptés par chaque plateforme
 */

import { UniversalEvent } from './universalEventSchema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide un événement pour Facebook
 */
export function validateForFacebook(event: UniversalEvent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Champs requis
  if (!event.title || event.title.length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }
  if (event.title && event.title.length > 75) {
    errors.push('Le titre ne doit pas dépasser 75 caractères pour Facebook');
  }
  
  if (!event.description || event.description.length < 10) {
    errors.push('La description doit contenir au moins 10 caractères');
  }
  
  if (!event.startDate) {
    errors.push('La date de début est requise');
  } else {
    // Facebook n'accepte pas les événements dans le passé
    if (event.startDate < new Date()) {
      errors.push('La date de début ne peut pas être dans le passé');
    }
  }
  
  if (!event.venue.name) {
    errors.push('Le nom du lieu est requis');
  }
  
  if (!event.venue.coordinates) {
    errors.push('Les coordonnées GPS sont requises pour Facebook');
  }
  
  // Avertissements
  if (!event.coverImageUrl) {
    warnings.push('Une image de couverture est recommandée pour Facebook');
  }
  
  if (!event.longDescription && event.description.length < 100) {
    warnings.push('Une description plus longue améliorerait la visibilité sur Facebook');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide un événement pour Eventbrite
 */
export function validateForEventbrite(event: UniversalEvent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Champs requis
  if (!event.title || event.title.length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }
  if (event.title && event.title.length > 140) {
    errors.push('Le titre ne doit pas dépasser 140 caractères pour Eventbrite');
  }
  
  if (!event.description || event.description.length < 10) {
    errors.push('La description doit contenir au moins 10 caractères');
  }
  
  if (!event.startDate) {
    errors.push('La date de début est requise');
  }
  
  if (!event.venue.name) {
    errors.push('Le nom du lieu est requis');
  }
  
  if (!event.venue.address) {
    errors.push('L\'adresse complète est requise pour Eventbrite');
  }
  
  if (!event.venue.city) {
    errors.push('La ville est requise pour Eventbrite');
  }
  
  // Avertissements
  if (!event.ticketUrl && !event.isFree) {
    warnings.push('Un lien de billetterie est recommandé pour les événements payants');
  }
  
  if (!event.priceMin && !event.isFree) {
    warnings.push('Le prix minimum devrait être renseigné');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide un événement pour Resident Advisor
 */
export function validateForResidentAdvisor(event: UniversalEvent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Champs requis
  if (!event.title) {
    errors.push('Le titre est requis');
  }
  
  if (!event.startDate) {
    errors.push('La date de début est requise');
  }
  
  if (!event.venue.name) {
    errors.push('Le nom du lieu est requis');
  }
  
  if (!event.lineup || event.lineup.length === 0) {
    errors.push('Le lineup (au moins un artiste) est requis pour Resident Advisor');
  }
  
  if (!event.genres || event.genres.length === 0) {
    errors.push('Au moins un genre musical est requis pour Resident Advisor');
  }
  
  // Avertissements
  if (!event.description) {
    warnings.push('Une description est recommandée');
  }
  
  if (!event.ticketUrl) {
    warnings.push('Un lien de billetterie est recommandé');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide un événement pour Bandsintown
 */
export function validateForBandsintown(event: UniversalEvent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Champs requis
  if (!event.title) {
    errors.push('Le titre est requis');
  }
  
  if (!event.startDate) {
    errors.push('La date de début est requise');
  }
  
  if (!event.venue.name) {
    errors.push('Le nom du lieu est requis');
  }
  
  if (!event.lineup || event.lineup.length === 0) {
    errors.push('Le lineup (au moins un artiste) est requis pour Bandsintown');
  }
  
  // Avertissements
  if (!event.venue.coordinates) {
    warnings.push('Les coordonnées GPS sont recommandées pour Bandsintown');
  }
  
  if (!event.ticketUrl) {
    warnings.push('Un lien de billetterie est recommandé');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide un événement pour toutes les plateformes
 */
export function validateForAllPlatforms(event: UniversalEvent): Record<string, ValidationResult> {
  return {
    facebook: validateForFacebook(event),
    eventbrite: validateForEventbrite(event),
    resident_advisor: validateForResidentAdvisor(event),
    bandsintown: validateForBandsintown(event),
  };
}

