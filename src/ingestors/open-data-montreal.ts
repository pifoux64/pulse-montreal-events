/**
 * Connecteur Open Data Montréal pour Pulse Montreal
 * Récupère les événements depuis les données ouvertes de la Ville de Montréal
 * 
 * Documentation : https://donnees.montreal.ca/
 */

import { BaseConnector, UnifiedEvent } from './base';
import { EventSource, EventCategory, EventLanguage, EventStatus } from '@prisma/client';

/**
 * Interface pour un événement brut depuis Open Data Montréal
 * Format peut varier selon le dataset utilisé
 */
interface OpenDataMTLEvent {
  id?: string;
  title?: string;
  nom?: string; // Alternative pour title
  description?: string;
  description_fr?: string;
  description_en?: string;
  date_debut?: string;
  date_fin?: string;
  start_date?: string;
  end_date?: string;
  lieu?: string;
  venue?: string;
  adresse?: string;
  address?: string;
  arrondissement?: string;
  borough?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lon?: number | string;
  categorie?: string;
  category?: string;
  type?: string;
  gratuit?: boolean | string;
  free?: boolean | string;
  prix?: string;
  price?: string;
  url?: string;
  lien?: string;
  image?: string;
  image_url?: string;
  [key: string]: any; // Permettre d'autres champs
}

/**
 * Connecteur pour Open Data Montréal
 * 
 * ⚠️ CONFIGURATION REQUISE :
 * 
 * Pour utiliser ce connecteur, vous devez identifier un dataset d'événements sur donnees.montreal.ca
 * et configurer l'URL dans les variables d'environnement :
 * 
 * OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json
 * 
 * Ou pour un fichier CSV :
 * OPEN_DATA_MONTREAL_URL=https://donnees.montreal.ca/dataset/XXXX/resource/XXXX/download/events.csv
 * 
 * Exemples de datasets potentiels :
 * - Événements culturels
 * - Festivals
 * - Activités publiques
 * - Événements communautaires
 */
export class OpenDataMontrealConnector extends BaseConnector {
  private readonly dataUrl?: string;

  constructor(dataUrl?: string) {
    super(EventSource.MTL_OPEN_DATA, undefined, '', 2); // 2 secondes entre requêtes
    this.dataUrl = dataUrl || process.env.OPEN_DATA_MONTREAL_URL;
  }

