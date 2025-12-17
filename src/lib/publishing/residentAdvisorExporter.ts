/**
 * Resident Advisor Exporter
 * 
 * Module pour exporter des événements au format Resident Advisor
 * Note: RA n'a pas d'API publique, donc on génère un fichier JSON/CSV
 */

import { UniversalEvent } from './universalEventSchema';
import { validateForResidentAdvisor } from './validators';

export interface RAEventFormat {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venue: string;
  address?: string;
  city: string;
  lineup: string[]; // Liste d'artistes
  genre: string; // Genre principal
  genres?: string[]; // Genres multiples
  description: string;
  ticket_url?: string;
  image_url?: string;
  age_restriction?: string;
}

/**
 * Convertit un événement en format Resident Advisor
 */
export function exportToRAFormat(event: UniversalEvent): RAEventFormat {
  // Valider l'événement
  const validation = validateForResidentAdvisor(event);
  if (!validation.valid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  // Extraire la date et l'heure
  const startDate = new Date(event.startDate);
  const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = startDate.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: event.timezone,
  });
  
  // Genre principal (premier genre de la liste)
  const mainGenre = event.genres?.[0] || 'electronic';
  
  return {
    title: event.title,
    date: dateStr,
    time: timeStr,
    venue: event.venue.name,
    address: event.venue.address,
    city: event.venue.city || 'Montréal',
    lineup: event.lineup || [],
    genre: mainGenre.toLowerCase(),
    genres: event.genres?.map(g => g.toLowerCase()),
    description: event.description,
    ticket_url: event.ticketUrl,
    image_url: event.coverImageUrl,
    age_restriction: event.ageRestriction,
  };
}

/**
 * Génère un fichier JSON au format RA
 */
export function generateRAJSON(events: UniversalEvent[]): string {
  const raEvents = events.map(exportToRAFormat);
  return JSON.stringify(raEvents, null, 2);
}

/**
 * Génère un fichier CSV au format RA
 */
export function generateRACSV(events: UniversalEvent[]): string {
  const raEvents = events.map(exportToRAFormat);
  
  // En-têtes CSV
  const headers = [
    'Title',
    'Date',
    'Time',
    'Venue',
    'Address',
    'City',
    'Lineup',
    'Genre',
    'Genres',
    'Description',
    'Ticket URL',
    'Image URL',
    'Age Restriction',
  ];
  
  // Lignes de données
  const rows = raEvents.map(event => [
    event.title,
    event.date,
    event.time,
    event.venue,
    event.address || '',
    event.city,
    event.lineup.join('; '), // Séparateur pour liste
    event.genre,
    event.genres?.join('; ') || '',
    event.description.replace(/"/g, '""'), // Échapper les guillemets
    event.ticket_url || '',
    event.image_url || '',
    event.age_restriction || '',
  ]);
  
  // Générer le CSV
  const csvRows = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ];
  
  return csvRows.join('\n');
}

/**
 * Génère un fichier texte formaté pour copier-coller dans RA
 */
export function generateRAText(events: UniversalEvent[]): string {
  return events.map(event => {
    const ra = exportToRAFormat(event);
    return `
${ra.title}
${ra.date} ${ra.time}
${ra.venue}${ra.address ? `, ${ra.address}` : ''}, ${ra.city}
Lineup: ${ra.lineup.join(', ')}
Genre: ${ra.genre}${ra.genres && ra.genres.length > 1 ? ` (${ra.genres.join(', ')})` : ''}
${ra.description}
${ra.ticket_url ? `Tickets: ${ra.ticket_url}` : ''}
${ra.age_restriction ? `Age: ${ra.age_restriction}` : ''}
---
`;
  }).join('\n');
}

