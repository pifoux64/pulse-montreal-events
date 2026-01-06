/**
 * Connecteur Open Data Montréal - Squelette pour future implémentation
 * 
 * TODO: Implémenter la récupération d'événements depuis les données ouvertes de Montréal
 * 
 * Sources potentielles:
 * - Données ouvertes de la Ville de Montréal
 * - API Quartier des spectacles (si disponible)
 * - Autres sources de données publiques
 */

import { IngestionSource, IngestionResult } from './types';
import { EventSource } from '@prisma/client';
import { createIngestionResult } from './sources';

/**
 * Source d'ingestion pour Open Data Montréal
 * 
 * ⚠️ À IMPLÉMENTER
 * 
 * Cette source est préparée pour intégrer les données ouvertes de Montréal.
 * L'implémentation nécessitera:
 * - Identification des endpoints API ou fichiers de données
 * - Mapping des données vers UnifiedEvent
 * - Gestion de la pagination si nécessaire
 */
export const openDataMontrealSource: IngestionSource = {
  name: 'Open Data Montréal',
  source: EventSource.MTL_OPEN_DATA,
  enabled: false, // Désactivé jusqu'à implémentation

  async run(): Promise<IngestionResult> {
    const startedAt = new Date();
    
    // TODO: Implémenter la logique d'ingestion
    // 1. Récupérer les données depuis l'API/fichier
    // 2. Parser les événements
    // 3. Mapper vers UnifiedEvent
    // 4. Utiliser l'orchestrateur pour créer/mettre à jour les événements
    
    console.warn('⚠️ Open Data Montréal source not yet implemented');
    
    return createIngestionResult(
      EventSource.MTL_OPEN_DATA,
      startedAt,
      {
        nbCreated: 0,
        nbUpdated: 0,
        nbSkipped: 0,
        nbErrors: 0,
        errors: ['Source Open Data Montréal non implémentée'],
      }
    );
  },
};

















