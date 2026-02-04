'use client';

import { useState, useEffect } from 'react';
import EventHeader from '@/components/event-detail/EventHeader';
import EventHeroMedia from '@/components/event-detail/EventHeroMedia';
import PulseInsight from '@/components/event-detail/PulseInsight';
import EventDescriptionStructured from '@/components/event-detail/EventDescriptionStructured';
import SocialRelevance from '@/components/event-detail/SocialRelevance';
import ContextualDiscovery from '@/components/event-detail/ContextualDiscovery';
import PracticalInfo from '@/components/event-detail/PracticalInfo';
import OrganizerTools from '@/components/event-detail/OrganizerTools';
import ListenBeforeYouGo from '@/components/event-detail/ListenBeforeYouGo';

interface EventPageClientProps {
  event: {
    id: string;
    title: string;
    description: string;
    startAt: Date;
    endAt?: Date | null;
    imageUrl?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    currency?: string | null;
    url?: string | null;
    category: string;
    tags: string[];
    accessibility: string[];
    venue?: {
      id: string;
      name: string;
      slug?: string | null;
      address?: string | null;
      city?: string | null;
      postalCode?: string | null;
      lat?: number | null;
      lon?: number | null;
      neighborhood?: string | null;
    } | null;
    organizer?: {
      id: string;
      displayName: string;
      slug?: string | null;
      userId?: string | null;
    } | null;
    eventTags?: Array<{ category: string; value: string }> | null;
    features?: Array<{ featureKey: string; featureValue: any }> | null;
  };
  isOwner: boolean;
  isAdmin: boolean;
}

export default function EventPageClient({ event, isOwner, isAdmin }: EventPageClientProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Récupérer la localisation utilisateur (avec gestion des permissions)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }
    
    // Vérifier si la géolocalisation est disponible et autorisée
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // Ignore errors silently (permissions denied, timeout, etc.)
        // Ne pas logger pour éviter les warnings dans la console
      },
      {
        timeout: 5000,
        maximumAge: 300000, // Cache 5 minutes
      }
    );
  }, []);

  // Extraire lineup, longDescription et URLs musicales depuis EventFeature
  const longDescriptionFeature = event.features?.find(f => f.featureKey === 'longDescription');
  const lineupFeature = event.features?.find(f => f.featureKey === 'lineup');
  const spotifyUrlFeature = event.features?.find(f => f.featureKey === 'spotifyUrl');
  const soundcloudUrlFeature = event.features?.find(f => f.featureKey === 'soundcloudUrl');
  const mixcloudUrlFeature = event.features?.find(f => f.featureKey === 'mixcloudUrl');
  const youtubeUrlFeature = event.features?.find(f => f.featureKey === 'youtubeUrl');
  
  // Debug en développement : afficher toutes les features disponibles
  if (process.env.NODE_ENV === 'development' && event.features) {
    console.log('[EventPageClient] All EventFeatures:', event.features.map(f => ({
      key: f.featureKey,
      value: typeof f.featureValue === 'string' ? f.featureValue.substring(0, 100) : f.featureValue,
    })));
  }
  
  const toStr = (v: unknown): string | undefined =>
    v == null ? undefined : typeof v === 'string' ? v.trim() || undefined : String(v).trim() || undefined;

  const longDescription = longDescriptionFeature?.featureValue as string | undefined;
  const lineup = lineupFeature?.featureValue as string[] | undefined;
  const spotifyUrl = toStr(spotifyUrlFeature?.featureValue);
  const soundcloudUrl = toStr(soundcloudUrlFeature?.featureValue);
  const mixcloudUrl = toStr(mixcloudUrlFeature?.featureValue);
  const youtubeUrl = toStr(youtubeUrlFeature?.featureValue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        {/* 1. Header */}
        <EventHeader
          event={{
            id: event.id,
            title: event.title,
            startAt: event.startAt,
            endAt: event.endAt,
            venue: event.venue,
            priceMin: event.priceMin,
            priceMax: event.priceMax,
            currency: event.currency,
            url: event.url,
          }}
          userLocation={userLocation}
        />

        {/* 2. Hero / Media */}
        <EventHeroMedia
          imageUrl={event.imageUrl}
          title={event.title}
          lineup={lineup}
          eventTags={event.eventTags}
        />

        {/* 3. Pulse Insight (AI) */}
        <PulseInsight
          eventId={event.id}
          eventTitle={event.title}
          eventDescription={event.description}
          eventCategory={event.category}
          eventTags={event.eventTags}
          venue={event.venue}
          organizer={event.organizer}
          lineup={lineup}
          fallbackTags={event.tags}
        />

        {/* 4. Listen Before You Go */}
        <ListenBeforeYouGo
          spotifyUrl={spotifyUrl}
          soundcloudUrl={soundcloudUrl}
          mixcloudUrl={mixcloudUrl}
          youtubeUrl={youtubeUrl}
          eventTags={event.eventTags}
          category={event.category}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* 4. Description (structured) */}
            <EventDescriptionStructured
              description={event.description}
              longDescription={longDescription}
              lineup={lineup}
              startAt={event.startAt}
              endAt={event.endAt}
              accessibility={event.accessibility}
            />

            {/* 6. Social relevance */}
            <SocialRelevance
              eventId={event.id}
              eventTitle={event.title}
              eventUrl={event.url}
            />

            {/* 7. Contextual discovery */}
            <ContextualDiscovery
              eventId={event.id}
              venueId={event.venue?.id}
              organizerId={event.organizer?.id}
            />
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* 7. Practical info */}
            <PracticalInfo
              venue={event.venue}
              startAt={event.startAt}
              endAt={event.endAt}
              accessibility={event.accessibility}
            />

            {/* 9. Organizer tools (role-based) */}
            <OrganizerTools
              eventId={event.id}
              organizerId={event.organizer?.id}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
