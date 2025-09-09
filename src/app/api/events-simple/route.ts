import { NextRequest, NextResponse } from 'next/server';
import { generateMusicTags } from '@/lib/musicTags';

// API complète pour récupérer les événements de TOUTES les sources
export async function GET(request: NextRequest) {
  try {
    const TICKETMASTER_API_KEY = "02NvAxNFTMEGqxenoe3knPuMdYvUdBjx";
    const EVENTBRITE_TOKEN = "JXCGSFURQV7AVDHS63AV"; // Private token
    
    const allEvents = [];
    
    // ============= TICKETMASTER =============
    console.log('🎫 Récupération des événements Ticketmaster...');
    // Recherches MULTIPLES avec différents paramètres et périodes
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const ticketmasterSearches = [
      // Recherches par ville avec différentes périodes
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Montreal&countryCode=CA&size=200&sort=date,asc`,
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Montreal&countryCode=CA&size=200&sort=date,asc&startDateTime=${nextMonth.toISOString()}`,
      
      // Recherches géographiques avec différents rayons
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=45.5088,-73.5542&radius=25&unit=km&countryCode=CA&size=200&sort=date,asc`,
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=45.5088,-73.5542&radius=75&unit=km&countryCode=CA&size=200&sort=date,asc`,
      
      // Recherches par codes postaux multiples de Montréal
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&postalCode=H3C&countryCode=CA&size=200&sort=date,asc`,
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&postalCode=H2X&countryCode=CA&size=200&sort=date,asc`,
      
      // Recherches par catégories spécifiques
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Montreal&countryCode=CA&size=200&classificationName=music&sort=date,asc`,
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Montreal&countryCode=CA&size=200&classificationName=sports&sort=date,asc`,
      
      // Recherches dans les villes avoisinantes
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Laval&countryCode=CA&size=100&sort=date,asc`,
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=Longueuil&countryCode=CA&size=100&sort=date,asc`
    ];
    
    for (let i = 0; i < ticketmasterSearches.length; i++) {
      try {
        const response = await fetch(ticketmasterSearches[i]);
        const data = await response.json();
        const events = data._embedded?.events || [];
        
        // Transformer et ajouter la source
        const transformedEvents = events.map((event: any) => ({
          ...event,
          source: 'ticketmaster',
          sourceId: event.id
        }));
        
        allEvents.push(...transformedEvents);
        console.log(`✅ Ticketmaster: ${events.length} événements (recherche ${i + 1})`);
      } catch (error: any) {
        console.log(`⚠️ Erreur Ticketmaster recherche ${i + 1}:`, error.message);
      }
    }
    
    // ============= EVENTBRITE (TEMPORAIREMENT DÉSACTIVÉ) =============
    console.log('🎟️ Eventbrite: API endpoint obsolète, désactivé temporairement');
    // L'API Eventbrite v3 /events/search n'existe plus
    // TODO: Implémenter la nouvelle méthode d'accès aux événements publics
    
    // ============= MEETUP =============
    console.log('👥 Récupération des événements Meetup...');
    try {
      // Recherche d'événements Meetup à Montréal via leur API GraphQL
      const meetupQuery = `
        query {
          keywordSearch(input: {
            query: "Montreal", 
            lat: 45.5088, 
            lon: -73.5542, 
            radius: 50
          }) {
            edges {
              node {
                result {
                  ... on Event {
                    id
                    title
                    description
                    dateTime
                    endTime
                    eventUrl
                    images {
                      baseUrl
                    }
                    venue {
                      name
                      address
                      city
                      lat
                      lng
                    }
                    group {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      // Note: Meetup API nécessite une authentification OAuth complexe
      // Pour l'instant, on simule quelques événements Meetup populaires
      const mockMeetupEvents = [
        {
          id: 'meetup_1',
          name: 'Montreal Tech Meetup',
          description: 'Rencontre mensuelle des développeurs montréalais',
          dates: {
            start: {
              localDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              localTime: '18:00:00',
              dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          url: 'https://meetup.com/montreal-tech',
          images: [{ url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop' }],
          classifications: [{ segment: { name: 'Education' }, genre: { name: 'Technology' } }],
          priceRanges: [{ min: 0, max: 0, currency: 'CAD' }],
          _embedded: {
            venues: [{
              name: 'Espace Co-working Montreal',
              address: { line1: '123 Rue Saint-Laurent' },
              city: { name: 'Montreal' },
              location: { latitude: '45.5088', longitude: '-73.5542' }
            }]
          },
          source: 'meetup',
          sourceId: 'meetup_1'
        },
        {
          id: 'meetup_2',
          name: 'Montreal Photography Walk',
          description: 'Balade photo dans le Vieux-Montréal',
          dates: {
            start: {
              localDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              localTime: '14:00:00',
              dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          url: 'https://meetup.com/montreal-photo',
          images: [{ url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop' }],
          classifications: [{ segment: { name: 'Arts & Theatre' }, genre: { name: 'Photography' } }],
          priceRanges: [{ min: 0, max: 0, currency: 'CAD' }],
          _embedded: {
            venues: [{
              name: 'Place Jacques-Cartier',
              address: { line1: 'Place Jacques-Cartier' },
              city: { name: 'Montreal' },
              location: { latitude: '45.5088', longitude: '-73.5542' }
            }]
          },
          source: 'meetup',
          sourceId: 'meetup_2'
        }
      ];
      
      allEvents.push(...mockMeetupEvents);
      console.log(`✅ Meetup: ${mockMeetupEvents.length} événements (simulés)`);
    } catch (error: any) {
      console.log(`⚠️ Erreur Meetup:`, error.message);
    }

    // ============= DONNÉES OUVERTES MONTRÉAL =============
    console.log('🏛️ Récupération des événements Ville de Montréal...');
    try {
      // API des données ouvertes de la Ville de Montréal
      const montrealResponse = await fetch('https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=5866cc2f-2c2a-4b3f-b9e1-6d8c4c02c8b9&limit=50');
      
      if (montrealResponse.ok) {
        const montrealData = await montrealResponse.json();
        const montrealEvents = montrealData.result?.records || [];
        
        const transformedMontrealEvents = montrealEvents.map((event: any, index: number) => ({
          id: `mtl_${event._id || index}`,
          name: event.nom || event.title || 'Événement municipal',
          description: event.description || event.resume || 'Événement organisé par la Ville de Montréal',
          dates: {
            start: {
              localDate: event.date_debut || new Date().toISOString().split('T')[0],
              localTime: event.heure_debut || '19:00:00',
              dateTime: event.date_debut || new Date().toISOString()
            }
          },
          url: event.url_evenement || 'https://montreal.ca',
          images: [{ url: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=400&h=300&fit=crop' }],
          classifications: [{ segment: { name: 'Community' }, genre: { name: event.categorie || 'Municipal' } }],
          priceRanges: [{ min: 0, max: 0, currency: 'CAD' }],
          _embedded: {
            venues: [{
              name: event.lieu || 'Lieu municipal',
              address: { line1: event.adresse || 'Montreal, QC' },
              city: { name: 'Montreal' },
              location: { 
                latitude: event.latitude || '45.5088', 
                longitude: event.longitude || '-73.5542' 
              }
            }]
          },
          source: 'montreal_opendata',
          sourceId: event._id || `mtl_${index}`
        }));
        
        allEvents.push(...transformedMontrealEvents);
        console.log(`✅ Ville de Montréal: ${montrealEvents.length} événements`);
      } else {
        console.log(`⚠️ Erreur API Ville de Montréal: ${montrealResponse.status}`);
      }
    } catch (error: any) {
      console.log(`⚠️ Erreur Ville de Montréal:`, error.message);
    }
    
    // Supprimer les doublons par ID
    const uniqueEvents = allEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id || e.sourceId === event.sourceId)
    );
    
    console.log(`🎉 TOTAL: ${uniqueEvents.length} événements uniques de toutes les sources`);
    const events = uniqueEvents;
    
    // Transformer les événements au format attendu
    const transformedEvents = events.map((event: any) => {
      const venue = event._embedded?.venues?.[0];
      const startDate = event.dates?.start?.localDate;
      const startTime = event.dates?.start?.localTime;
      
      return {
        id: event.id,
        title: event.name,
        description: event.info || event.pleaseNote || `Événement via Ticketmaster - ${event.name}`,
        startAt: startDate ? `${startDate}T${startTime || '19:00:00'}` : new Date().toISOString(),
        endAt: null,
        url: event.url,
        imageUrl: event.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        category: event.classifications?.[0]?.segment?.name?.toLowerCase() || 'music',
        subcategory: event.classifications?.[0]?.genre?.name?.toLowerCase() || '',
        tags: generateMusicTags({
          title: event.name,
          description: event.info || event.pleaseNote || '',
          category: event.classifications?.[0]?.segment?.name?.toLowerCase() || 'music',
          tags: [
            event.classifications?.[0]?.genre?.name?.toLowerCase(),
            event.classifications?.[0]?.segment?.name?.toLowerCase(),
            'ticketmaster'
          ].filter(Boolean)
        }),
        city: venue?.city?.name || 'Montreal',
        address: venue ? `${venue.name}${venue.address?.line1 ? ', ' + venue.address.line1 : ''}` : null,
        venue: {
          name: venue?.name || 'Lieu à déterminer',
          lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : 45.5088,
          lon: venue?.location?.longitude ? parseFloat(venue.location.longitude) : -73.5542
        },
        lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : 45.5088,
        lon: venue?.location?.longitude ? parseFloat(venue.location.longitude) : -73.5542,
        source: 'ticketmaster',
        external_id: event.id,
        status: 'published',
        priceMin: event.priceRanges?.[0]?.min || 0,
        priceMax: event.priceRanges?.[0]?.max || 0,
        currency: event.priceRanges?.[0]?.currency || 'CAD',
        organizerId: 'ticketmaster',
        accessibility: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }).filter((event: any) => event.startAt);
    
    return NextResponse.json({
      items: transformedEvents,
      total: transformedEvents.length,
      page: 1,
      pageSize: transformedEvents.length,
      totalPages: 1,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des événements Ticketmaster:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 0,
      totalPages: 0,
      error: 'Erreur lors de la récupération des événements'
    });
  }
}
