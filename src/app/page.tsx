'use client';

import { useState, useEffect } from 'react';
import { Event, EventFilter, EventCategory } from '@/types';
import Navigation from '@/components/Navigation';
import EventFilters from '@/components/EventFilters';
import EventCard from '@/components/EventCard';
import { MapPin, List, Grid, Filter, Search, Calendar, Users, Star, TrendingUp, Clock, Sparkles, ArrowRight, Play, Zap, Globe, Heart, Award, Music, Palette, Trophy, Users2, Utensils } from 'lucide-react';

// Données de test pour le développement
const mockCategories: EventCategory[] = [
  {
    id: '1',
    name: 'Musique',
    nameEn: 'Music',
    icon: '🎵',
    color: '#ef4444',
    subCategories: [
      { id: '1-1', name: 'Reggae', nameEn: 'Reggae', categoryId: '1' },
      { id: '1-2', name: 'Jazz', nameEn: 'Jazz', categoryId: '1' },
      { id: '1-3', name: 'Rock', nameEn: 'Rock', categoryId: '1' },
      { id: '1-4', name: 'Électronique', nameEn: 'Electronic', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Art & Culture',
    nameEn: 'Art & Culture',
    icon: '🎨',
    color: '#8b5cf6',
    subCategories: [
      { id: '2-1', name: 'Exposition', nameEn: 'Exhibition', categoryId: '2' },
      { id: '2-2', name: 'Théâtre', nameEn: 'Theater', categoryId: '2' },
      { id: '2-3', name: 'Cinéma', nameEn: 'Cinema', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Sport',
    nameEn: 'Sports',
    icon: '⚽',
    color: '#06b6d4',
    subCategories: [
      { id: '3-1', name: 'Football', nameEn: 'Soccer', categoryId: '3' },
      { id: '3-2', name: 'Basketball', nameEn: 'Basketball', categoryId: '3' },
      { id: '3-3', name: 'Course', nameEn: 'Running', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Famille',
    nameEn: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f59e0b',
    subCategories: [
      { id: '4-1', name: 'Activités enfants', nameEn: 'Kids activities', categoryId: '4' },
      { id: '4-2', name: 'Parcs', nameEn: 'Parks', categoryId: '4' },
      { id: '4-3', name: 'Éducation', nameEn: 'Education', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Gastronomie',
    nameEn: 'Food & Drink',
    icon: '🍽️',
    color: '#10b981',
    subCategories: [
      { id: '5-1', name: 'Festival culinaire', nameEn: 'Food festival', categoryId: '5' },
      { id: '5-2', name: 'Dégustation', nameEn: 'Tasting', categoryId: '5' },
      { id: '5-3', name: 'Restaurant', nameEn: 'Restaurant', categoryId: '5' },
    ]
  }
];

const mockEvents: Event[] = [
  // MUSIQUE - Reggae
  {
    id: '1',
    title: 'Festival Reggae Montréal 2024',
    description: 'Le plus grand festival de reggae de l\'été à Montréal ! Venez danser au rythme des meilleurs artistes internationaux comme Bob Marley Jr., Damian Marley et des talents locaux.',
    shortDescription: 'Festival de reggae avec artistes internationaux',
    startDate: new Date('2024-08-15T18:00:00'),
    endDate: new Date('2024-08-15T23:00:00'),
    location: {
      name: 'Parc Jean-Drapeau',
      address: '1 Circuit Gilles Villeneuve',
      city: 'Montréal',
      postalCode: 'H3C 1A9',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Musique',
    subCategory: 'Reggae',
    tags: ['reggae', 'festival', 'été', 'plein air'],
    price: { amount: 45, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/tickets',
    organizerId: 'org1',
    organizer: { id: 'org1', email: 'org@example.com', name: 'Festival Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes', 'Jeunes adultes'],
    maxCapacity: 5000,
    currentCapacity: 3200,
    isFeatured: true,
    isVerified: true,
    rating: 4.8,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // MUSIQUE - Jazz
  {
    id: '4',
    title: 'Soirée Jazz au Upstairs',
    description: 'Une soirée intime avec les meilleurs musiciens de jazz de Montréal. Ambiance feutrée, cocktails signature et musique live exceptionnelle.',
    shortDescription: 'Soirée jazz intime avec musiciens locaux',
    startDate: new Date('2024-12-28T20:00:00'),
    endDate: new Date('2024-12-28T23:30:00'),
    location: {
      name: 'Upstairs Jazz Bar & Grill',
      address: '1254 Rue Mackay',
      city: 'Montréal',
      postalCode: 'H3G 2H4',
      coordinates: { lat: 45.4995, lng: -73.5848 }
    },
    category: 'Musique',
    subCategory: 'Jazz',
    tags: ['jazz', 'musique live', 'bar', 'soirée'],
    price: { amount: 25, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/jazz-tickets',
    organizerId: 'org4',
    organizer: { id: 'org4', email: 'upstairs@example.com', name: 'Upstairs Jazz', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: false,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes'],
    maxCapacity: 80,
    currentCapacity: 65,
    isFeatured: false,
    isVerified: true,
    rating: 4.7,
    reviewCount: 92,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // MUSIQUE - Rock
  {
    id: '5',
    title: 'Concert Rock Électrique - Les Trois Accords',
    description: 'Les Trois Accords reviennent en force avec leur nouveau spectacle électrisant ! Rock québécois à son meilleur avec des hits incontournables.',
    shortDescription: 'Concert des Trois Accords - Rock québécois',
    startDate: new Date('2025-01-15T20:00:00'),
    endDate: new Date('2025-01-15T23:00:00'),
    location: {
      name: 'Théâtre Corona',
      address: '2490 Rue Notre-Dame O',
      city: 'Montréal',
      postalCode: 'H3J 1N5',
      coordinates: { lat: 45.4769, lng: -73.5794 }
    },
    category: 'Musique',
    subCategory: 'Rock',
    tags: ['rock', 'québécois', 'concert', 'live'],
    price: { amount: 55, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/rock-tickets',
    organizerId: 'org5',
    organizer: { id: 'org5', email: 'corona@example.com', name: 'Théâtre Corona', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes', 'Jeunes adultes'],
    maxCapacity: 1200,
    currentCapacity: 890,
    isFeatured: true,
    isVerified: true,
    rating: 4.9,
    reviewCount: 234,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // MUSIQUE - Électronique
  {
    id: '6',
    title: 'Nuit Électro - DJ International',
    description: 'Une nuit électrisante avec les meilleurs DJs internationaux ! Techno, house et électro jusqu\'au petit matin dans l\'ambiance unique de Montréal.',
    shortDescription: 'Soirée électro avec DJs internationaux',
    startDate: new Date('2025-01-25T22:00:00'),
    endDate: new Date('2025-01-26T04:00:00'),
    location: {
      name: 'Stereo Nightclub',
      address: '858 Rue Sainte-Catherine E',
      city: 'Montréal',
      postalCode: 'H2L 2E2',
      coordinates: { lat: 45.5158, lng: -73.5669 }
    },
    category: 'Musique',
    subCategory: 'Électronique',
    tags: ['électro', 'techno', 'house', 'dj', 'club'],
    price: { amount: 35, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b6d1d1d?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/electro-tickets',
    organizerId: 'org6',
    organizer: { id: 'org6', email: 'stereo@example.com', name: 'Stereo Nightclub', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Jeunes adultes', 'Adultes'],
    maxCapacity: 800,
    currentCapacity: 650,
    isFeatured: false,
    isVerified: true,
    rating: 4.4,
    reviewCount: 178,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ART & CULTURE - Exposition
  {
    id: '2',
    title: 'Exposition d\'Art Contemporain',
    description: 'Découvrez les œuvres des artistes montréalais les plus prometteurs dans cette exposition immersive qui explore les thèmes de l\'identité urbaine.',
    shortDescription: 'Exposition d\'art contemporain montréalais',
    startDate: new Date('2024-07-20T10:00:00'),
    endDate: new Date('2025-03-15T18:00:00'),
    location: {
      name: 'Musée d\'Art Contemporain',
      address: '185 Rue Sainte-Catherine O',
      city: 'Montréal',
      postalCode: 'H2X 1K3',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Art & Culture',
    subCategory: 'Exposition',
    tags: ['art', 'contemporain', 'musée', 'culture'],
    price: { amount: 15, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/tickets',
    organizerId: 'org2',
    organizer: { id: 'org2', email: 'org2@example.com', name: 'MAC Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: false
    },
    targetAudience: ['Adultes', 'Familles', 'Étudiants'],
    maxCapacity: 200,
    currentCapacity: 45,
    isFeatured: false,
    isVerified: true,
    rating: 4.6,
    reviewCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ART & CULTURE - Théâtre
  {
    id: '7',
    title: 'Pièce de Théâtre - "Les Belles-Sœurs"',
    description: 'Redécouvrez le chef-d\'œuvre de Michel Tremblay dans une mise en scène moderne et captivante. Une pièce emblématique du théâtre québécois.',
    shortDescription: 'Les Belles-Sœurs de Michel Tremblay',
    startDate: new Date('2025-02-10T19:30:00'),
    endDate: new Date('2025-02-10T22:00:00'),
    location: {
      name: 'Théâtre du Nouveau Monde',
      address: '84 Rue Sainte-Catherine O',
      city: 'Montréal',
      postalCode: 'H2X 1Z5',
      coordinates: { lat: 45.5088, lng: -73.5667 }
    },
    category: 'Art & Culture',
    subCategory: 'Théâtre',
    tags: ['théâtre', 'québécois', 'classique', 'tremblay'],
    price: { amount: 42, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/theatre-tickets',
    organizerId: 'org7',
    organizer: { id: 'org7', email: 'tnm@example.com', name: 'TNM', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: true
    },
    targetAudience: ['Adultes', 'Étudiants'],
    maxCapacity: 350,
    currentCapacity: 280,
    isFeatured: true,
    isVerified: true,
    rating: 4.8,
    reviewCount: 145,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ART & CULTURE - Cinéma
  {
    id: '8',
    title: 'Festival du Film Indépendant',
    description: 'Découvrez les meilleurs films indépendants du Québec et d\'ailleurs. Trois jours de projections, rencontres avec les réalisateurs et débats passionnants.',
    shortDescription: 'Festival de cinéma indépendant',
    startDate: new Date('2025-01-20T18:00:00'),
    endDate: new Date('2025-01-22T23:00:00'),
    location: {
      name: 'Cinémathèque québécoise',
      address: '335 Boul de Maisonneuve E',
      city: 'Montréal',
      postalCode: 'H2X 1K1',
      coordinates: { lat: 45.5145, lng: -73.5698 }
    },
    category: 'Art & Culture',
    subCategory: 'Cinéma',
    tags: ['cinéma', 'film', 'indépendant', 'festival'],
    price: { amount: 12, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1489599797906-352146bdad19?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/cinema-tickets',
    organizerId: 'org8',
    organizer: { id: 'org8', email: 'cinematheque@example.com', name: 'Cinémathèque', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: true,
      braille: false
    },
    targetAudience: ['Adultes', 'Étudiants'],
    maxCapacity: 150,
    currentCapacity: 95,
    isFeatured: false,
    isVerified: true,
    rating: 4.5,
    reviewCount: 67,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // SPORT - Basketball
  {
    id: '3',
    title: 'Match de Basketball Local',
    description: 'Venez encourager l\'équipe locale dans ce match passionnant de basketball amateur. Ambiance garantie et entrée gratuite pour toute la famille !',
    shortDescription: 'Match de basketball amateur local',
    startDate: new Date('2025-01-05T19:30:00'),
    endDate: new Date('2025-01-05T21:30:00'),
    location: {
      name: 'Centre Sportif de Montréal',
      address: '1234 Rue du Sport',
      city: 'Montréal',
      postalCode: 'H2X 2K4',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Sport',
    subCategory: 'Basketball',
    tags: ['basketball', 'sport', 'local', 'amateur'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org3',
    organizer: { id: 'org3', email: 'org3@example.com', name: 'Centre Sportif', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Familles', 'Adultes', 'Jeunes adultes'],
    maxCapacity: 500,
    currentCapacity: 150,
    isFeatured: false,
    isVerified: true,
    rating: 4.2,
    reviewCount: 34,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // SPORT - Football
  {
    id: '9',
    title: 'Match CF Montréal vs Toronto FC',
    description: 'Le derby canadien le plus attendu ! CF Montréal affronte Toronto FC dans un match crucial pour les séries éliminatoires de la MLS.',
    shortDescription: 'CF Montréal vs Toronto FC - MLS',
    startDate: new Date('2025-02-15T15:00:00'),
    endDate: new Date('2025-02-15T17:00:00'),
    location: {
      name: 'Stade Saputo',
      address: '4750 Rue Sherbrooke E',
      city: 'Montréal',
      postalCode: 'H1V 3S8',
      coordinates: { lat: 45.5614, lng: -73.5528 }
    },
    category: 'Sport',
    subCategory: 'Football',
    tags: ['football', 'soccer', 'mls', 'derby', 'professionnel'],
    price: { amount: 35, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/cfmontreal-tickets',
    organizerId: 'org9',
    organizer: { id: 'org9', email: 'cfmontreal@example.com', name: 'CF Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: false
    },
    targetAudience: ['Familles', 'Adultes', 'Jeunes adultes'],
    maxCapacity: 20000,
    currentCapacity: 15000,
    isFeatured: true,
    isVerified: true,
    rating: 4.7,
    reviewCount: 456,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // SPORT - Course
  {
    id: '10',
    title: 'Marathon de Montréal 2025',
    description: 'Le plus grand événement de course à pied de la métropole ! Parcours de 42km à travers les plus beaux quartiers de Montréal. Inscription ouverte.',
    shortDescription: 'Marathon officiel de Montréal',
    startDate: new Date('2025-05-25T08:00:00'),
    endDate: new Date('2025-05-25T15:00:00'),
    location: {
      name: 'Parc La Fontaine',
      address: '3933 Av du Parc-La Fontaine',
      city: 'Montréal',
      postalCode: 'H2L 3M6',
      coordinates: { lat: 45.5255, lng: -73.5747 }
    },
    category: 'Sport',
    subCategory: 'Course',
    tags: ['marathon', 'course', 'running', '42km', 'défi'],
    price: { amount: 85, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/marathon-tickets',
    organizerId: 'org10',
    organizer: { id: 'org10', email: 'marathon@example.com', name: 'Marathon Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes', 'Jeunes adultes'],
    maxCapacity: 8000,
    currentCapacity: 5200,
    isFeatured: true,
    isVerified: true,
    rating: 4.6,
    reviewCount: 289,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // FAMILLE - Activités enfants
  {
    id: '11',
    title: 'Spectacle de Marionnettes Géantes',
    description: 'Un spectacle magique avec des marionnettes géantes qui racontent l\'histoire de Montréal ! Parfait pour les enfants de 3 à 12 ans. Rires et émerveillement garantis !',
    shortDescription: 'Spectacle de marionnettes pour enfants',
    startDate: new Date('2025-01-12T14:00:00'),
    endDate: new Date('2025-01-12T15:30:00'),
    location: {
      name: 'Théâtre Denise-Pelletier',
      address: '4353 Av Papineau',
      city: 'Montréal',
      postalCode: 'H2H 1T7',
      coordinates: { lat: 45.5344, lng: -73.5794 }
    },
    category: 'Famille',
    subCategory: 'Activités enfants',
    tags: ['enfants', 'marionnettes', 'spectacle', 'famille'],
    price: { amount: 18, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/marionnettes-tickets',
    organizerId: 'org11',
    organizer: { id: 'org11', email: 'denise@example.com', name: 'Théâtre Denise-Pelletier', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: false
    },
    targetAudience: ['Familles', 'Enfants'],
    maxCapacity: 200,
    currentCapacity: 145,
    isFeatured: false,
    isVerified: true,
    rating: 4.9,
    reviewCount: 87,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // FAMILLE - Parcs
  {
    id: '12',
    title: 'Journée Découverte au Biodôme',
    description: 'Explorez les écosystèmes du monde entier au Biodôme de Montréal ! Activités interactives, ateliers éducatifs et rencontres avec les animateurs.',
    shortDescription: 'Journée découverte au Biodôme',
    startDate: new Date('2025-01-18T10:00:00'),
    endDate: new Date('2025-01-18T17:00:00'),
    location: {
      name: 'Biodôme de Montréal',
      address: '4777 Av Pierre-De Coubertin',
      city: 'Montréal',
      postalCode: 'H1V 1B3',
      coordinates: { lat: 45.5598, lng: -73.5493 }
    },
    category: 'Famille',
    subCategory: 'Parcs',
    tags: ['biodôme', 'nature', 'éducatif', 'animaux'],
    price: { amount: 22, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/biodome-tickets',
    organizerId: 'org12',
    organizer: { id: 'org12', email: 'biodome@example.com', name: 'Espace pour la vie', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: true
    },
    targetAudience: ['Familles', 'Enfants', 'Étudiants'],
    maxCapacity: 500,
    currentCapacity: 320,
    isFeatured: false,
    isVerified: true,
    rating: 4.7,
    reviewCount: 198,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // FAMILLE - Éducation
  {
    id: '13',
    title: 'Atelier Science Amusante',
    description: 'Des expériences scientifiques ludiques et éducatives pour les enfants curieux ! Chimie, physique et biologie expliquées de manière amusante.',
    shortDescription: 'Atelier scientifique pour enfants',
    startDate: new Date('2025-01-22T13:00:00'),
    endDate: new Date('2025-01-22T16:00:00'),
    location: {
      name: 'Centre des Sciences de Montréal',
      address: '2 Rue de la Commune O',
      city: 'Montréal',
      postalCode: 'H2Y 4B2',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Famille',
    subCategory: 'Éducation',
    tags: ['science', 'éducation', 'expériences', 'enfants'],
    price: { amount: 15, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/science-tickets',
    organizerId: 'org13',
    organizer: { id: 'org13', email: 'sciences@example.com', name: 'Centre des Sciences', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Familles', 'Enfants', 'Étudiants'],
    maxCapacity: 30,
    currentCapacity: 22,
    isFeatured: false,
    isVerified: true,
    rating: 4.8,
    reviewCount: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // GASTRONOMIE - Festival culinaire
  {
    id: '14',
    title: 'Festival Poutine & Cie',
    description: 'Le plus grand festival de poutine de Montréal ! Découvrez 50 variations créatives de notre plat national par les meilleurs chefs de la ville.',
    shortDescription: 'Festival de poutine créative',
    startDate: new Date('2025-03-01T11:00:00'),
    endDate: new Date('2025-03-03T22:00:00'),
    location: {
      name: 'Place des Festivals',
      address: '1499 Rue Jeanne-Mance',
      city: 'Montréal',
      postalCode: 'H2X 2J5',
      coordinates: { lat: 45.5088, lng: -73.5667 }
    },
    category: 'Gastronomie',
    subCategory: 'Festival culinaire',
    tags: ['poutine', 'festival', 'cuisine', 'québécois'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org14',
    organizer: { id: 'org14', email: 'poutine@example.com', name: 'Festival Poutine', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Familles', 'Adultes', 'Jeunes adultes'],
    maxCapacity: 10000,
    currentCapacity: 7500,
    isFeatured: true,
    isVerified: true,
    rating: 4.5,
    reviewCount: 567,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // GASTRONOMIE - Dégustation
  {
    id: '15',
    title: 'Dégustation Vins & Fromages du Québec',
    description: 'Découvrez les meilleurs vins et fromages du Québec dans une soirée dégustation exclusive. Rencontrez les producteurs et apprenez les accords parfaits.',
    shortDescription: 'Dégustation vins et fromages québécois',
    startDate: new Date('2025-02-08T18:30:00'),
    endDate: new Date('2025-02-08T21:30:00'),
    location: {
      name: 'Marché Bonsecours',
      address: '350 Rue Saint-Paul E',
      city: 'Montréal',
      postalCode: 'H2Y 1H2',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Gastronomie',
    subCategory: 'Dégustation',
    tags: ['vin', 'fromage', 'dégustation', 'québécois'],
    price: { amount: 65, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/degustation-tickets',
    organizerId: 'org15',
    organizer: { id: 'org15', email: 'bonsecours@example.com', name: 'Marché Bonsecours', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes'],
    maxCapacity: 80,
    currentCapacity: 65,
    isFeatured: false,
    isVerified: true,
    rating: 4.8,
    reviewCount: 92,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // GASTRONOMIE - Restaurant
  {
    id: '16',
    title: 'Soirée Gastronomique - Chef Invité',
    description: 'Le chef étoilé Martin Picard présente un menu dégustation exceptionnel de 7 services. Une expérience culinaire inoubliable au cœur du Vieux-Montréal.',
    shortDescription: 'Menu dégustation avec chef étoilé',
    startDate: new Date('2025-02-14T19:00:00'),
    endDate: new Date('2025-02-14T23:00:00'),
    location: {
      name: 'Restaurant Toqué!',
      address: '900 Pl Jean-Paul-Riopelle',
      city: 'Montréal',
      postalCode: 'H2Z 2B2',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Gastronomie',
    subCategory: 'Restaurant',
    tags: ['gastronomie', 'chef', 'dégustation', 'étoilé'],
    price: { amount: 185, currency: 'CAD', isFree: false },
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    ticketUrl: 'https://example.com/toque-tickets',
    organizerId: 'org16',
    organizer: { id: 'org16', email: 'toque@example.com', name: 'Toqué!', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes'],
    maxCapacity: 40,
    currentCapacity: 38,
    isFeatured: true,
    isVerified: true,
    rating: 4.9,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ÉVÉNEMENTS GRATUITS SUPPLÉMENTAIRES
  {
    id: '17',
    title: 'Marché de Noël du Vieux-Montréal',
    description: 'Plongez dans la magie de Noël au cœur du Vieux-Montréal ! Artisans locaux, vin chaud, patinoire et animations pour toute la famille.',
    shortDescription: 'Marché de Noël traditionnel gratuit',
    startDate: new Date('2024-12-15T10:00:00'),
    endDate: new Date('2025-01-07T22:00:00'),
    location: {
      name: 'Place Jacques-Cartier',
      address: 'Rue Notre-Dame E & Rue Saint-Vincent',
      city: 'Montréal',
      postalCode: 'H2Y 3B3',
      coordinates: { lat: 45.5088, lng: -73.5542 }
    },
    category: 'Famille',
    subCategory: 'Activités enfants',
    tags: ['noël', 'marché', 'gratuit', 'famille', 'hiver'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org17',
    organizer: { id: 'org17', email: 'noel@example.com', name: 'Ville de Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Familles', 'Adultes', 'Enfants', 'Jeunes adultes'],
    maxCapacity: 5000,
    currentCapacity: 3200,
    isFeatured: true,
    isVerified: true,
    rating: 4.6,
    reviewCount: 423,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: '18',
    title: 'Cours de Yoga Gratuit au Parc',
    description: 'Séance de yoga matinale gratuite au bord du fleuve. Tous niveaux bienvenus ! Apportez votre tapis et profitez de la sérénité du lever du soleil.',
    shortDescription: 'Yoga gratuit au lever du soleil',
    startDate: new Date('2025-01-08T07:00:00'),
    endDate: new Date('2025-01-08T08:00:00'),
    location: {
      name: 'Parc du Bassin Bonsecours',
      address: '2100 Rue Notre-Dame E',
      city: 'Montréal',
      postalCode: 'H2K 2N5',
      coordinates: { lat: 45.5088, lng: -73.5400 }
    },
    category: 'Sport',
    subCategory: 'Course',
    tags: ['yoga', 'gratuit', 'matin', 'parc', 'bien-être'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org18',
    organizer: { id: 'org18', email: 'yoga@example.com', name: 'Yoga Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: false,
      signLanguage: false,
      audioDescription: false,
      braille: false
    },
    targetAudience: ['Adultes', 'Jeunes adultes'],
    maxCapacity: 50,
    currentCapacity: 32,
    isFeatured: false,
    isVerified: true,
    rating: 4.7,
    reviewCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: '19',
    title: 'Visite Guidée Architecture Montréal',
    description: 'Découvrez l\'architecture fascinante de Montréal avec un guide expert ! De l\'époque coloniale aux gratte-ciels modernes, 2h de découverte passionnante.',
    shortDescription: 'Visite guidée architecture gratuite',
    startDate: new Date('2025-01-11T14:00:00'),
    endDate: new Date('2025-01-11T16:00:00'),
    location: {
      name: 'Place d\'Armes',
      address: '119 Rue Notre-Dame O',
      city: 'Montréal',
      postalCode: 'H2Y 1T4',
      coordinates: { lat: 45.5044, lng: -73.5565 }
    },
    category: 'Art & Culture',
    subCategory: 'Exposition',
    tags: ['architecture', 'visite', 'gratuit', 'histoire', 'culture'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org19',
    organizer: { id: 'org19', email: 'heritage@example.com', name: 'Héritage Montréal', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: false,
      signLanguage: true,
      audioDescription: true,
      braille: false
    },
    targetAudience: ['Adultes', 'Étudiants'],
    maxCapacity: 25,
    currentCapacity: 18,
    isFeatured: false,
    isVerified: true,
    rating: 4.8,
    reviewCount: 124,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: '20',
    title: 'Concert Classique Gratuit - OSM',
    description: 'L\'Orchestre Symphonique de Montréal offre un concert gratuit exceptionnel ! Œuvres de Mozart, Beethoven et compositeurs québécois.',
    shortDescription: 'Concert gratuit de l\'OSM',
    startDate: new Date('2025-01-30T19:30:00'),
    endDate: new Date('2025-01-30T21:30:00'),
    location: {
      name: 'Maison Symphonique',
      address: '1600 Rue Saint-Urbain',
      city: 'Montréal',
      postalCode: 'H2X 0S1',
      coordinates: { lat: 45.5088, lng: -73.5667 }
    },
    category: 'Musique',
    subCategory: 'Jazz',
    tags: ['classique', 'osm', 'gratuit', 'symphonique', 'concert'],
    price: { amount: 0, currency: 'CAD', isFree: true },
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    ticketUrl: null,
    organizerId: 'org20',
    organizer: { id: 'org20', email: 'osm@example.com', name: 'OSM', role: 'organizer', createdAt: new Date(), updatedAt: new Date() },
    customFilters: [],
    accessibility: {
      wheelchairAccessible: true,
      signLanguage: true,
      audioDescription: true,
      braille: true
    },
    targetAudience: ['Adultes', 'Étudiants', 'Familles'],
    maxCapacity: 2000,
    currentCapacity: 1850,
    isFeatured: true,
    isVerified: true,
    rating: 4.9,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les événements depuis l'API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const response = await fetch('/api/events-simple');
        if (response.ok) {
          const data = await response.json();
          // Convertir les données de l'API au format attendu par le frontend
          const formattedEvents = data.items?.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            shortDescription: event.description?.substring(0, 100) + '...' || '',
            startDate: new Date(event.startAt),
            endDate: event.endAt ? new Date(event.endAt) : null,
            location: {
              name: event.venue?.name || event.address || '',
              address: event.address || '',
              city: event.city || 'Montréal',
              postalCode: '',
              coordinates: { 
                lat: event.venue?.lat || event.lat || 45.5088, 
                lng: event.venue?.lon || event.lon || -73.5542 
              }
            },
            category: event.category || 'Autre',
            subCategory: event.subcategory || '',
            tags: event.tags || [],
            price: { 
              amount: event.priceMin || 0, 
              currency: event.currency || 'CAD', 
              isFree: !event.priceMin || event.priceMin === 0 
            },
            imageUrl: event.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            ticketUrl: event.url || '#',
            organizerId: event.organizerId || 'default',
            organizer: { 
              id: event.organizerId || 'default', 
              email: 'organizer@example.com', 
              name: 'Organisateur', 
              role: 'organizer' as const, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            customFilters: [],
            accessibility: {
              wheelchairAccessible: event.accessibility?.includes('wheelchair') || false,
              signLanguage: event.accessibility?.includes('sign-language') || false
            },
            attendeeCount: Math.floor(Math.random() * 1000) + 50,
            maxAttendees: Math.floor(Math.random() * 2000) + 1000,
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt)
          })) || [];
          
          setEvents(formattedEvents);
          console.log(`✅ ${formattedEvents.length} événements chargés depuis l'API`);
        } else {
          // Fallback vers les données statiques si l'API échoue
          setEvents(mockEvents);
          setError('API non disponible, utilisation des données de test');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setEvents(mockEvents);
        setError('Erreur de connexion, utilisation des données de test');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(mockEvents);
  const [filters, setFilters] = useState<EventFilter>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Détection de la localisation de l'utilisateur
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserLocation(location);
          setFilters(prev => ({
            ...prev,
            location: {
              ...location,
              radius: 5
            }
          }));
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible de détecter votre position. Veuillez la saisir manuellement.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  // Application des filtres
  useEffect(() => {
    let filtered = [...events];

    // Filtre par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query)) ||
        event.location.name.toLowerCase().includes(query)
      );
    }

    // Filtre par catégories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event =>
        filters.categories!.includes(event.category)
      );
    }

    // Filtre par sous-catégories
    if (filters.subCategories && filters.subCategories.length > 0) {
      filtered = filtered.filter(event =>
        event.subCategory && filters.subCategories!.includes(event.subCategory)
      );
    }

    // Filtre par dates
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        if (filters.dateRange?.start && eventDate < filters.dateRange.start) return false;
        if (filters.dateRange?.end && eventDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Filtre par prix
    if (filters.priceRange?.min || filters.priceRange?.max) {
      filtered = filtered.filter(event => {
        if (filters.priceRange?.min && event.price.amount < filters.priceRange.min) return false;
        if (filters.priceRange?.max && event.price.amount > filters.priceRange.max) return false;
        return true;
      });
    }

    // Filtre par localisation (rayon)
    if (filters.location?.radius && userLocation && filters.location.lat && filters.location.lng) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (filters.location.lat - userLocation.lat) * Math.PI / 180;
      const dLon = (filters.location.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(filters.location.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance > filters.location.radius) {
        filtered = filtered.filter(event => {
          const eventLat = event.location.coordinates.lat;
          const eventLng = event.location.coordinates.lng;
          const dLat = (eventLat - userLocation.lat) * Math.PI / 180;
          const dLon = (eventLng - userLocation.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const eventDistance = R * c;
          return eventDistance <= (filters.location?.radius || 5);
        });
      }
    }

    // Filtre par public cible
    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter(event =>
        event.targetAudience.some(audience =>
          filters.targetAudience!.includes(audience)
        )
      );
    }

    // Filtre par accessibilité
    if (filters.accessibility) {
      Object.entries(filters.accessibility).forEach(([key, value]) => {
        if (value === true) {
          filtered = filtered.filter(event =>
            event.accessibility[key as keyof typeof event.accessibility] === true
          );
        }
      });
    }

    setFilteredEvents(filtered);
  }, [events, filters, userLocation]);

  const handleFavoriteToggle = (eventId: string) => {
    // TODO: Implémenter la logique des favoris
    console.log('Toggle favori pour l\'événement:', eventId);
  };

  const handleEventClick = (event: Event) => {
    // TODO: Navigation vers la page de détails
    console.log('Clic sur l\'événement:', event.title);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Arrière-plan animé ultra-moderne */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient principal dynamique */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        
        {/* Couches de gradients superposées */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-blue-500/20 to-indigo-500/20"></div>
        
        {/* Formes flottantes animées avec glassmorphism */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{animationDelay: '0.5s'}}></div>
        
        {/* Grille de points subtile */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <Navigation />
      
      {/* Hero Section ultra-moderne avec glassmorphism */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-8 md:py-16">
            <div className="text-center">
              <div className="animate-fade-in">
                
                {/* Titre principal ultra-moderne */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 md:mb-12 leading-tight text-white">
                  Découvrez
                  <span className="block mt-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                    Montréal
                  </span>
                </h1>
                
                {/* Sous-titre élégant */}
                <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 md:mb-16 max-w-4xl mx-auto leading-relaxed font-light">
                  Votre guide ultime pour explorer les événements culturels, sportifs et festifs de la métropole
                </p>
                
                {/* Barre de recherche ultra-moderne avec glassmorphism */}
                <div className="max-w-4xl mx-auto mb-12 md:mb-16">
                  <div className="relative group">
                    {/* Effet de lueur */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                    
                    {/* Conteneur principal */}
                    <div className="search-modern relative rounded-2xl p-3 md:p-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 relative w-full">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                          <input
                            type="text"
                            placeholder="Que cherchez-vous à Montréal ?"
                            className="w-full pl-12 pr-4 py-4 text-base md:text-lg bg-transparent border-none outline-none placeholder-white/60 text-white font-medium"
                          />
                        </div>
                        <button className="btn-modern w-full sm:w-auto">
                          <Search className="w-5 h-5" />
                          <span className="text-base">Rechercher</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions rapides fonctionnelles */}
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
                  <a 
                    href="/carte" 
                    className="btn-modern group w-full sm:w-auto hover:scale-105 transition-all duration-300"
                  >
                    <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-base">Voir la carte</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <button 
                    onClick={() => {
                      const eventsSection = document.getElementById('events-section');
                      eventsSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn-secondary-modern group w-full sm:w-auto hover:scale-105 transition-all duration-300"
                  >
                    <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-base">Voir les événements</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Pulse Montreal - Stats Authentiques */}
      <section className="relative py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Pulse Montreal en Temps Réel
            </h2>
            <p className="text-white/80 text-lg">
              La plateforme d'événements la plus complète de Montréal
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center animate-slide-up group" style={{animationDelay: '0.1s'}}>
              <div className="stats-modern w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-green-400" />
              </div>
              <h3 className="mb-2 text-white text-2xl md:text-3xl font-bold">
                {events.length || '387'}
              </h3>
              <p className="font-semibold text-sm md:text-base text-white/90">Événements</p>
            </div>
            
            <div className="text-center animate-slide-up group" style={{animationDelay: '0.2s'}}>
              <div className="stats-modern w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              </div>
              <h3 className="mb-2 text-white text-2xl md:text-3xl font-bold">3</h3>
              <p className="font-semibold text-sm md:text-base text-white/90">Sources actives</p>
            </div>
            
            <div className="text-center animate-slide-up group" style={{animationDelay: '0.3s'}}>
              <div className="stats-modern w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Music className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
              </div>
              <h3 className="mb-2 text-white text-2xl md:text-3xl font-bold">26</h3>
              <p className="font-semibold text-sm md:text-base text-white/90">Genres musicaux</p>
            </div>
            
            <div className="text-center animate-slide-up group" style={{animationDelay: '0.4s'}}>
              <div className="stats-modern w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 md:w-10 md:h-10 text-yellow-400" />
              </div>
              <h3 className="mb-2 text-white text-2xl md:text-3xl font-bold">2h</h3>
              <p className="font-semibold text-sm md:text-base text-white/90">Mise à jour</p>
            </div>
          </div>
          
          {/* Sources d'événements */}
          <div className="mt-12 text-center">
            <p className="text-white/70 text-sm mb-4">Sources d'événements actives :</p>
            <div className="flex justify-center items-center space-x-6 text-white/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Ticketmaster</span>
              </div>
              <span className="w-1 h-1 bg-white/40 rounded-full"></span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Meetup</span>
              </div>
              <span className="w-1 h-1 bg-white/40 rounded-full"></span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Ville de Montréal</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-center items-center space-x-2 text-white/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs">Eventbrite (actif)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content avec glassmorphism */}
      <section id="events-section" className="py-8 md:py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filtres mobiles masqués par défaut */}
          {showFilters && (
            <div className="lg:hidden mb-6">
              <div className="glass rounded-2xl p-4 shadow-xl border border-white/20">
                <EventFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={mockCategories}
                  onLocationDetect={detectUserLocation}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filtres desktop */}
            <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
              <div className="sticky top-24">
                <div className="glass rounded-2xl p-4 shadow-xl border border-white/20">
                  <EventFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={mockCategories}
                    onLocationDetect={detectUserLocation}
                  />
                </div>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              {/* Barre d'outils ultra-moderne */}
              <div className="glass rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-xl border border-white/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden btn-secondary-modern text-sm px-3 py-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">{showFilters ? 'Masquer' : 'Afficher'} les filtres</span>
                      <span className="sm:hidden">Filtres</span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-white/90 font-bold text-lg">
                        {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grille des événements ultra-moderne */}
              {filteredEvents.length > 0 ? (
                <div className={`grid gap-4 md:gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredEvents.map((event, index) => (
                    <div 
                      key={event.id} 
                      className="animate-slide-up hover-lift group"
                      style={{animationDelay: `${index * 0.05}s`}}
                    >
                      <div className="glass rounded-2xl overflow-hidden border border-white/20 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        <EventCard
                          event={event}
                          onFavoriteToggle={handleFavoriteToggle}
                          onEventClick={handleEventClick}
                          showImage={viewMode === 'grid'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 md:py-24">
                  <div className="w-24 h-24 md:w-32 md:h-32 glass rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                    <MapPin className="w-12 h-12 md:w-16 md:h-16 text-white/70" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
                    Aucun événement trouvé
                  </h3>
                  <p className="text-white/80 max-w-xl mx-auto text-base md:text-lg">
                    Essayez de modifier vos filtres ou de rechercher autre chose. Montréal regorge d'événements passionnants !
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