  /**
   * Récupère les événements depuis une date donnée
   */
  async listUpdatedSince(since: Date, limit: number = 100): Promise<OpenDataMTLEvent[]> {
    if (!this.dataUrl) {
      console.warn('⚠️ OPEN_DATA_MONTREAL_URL non configuré - aucun événement récupéré');
      console.warn('   Configurez OPEN_DATA_MONTREAL_URL dans vos variables d\'environnement');
      console.warn('   Exemple: https://donnees.montreal.ca/api/views/XXXX-XXXX/rows.json');
      return [];
    }

    console.log('🏛️ Récupération des événements depuis Open Data Montréal...');
    console.log(`   URL: ${this.dataUrl}`);

    try {
      const response = await fetch(this.dataUrl, {
        headers: {
          'User-Agent': 'Pulse-Montreal/1.0',
          'Accept': 'application/json, text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`Open Data Montréal API error ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let events: OpenDataMTLEvent[] = [];

      if (contentType.includes('application/json')) {
        const data = await response.json();
        
        // Format Socrata (JSON avec meta)
        if (data.meta && data.data) {
          // Extraire les noms de colonnes depuis meta.view.columns
          const columns = data.meta.view.columns.map((col: any) => col.name);
          events = data.data.map((row: any[]) => {
            const event: any = {};
            row.forEach((value, index) => {
              const columnName = columns[index];
              if (columnName) {
                event[columnName] = value;
              }
            });
            return event;
          });
        } 
        // Format JSON simple (tableau d'objets)
        else if (Array.isArray(data)) {
          events = data;
        }
        // Format JSON avec clé 'data'
        else if (data.data && Array.isArray(data.data)) {
          events = data.data;
        }
        else {
          console.warn('⚠️ Format JSON non reconnu pour Open Data Montréal');
          return [];
        }
      } 
      else if (contentType.includes('text/csv') || this.dataUrl.endsWith('.csv')) {
        // Parser CSV (basique - peut être amélioré avec une librairie)
        const csvText = await response.text();
        events = this.parseCSV(csvText);
      }
      else {
        console.warn(`⚠️ Format non supporté: ${contentType}`);
        return [];
      }

      // Filtrer les événements futurs
      const now = new Date();
      const futureEvents = events.filter((event) => {
        const eventDate = this.extractDate(event);
        return eventDate && eventDate >= now;
      });

      console.log(`✅ Open Data Montréal: ${futureEvents.length} événements futurs récupérés (${events.length} total)`);
      
      return futureEvents.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération Open Data Montréal:', error.message);
      return [];
    }
  }

  /**
   * Mappe un événement Open Data MTL vers le format unifié
   */
  async mapToUnifiedEvent(rawEvent: OpenDataMTLEvent): Promise<UnifiedEvent> {
    const title = rawEvent.title || rawEvent.nom || 'Événement Montréal';
    const description = rawEvent.description || rawEvent.description_fr || rawEvent.description_en || '';
    
    const startDate = this.extractDate(rawEvent);
    if (!startDate) {
      throw new Error('Open Data Montréal event missing start date');
    }

    const endDate = this.extractEndDate(rawEvent) || this.estimateEndTime(startDate);

    // Coordonnées géographiques
    let lat = this.parseNumber(rawEvent.latitude || rawEvent.lat);
    let lon = this.parseNumber(rawEvent.longitude || rawEvent.lon);

    // Si pas de coordonnées, géocoder l'adresse
    const address = rawEvent.adresse || rawEvent.address || rawEvent.lieu || rawEvent.venue || '';
    if ((!lat || !lon) && address) {
      const coords = await this.geocodeAddress(address, 'Montréal');
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    // Parser le prix
    const priceInfo = this.parsePrice(rawEvent.prix || rawEvent.price || '');

    // Détecter si gratuit
    const isFree = rawEvent.gratuit === true || rawEvent.gratuit === 'true' || 
                   rawEvent.free === true || rawEvent.free === 'true' ||
                   priceInfo.min === 0;

    return {
      sourceId: rawEvent.id || `${rawEvent.title || rawEvent.nom}-${startDate.toISOString()}`,
      source: EventSource.MTL_OPEN_DATA,
      title,
      description,
      startAt: startDate,
      endAt: endDate,
      timezone: 'America/Montreal',
      venue: {
        name: rawEvent.lieu || rawEvent.venue || 'Montréal',
        address: address || 'Montréal',
        city: 'Montréal',
        postalCode: '',
        lat: lat || 45.5088,
        lon: lon || -73.5673,
        neighborhood: rawEvent.arrondissement || rawEvent.borough,
      },
      url: rawEvent.url || rawEvent.lien,
      priceMin: isFree ? 0 : priceInfo.min,
      priceMax: isFree ? 0 : priceInfo.max,
      currency: 'CAD',
      language: this.detectLanguage(title, description),
      imageUrl: rawEvent.image || rawEvent.image_url,
      tags: this.generateTags(title, rawEvent.categorie || rawEvent.category || rawEvent.type, rawEvent.arrondissement || rawEvent.borough),
      category: this.mapCategory(rawEvent.categorie || rawEvent.category || rawEvent.type || ''),
      subcategory: rawEvent.categorie || rawEvent.category || rawEvent.type,
      accessibility: [],
      ageRestriction: undefined,
    };
  }

  /**
   * Extrait la date de début depuis un événement
   */
  private extractDate(event: OpenDataMTLEvent): Date | null {
    const dateStr = event.date_debut || event.start_date || event.date || event.start;
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  }

  /**
   * Extrait la date de fin depuis un événement
   */
  private extractEndDate(event: OpenDataMTLEvent): Date | null {
    const dateStr = event.date_fin || event.end_date || event.end;
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  }

  /**
   * Estime l'heure de fin
   */
  private estimateEndTime(startTime: Date): Date {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // 2 heures par défaut
    return endTime;
  }

  /**
   * Parse un nombre depuis une string
   */
  private parseNumber(value: number | string | undefined): number | undefined {
    if (typeof value === 'number') return value;
    if (!value) return undefined;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parse le prix depuis une string
   */
  private parsePrice(priceStr: string): { min?: number; max?: number; currency: string } {
    if (!priceStr) return { currency: 'CAD' };

    // Chercher des nombres dans la string
    const numbers = priceStr.match(/\d+\.?\d*/g);
    if (!numbers || numbers.length === 0) {
      return { currency: 'CAD' };
    }

    const prices = numbers.map(n => parseFloat(n) * 100); // Convertir en cents
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      min: min === max ? min : min,
      max: min === max ? undefined : max,
      currency: 'CAD',
    };
  }

  /**
   * Parse CSV basique (peut être amélioré avec une librairie)
   */
  private parseCSV(csvText: string): OpenDataMTLEvent[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const events: OpenDataMTLEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const event: any = {};
      headers.forEach((header, index) => {
        event[header] = values[index] || '';
      });
      events.push(event);
    }

    return events;
  }

  /**
   * Mappe les catégories Open Data MTL vers nos catégories
   */
  private mapCategory(category: string): EventCategory {
    const cat = category.toLowerCase();
    
    if (cat.includes('musique') || cat.includes('music') || cat.includes('concert')) {
      return EventCategory.MUSIC;
    }
    if (cat.includes('théâtre') || cat.includes('theatre') || cat.includes('spectacle')) {
      return EventCategory.THEATRE;
    }
    if (cat.includes('exposition') || cat.includes('exhibition') || cat.includes('art')) {
      return EventCategory.EXHIBITION;
    }
    if (cat.includes('famille') || cat.includes('family') || cat.includes('enfant')) {
      return EventCategory.FAMILY;
    }
    if (cat.includes('sport') || cat.includes('activité physique')) {
      return EventCategory.SPORT;
    }
    if (cat.includes('nuit') || cat.includes('night') || cat.includes('club')) {
      return EventCategory.NIGHTLIFE;
    }
    if (cat.includes('éducation') || cat.includes('education') || cat.includes('atelier')) {
      return EventCategory.EDUCATION;
    }
    if (cat.includes('communautaire') || cat.includes('community') || cat.includes('festival')) {
      return EventCategory.COMMUNITY;
    }
    
    return EventCategory.OTHER;
  }

  /**
   * Génère des tags automatiques
   */
  private generateTags(title: string, category: string, neighborhood?: string): string[] {
    const tags = ['open data montreal', 'donnees ouvertes', 'montreal'];
    
    if (neighborhood) tags.push(neighborhood.toLowerCase());
    if (category) tags.push(category.toLowerCase());
    
    return [...new Set(tags)];
  }
}

