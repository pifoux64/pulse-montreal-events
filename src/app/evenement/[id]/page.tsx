import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Clock, DollarSign, Users, Tag, ExternalLink, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock function - à remplacer par vraie API
async function getEvent(id: string) {
  // Simuler un délai d'API
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock data - remplacer par vraie requête DB
  const mockEvent = {
    id,
    title: 'Festival Jazz de Montréal 2025',
    description: 'Le plus grand festival de jazz au monde revient pour une édition exceptionnelle. Découvrez les plus grands noms du jazz international dans un cadre unique au cœur de Montréal.',
    startAt: '2025-07-01T20:00:00Z',
    endAt: '2025-07-01T23:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop',
    venue: {
      name: 'Place des Arts',
      address: '175 Rue Sainte-Catherine O, Montréal, QC H2X 1Z8',
      lat: 45.5088,
      lng: -73.5673,
    },
    organizer: {
      id: 'festival-jazz-mtl',
      displayName: 'Festival International de Jazz de Montréal',
      verified: true,
    },
    category: 'MUSIC',
    subcategory: 'Jazz',
    tags: ['jazz', 'musique', 'festival', 'international', 'été'],
    priceMin: 45,
    priceMax: 125,
    currency: 'CAD',
    language: 'BOTH',
    accessibility: ['wheelchair', 'hearing_assistance'],
    ageRestriction: null,
    url: 'https://festivaljazzmontreal.com',
    source: 'INTERNAL',
    status: 'SCHEDULED',
  };

  return mockEvent;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const event = await getEvent(params.id);
    
    if (!event) {
      return {
        title: 'Événement non trouvé',
        description: 'Cet événement n\'existe pas ou a été supprimé.',
      };
    }

    const eventDate = new Date(event.startAt).toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTime = new Date(event.startAt).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      title: `${event.title} | Pulse Montreal`,
      description: `${event.description.substring(0, 160)}... 📅 ${eventDate} à ${eventTime} 📍 ${event.venue.name}`,
      keywords: [...event.tags, event.category.toLowerCase(), 'montréal', 'événement'],
      openGraph: {
        type: 'article',
        locale: 'fr_CA',
        url: `/evenement/${event.id}`,
        title: event.title,
        description: event.description,
        siteName: 'Pulse Montreal',
        publishedTime: event.startAt,
        modifiedTime: event.startAt,
        section: event.category,
        tags: event.tags,
        images: [
          {
            url: event.imageUrl || '/og-event-default.png',
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: `${eventDate} à ${eventTime} • ${event.venue.name}`,
        images: [event.imageUrl || '/og-event-default.png'],
      },
      other: {
        'event:start_time': event.startAt,
        'event:end_time': event.endAt,
        'event:location:latitude': event.venue.lat.toString(),
        'event:location:longitude': event.venue.lng.toString(),
        'event:location:venue': event.venue.name,
        'event:location:address': event.venue.address,
        'event:organizer': event.organizer.displayName,
        'event:price:min': event.priceMin?.toString(),
        'event:price:max': event.priceMax?.toString(),
        'event:price:currency': event.currency,
      },
    };
  } catch (error) {
    return {
      title: 'Erreur de chargement',
      description: 'Impossible de charger les informations de cet événement.',
    };
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  try {
    const event = await getEvent(params.id);
    
    if (!event) {
      notFound();
    }

    const eventDate = new Date(event.startAt);
    const eventEndDate = new Date(event.endAt);
    const isPastEvent = eventDate < new Date();

    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-8">
            <div className="aspect-[16/9] relative">
              <Image
                src={event.imageUrl || '/placeholder-event.jpg'}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Event Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isPastEvent 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {isPastEvent ? 'Terminé' : 'À venir'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Event Title & Basic Info */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {eventDate.toLocaleDateString('fr-CA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {eventDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.venue.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p>{event.description}</p>
                </div>
              </div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Détails</h2>
                <div className="space-y-4">
                  {/* Price */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Prix</div>
                      <div className="text-sm text-gray-600">
                        {event.priceMin === 0 ? (
                          'Gratuit'
                        ) : event.priceMin === event.priceMax ? (
                          `${event.priceMin} ${event.currency}`
                        ) : (
                          `${event.priceMin} - ${event.priceMax} ${event.currency}`
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Organisateur</div>
                      <Link 
                        href={`/organisateur/${event.organizer.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {event.organizer.displayName}
                        {event.organizer.verified && (
                          <span className="text-green-600">✓</span>
                        )}
                      </Link>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 text-teal-600 mt-0.5 flex items-center justify-center">
                      🌐
                    </div>
                    <div>
                      <div className="font-medium">Langue</div>
                      <div className="text-sm text-gray-600">
                        {event.language === 'FR' ? 'Français' : 
                         event.language === 'EN' ? 'Anglais' : 
                         'Français et Anglais'}
                      </div>
                    </div>
                  </div>

                  {/* Accessibility */}
                  {event.accessibility.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 text-orange-600 mt-0.5 flex items-center justify-center">
                        ♿
                      </div>
                      <div>
                        <div className="font-medium">Accessibilité</div>
                        <div className="text-sm text-gray-600">
                          {event.accessibility.map(a => 
                            a === 'wheelchair' ? 'Accès fauteuil roulant' :
                            a === 'hearing_assistance' ? 'Assistance auditive' :
                            a
                          ).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Venue */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lieu
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">{event.venue.name}</div>
                    <div className="text-sm text-gray-600">{event.venue.address}</div>
                  </div>
                  
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                    {/* Placeholder pour carte - remplacer par vraie carte */}
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Carte interactive
                    </div>
                  </div>
                  
                  <a
                    href={`https://maps.google.com/?q=${event.venue.lat},${event.venue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans Google Maps
                  </a>
                </div>
              </div>

              {/* CTA Button */}
              {!isPastEvent && event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-center hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Acheter des billets
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
}
