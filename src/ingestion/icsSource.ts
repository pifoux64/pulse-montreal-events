/**
 * Connecteur ICS (iCalendar) générique - Squelette pour future implémentation
 * 
 * Permet d'importer des événements depuis des fichiers/URLs ICS
 * 
 * Exemples d'utilisation:
 * - Calendriers publics (Google Calendar, Outlook)
 * - Exports de calendriers d'organisations
 * - Feeds ICS d'événements récurrents
 */

import { IngestionSource, IngestionResult } from './types';
import { EventSource } from '@prisma/client';
import { createIngestionResult } from './sources';
// TODO: Importer node-ical pour parser les fichiers ICS
// import ical from 'node-ical';

/**
 * Configuration pour une source ICS
 */
export interface ICSConfig {
  url: string;
  name: string;
  source?: EventSource; // Peut utiliser un EventSource dédié ou INTERNAL
}

/**
 * Source d'ingestion ICS générique
 * 
 * ⚠️ À IMPLÉMENTER
 * 
 * Cette source permettra d'importer des événements depuis des fichiers/URLs ICS.
 * L'implémentation nécessitera:
 * - Parser le fichier ICS avec node-ical
 * - Extraire les événements (VEVENT)
 * - Mapper vers UnifiedEvent
 * - Gérer les événements récurrents (RRULE)
 * - Gérer les mises à jour (SEQUENCE)
 */
export function createICSSource(config: ICSConfig): IngestionSource {
  return {
    name: config.name || 'ICS Calendar',
    source: config.source || EventSource.INTERNAL,
    enabled: false, // À activer après configuration

    async run(): Promise<IngestionResult> {
      const startedAt = new Date();
      
      // TODO: Implémenter la logique d'ingestion
      // 1. Récupérer le fichier ICS depuis l'URL
      // 2. Parser avec node-ical
      // 3. Extraire les événements (VEVENT)
      // 4. Mapper vers UnifiedEvent
      // 5. Utiliser l'orchestrateur pour créer/mettre à jour
      
      console.warn(`⚠️ ICS source "${config.name}" not yet implemented`);
      console.warn(`   URL: ${config.url}`);
      
      return createIngestionResult(
        config.source || EventSource.INTERNAL,
        startedAt,
        {
          nbCreated: 0,
          nbUpdated: 0,
          nbSkipped: 0,
          nbErrors: 0,
          errors: [`Source ICS "${config.name}" non implémentée`],
        }
      );
    },
  };
}

/**
 * Exemple de configuration ICS
 * 
 * Utilisation:
 * ```typescript
 * const calendarSource = createICSSource({
 *   url: 'https://example.com/calendar.ics',
 *   name: 'Calendrier Événements Montréal',
 * });
 * ```
 */
export const exampleICSSource = createICSSource({
  url: 'https://example.com/calendar.ics',
  name: 'Calendrier exemple',
});















