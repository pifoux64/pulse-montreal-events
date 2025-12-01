#!/usr/bin/env tsx
/**
 * Script pour créer un événement de test pour le week-end
 */

import { config } from 'dotenv';
import { prisma } from '../src/lib/prisma';
import { EventCategory, EventLanguage, EventStatus, EventSource } from '@prisma/client';

config({ path: '.env.local' });

async function createTestEvent() {
  // Calculer le week-end (vendredi à dimanche)
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  let weekendStart: Date;
  if (dayOfWeek === 0) {
    // Dimanche : week-end actuel
    weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() - 2); // Vendredi
  } else if (dayOfWeek >= 5) {
    // Vendredi ou samedi : week-end actuel
    weekendStart = new Date(now);
    if (dayOfWeek === 6) {
      weekendStart.setDate(now.getDate() - 1); // Vendredi
    }
  } else {
    // Lundi à jeudi : week-end prochain
    const daysUntilFriday = 5 - dayOfWeek;
    weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + daysUntilFriday);
  }
  weekendStart.setHours(18, 0, 0, 0); // Vendredi 18h
  
  // Créer ou trouver un venue
  let venue = await prisma.venue.findFirst({
    where: {
      name: 'Place des Arts',
      lat: { gte: 45.50, lte: 45.52 },
      lon: { gte: -73.56, lte: -73.54 },
    },
  });
  
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: 'Place des Arts',
        address: '175 Rue Sainte-Catherine O',
        city: 'Montréal',
        postalCode: 'H2X 1Z9',
        lat: 45.5088,
        lon: -73.5542,
      },
    });
  }
  
  // Créer un événement pour le week-end
  const event = await prisma.event.create({
    data: {
      source: EventSource.INTERNAL,
      sourceId: `test-weekend-${Date.now()}`,
      title: 'Concert de Test - Week-end',
      description: 'Événement de test pour valider la logique du week-end',
      startAt: weekendStart,
      endAt: new Date(weekendStart.getTime() + 2 * 60 * 60 * 1000), // +2h
      timezone: 'America/Montreal',
      status: EventStatus.SCHEDULED,
      venueId: venue.id,
      url: 'https://example.com',
      priceMin: 0,
      priceMax: 0,
      currency: 'CAD',
      language: EventLanguage.FR,
      tags: ['test', 'weekend', 'musique'],
      category: EventCategory.MUSIC,
    },
  });
  
  console.log('✅ Événement de test créé:', {
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    venue: venue.name,
  });
}

createTestEvent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

