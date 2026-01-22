// Types pour l'application d'événements à Montréal

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'organizer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  // Identifiant externe (API source) pour les événements non encore persistés
  externalId?: string;
  title: string;
  description: string;
  shortDescription?: string;
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string;
  subCategory?: string;
  tags: string[];
  price: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  imageUrl?: string;
  ticketUrl?: string | null;
  organizerId: string;
  organizer: User;
  venueSlug?: string | null; // Slug de la salle pour les liens
  organizerSlug?: string | null; // Slug de l'organisateur pour les liens
  customFilters: CustomFilter[];
  accessibility: AccessibilityInfo;
  targetAudience: string[];
  maxCapacity?: number;
  currentCapacity: number;
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  // Source d'origine de l'événement (ticketmaster, quartier_spectacles, etc.)
  source?: string;
  promotions?: Array<{
    id: string;
    kind: string;
    status: string;
    startsAt: string;
    endsAt: string;
  }>;
  // Tags structurés (EventTag) - SPRINT 2
  eventTags?: Array<{
    id: string;
    category: 'type' | 'genre' | 'ambiance' | 'public';
    value: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomFilter {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'boolean' | 'select' | 'number';
  options?: string[];
  isRequired: boolean;
  eventId: string;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  quietSpace: boolean;
  signLanguage: boolean;
  audioDescription: boolean;
  braille: boolean;
}

export interface EventFilter {
  categories?: string[];
  subCategories?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    lat: number;
    lng: number;
    radius: number; // en km
  };
  tags?: string[];
  accessibility?: Partial<AccessibilityInfo>;
  targetAudience?: string[];
  customFilters?: Record<string, any>;
  searchQuery?: string;
  // Nouvelles options de filtrage
  neighborhoods?: string[]; // Filtre par quartiers
  sources?: string[]; // Filtre par sources (ticketmaster, eventbrite, etc.)
  language?: 'FR' | 'EN' | 'BOTH'; // Filtre par langue
  freeOnly?: boolean; // Événements gratuits uniquement
  ageRestriction?: string; // Filtre par âge minimum (ex: "18+", "21+")
  sortBy?: 'date' | 'price' | 'popularity' | 'distance'; // Option de tri
  // SPRINT 2: Filtres par tags structurés
  type?: string; // Type d'événement (concert, dj_set, festival, etc.)
  ambiance?: string; // Ambiance (intime, grande_salle, underground, etc.)
  public?: string; // Public cible (tout_public, 18_plus, famille)
}

export interface FavoriteEvent {
  id: string;
  userId: string;
  eventId: string;
  event: Event;
  createdAt: Date;
}

export interface EventCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  subCategories: EventSubCategory[];
}

export interface EventSubCategory {
  id: string;
  name: string;
  nameEn: string;
  categoryId: string;
}

export interface Notification {
  id: string;
  userId: string;
  eventId?: string | null;
  type: 'EVENT_POST_PUBLISHED' | 'EVENT_REMINDER' | 'SYSTEM' | string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  favoriteCategories: string[];
  favoriteSubCategories: string[];
  notifications: {
    email: boolean;
    push: boolean;
    favorites: boolean;
    recommendations: boolean;
  };
  language: 'fr' | 'en';
  timezone: string;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

export interface EventFormData {
  title: string;
  description: string;
  longDescription?: string; // SPRINT 4: Description longue pour Facebook/Eventbrite
  lineup?: string[]; // SPRINT 4: Liste d'artistes pour RA/Bandsintown
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string;
  subCategory?: string;
  tags: string[];
  price: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  imageUrl?: string;
  ticketUrl?: string;
  customFilters: Omit<CustomFilter, 'id' | 'eventId'>[];
  accessibility: AccessibilityInfo;
  targetAudience: string[];
  maxCapacity?: number;
}
