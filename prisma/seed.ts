/**
 * Script de seed pour Pulse Montreal
 * Génère des données de test réalistes pour Montréal
 */

import { PrismaClient } from '@prisma/client';
import { 
  UserRole, 
  EventCategory, 
  EventLanguage, 
  EventStatus, 
  EventSource,
  PromotionKind 
} from '@prisma/client';

const prisma = new PrismaClient();

// Données de base pour Montréal
const MONTREAL_VENUES = [
  {
    name: 'Place des Arts',
    address: '175 Rue Sainte-Catherine O',
    city: 'Montréal',
    postalCode: 'H2X 1Z8',
    lat: 45.5088,
    lon: -73.5673,
    neighborhood: 'Quartier des spectacles',
    website: 'https://placedesarts.com',
  },
  {
    name: 'Club Soda',
    address: '1225 Boul Saint-Laurent',
    city: 'Montréal',
    postalCode: 'H2X 2S6',
    lat: 45.5108,
    lon: -73.5697,
    neighborhood: 'Quartier des spectacles',
    website: 'https://clubsoda.ca',
  },
  {
    name: 'Théâtre Corona',
    address: '2490 Rue Notre-Dame O',
    city: 'Montréal',
    postalCode: 'H3J 1N5',
    lat: 45.4767,
    lon: -73.5821,
    neighborhood: 'Saint-Henri',
  },
  {
    name: 'Parc Jean-Drapeau',
    address: '1 Circuit Gilles Villeneuve',
    city: 'Montréal',
    postalCode: 'H3C 1A9',
    lat: 45.5017,
    lon: -73.5341,
    neighborhood: 'Île Sainte-Hélène',
  },
  {
    name: 'Musée des beaux-arts de Montréal',
    address: '1380 Rue Sherbrooke O',
    city: 'Montréal',
    postalCode: 'H3G 1J5',
    lat: 45.4986,
    lon: -73.5794,
    neighborhood: 'Centre-ville',
    website: 'https://mbam.qc.ca',
  },
  {
    name: 'Métropolis',
    address: '59 Rue Sainte-Catherine E',
    city: 'Montréal',
    postalCode: 'H2X 1K5',
    lat: 45.5115,
    lon: -73.5626,
    neighborhood: 'Quartier des spectacles',
  },
  {
    name: 'Stade olympique',
    address: '4545 Av Pierre-De Coubertin',
    city: 'Montréal',
    postalCode: 'H1V 0B2',
    lat: 45.5576,
    lon: -73.5515,
    neighborhood: 'Hochelaga-Maisonneuve',
  },
  {
    name: 'Théâtre du Nouveau Monde',
    address: '84 Rue Sainte-Catherine O',
    city: 'Montréal',
    postalCode: 'H2X 1Z5',
    lat: 45.5087,
    lon: -73.5652,
    neighborhood: 'Quartier des spectacles',
  },
];

const EVENT_TEMPLATES = [
  // Musique
  {
    title: 'Festival International de Jazz de Montréal',
    description: 'Le plus grand festival de jazz au monde revient avec une programmation exceptionnelle mettant en vedette les plus grands noms du jazz international et local.',
    category: EventCategory.MUSIC,
    subcategory: 'Jazz',
    tags: ['festival', 'jazz', 'international', 'extérieur'],
    language: EventLanguage.BOTH,
    priceMin: 0,
    priceMax: 12500, // 125$ en cents
  },
  {
    title: 'Soirée Reggae avec Alpha Blondy',
    description: 'Une soirée exceptionnelle avec la légende du reggae ivoirien Alpha Blondy. Venez vibrer aux rythmes de ses plus grands succès.',
    category: EventCategory.MUSIC,
    subcategory: 'Reggae',
    tags: ['reggae', 'concert', 'Alpha Blondy', 'world music'],
    language: EventLanguage.FR,
    priceMin: 4500, // 45$
    priceMax: 8500, // 85$
  },
  {
    title: 'Nuit Techno au Stereo',
    description: 'Une nuit de techno underground avec les meilleurs DJs locaux et internationaux. Ambiance électrisante garantie jusqu\'au petit matin.',
    category: EventCategory.NIGHTLIFE,
    subcategory: 'Techno',
    tags: ['techno', 'electronic', 'nightclub', '18+'],
    language: EventLanguage.EN,
    priceMin: 2000, // 20$
    priceMax: 3500, // 35$
  },
  
  // Théâtre
  {
    title: 'Les Misérables - Comédie Musicale',
    description: 'La célèbre comédie musicale de Claude-Michel Schönberg revient sur scène avec une mise en scène grandiose et des costumes somptueux.',
    category: EventCategory.THEATRE,
    subcategory: 'Comédie musicale',
    tags: ['musical', 'théâtre', 'classique', 'famille'],
    language: EventLanguage.FR,
    priceMin: 5500, // 55$
    priceMax: 15000, // 150$
  },
  {
    title: 'Stand-up Comedy avec Sugar Sammy',
    description: 'Le roi de l\'humour québécois présente son nouveau spectacle hilarant qui mélange français et anglais avec un talent inégalé.',
    category: EventCategory.THEATRE,
    subcategory: 'Humour',
    tags: ['humour', 'stand-up', 'Sugar Sammy', 'bilingue'],
    language: EventLanguage.BOTH,
    priceMin: 4000, // 40$
    priceMax: 7500, // 75$
  },

  // Art et Culture
  {
    title: 'Exposition Picasso - Œuvres Méconnues',
    description: 'Découvrez une collection exceptionnelle d\'œuvres méconnues de Pablo Picasso, présentée pour la première fois au Canada.',
    category: EventCategory.EXHIBITION,
    subcategory: 'Peinture',
    tags: ['art', 'Picasso', 'peinture', 'exposition', 'culture'],
    language: EventLanguage.BOTH,
    priceMin: 2500, // 25$
    priceMax: 3500, // 35$
  },
  {
    title: 'Vernissage - Artistes Émergents du Québec',
    description: 'Rencontrez les nouveaux talents de la scène artistique québécoise lors de ce vernissage exclusif avec cocktail et musique live.',
    category: EventCategory.EXHIBITION,
    subcategory: 'Art contemporain',
    tags: ['vernissage', 'art contemporain', 'québécois', 'émergent', 'gratuit'],
    language: EventLanguage.FR,
    priceMin: 0,
    priceMax: 0,
  },

  // Famille
  {
    title: 'Cirque du Soleil - Spectacle Familial',
    description: 'Un spectacle magique du Cirque du Soleil spécialement conçu pour toute la famille. Acrobaties, musique et émerveillement garantis.',
    category: EventCategory.FAMILY,
    subcategory: 'Cirque',
    tags: ['cirque', 'famille', 'enfants', 'Cirque du Soleil', 'spectacle'],
    language: EventLanguage.BOTH,
    priceMin: 3500, // 35$
    priceMax: 12000, // 120$
  },
  {
    title: 'Atelier Cuisine Parent-Enfant',
    description: 'Apprenez à cuisiner ensemble lors de cet atelier interactif. Recettes simples et délicieuses adaptées aux petites mains.',
    category: EventCategory.FAMILY,
    subcategory: 'Atelier',
    tags: ['cuisine', 'atelier', 'parent-enfant', 'apprentissage', 'famille'],
    language: EventLanguage.FR,
    priceMin: 2500, // 25$
    priceMax: 2500,
  },

  // Sport
  {
    title: 'Match Canadiens vs Bruins',
    description: 'Le classique de la rivalité hockey entre les Canadiens de Montréal et les Bruins de Boston. Atmosphère électrisante au Centre Bell.',
    category: EventCategory.SPORT,
    subcategory: 'Hockey',
    tags: ['hockey', 'Canadiens', 'NHL', 'Centre Bell', 'sport'],
    language: EventLanguage.BOTH,
    priceMin: 7500, // 75$
    priceMax: 35000, // 350$
  },
  {
    title: 'Marathon de Montréal',
    description: 'Participez au Marathon International de Montréal qui traverse les plus beaux quartiers de la ville. Inscription ouverte à tous.',
    category: EventCategory.SPORT,
    subcategory: 'Course',
    tags: ['marathon', 'course', 'sport', 'participation', 'plein-air'],
    language: EventLanguage.BOTH,
    priceMin: 8500, // 85$
    priceMax: 12500, // 125$
  },

  // Éducation
  {
    title: 'Conférence IA et Futur du Travail',
    description: 'Conférence sur l\'impact de l\'intelligence artificielle sur le marché du travail avec des experts internationaux.',
    category: EventCategory.EDUCATION,
    subcategory: 'Technologie',
    tags: ['IA', 'intelligence artificielle', 'travail', 'technologie', 'conférence'],
    language: EventLanguage.FR,
    priceMin: 5000, // 50$
    priceMax: 15000, // 150$
  },
  {
    title: 'Atelier Photographie de Rue',
    description: 'Apprenez les techniques de la photographie de rue avec un photographe professionnel. Sortie pratique dans le Vieux-Montréal incluse.',
    category: EventCategory.EDUCATION,
    subcategory: 'Photographie',
    tags: ['photographie', 'atelier', 'apprentissage', 'rue', 'pratique'],
    language: EventLanguage.FR,
    priceMin: 7500, // 75$
    priceMax: 7500,
  },
];

async function main() {
  console.log('🌱 Début du seeding de Pulse Montreal...');

  // 1. Créer les catégories
  console.log('📁 Création des catégories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'musique' },
      update: {},
      create: {
        name: 'Musique',
        nameEn: 'Music',
        slug: 'musique',
        icon: '🎵',
        color: '#E53935',
        description: 'Concerts, festivals et événements musicaux',
        descriptionEn: 'Concerts, festivals and musical events',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'theatre' },
      update: {},
      create: {
        name: 'Théâtre',
        nameEn: 'Theatre',
        slug: 'theatre',
        icon: '🎭',
        color: '#374151',
        description: 'Pièces de théâtre, comédies et spectacles',
        descriptionEn: 'Plays, comedies and shows',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'art-culture' },
      update: {},
      create: {
        name: 'Art & Culture',
        nameEn: 'Art & Culture',
        slug: 'art-culture',
        icon: '🎨',
        color: '#9B59B6',
        description: 'Expositions, vernissages et événements culturels',
        descriptionEn: 'Exhibitions, openings and cultural events',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'famille' },
      update: {},
      create: {
        name: 'Famille',
        nameEn: 'Family',
        slug: 'famille',
        icon: '👨‍👩‍👧‍👦',
        color: '#F39C12',
        description: 'Activités et événements familiaux',
        descriptionEn: 'Family activities and events',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sport' },
      update: {},
      create: {
        name: 'Sport',
        nameEn: 'Sports',
        slug: 'sport',
        icon: '⚽',
        color: '#3498DB',
        description: 'Événements sportifs et activités physiques',
        descriptionEn: 'Sports events and physical activities',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'education' },
      update: {},
      create: {
        name: 'Éducation',
        nameEn: 'Education',
        slug: 'education',
        icon: '📚',
        color: '#27AE60',
        description: 'Conférences, ateliers et formations',
        descriptionEn: 'Conferences, workshops and training',
        sortOrder: 6,
      },
    }),
  ]);

  // 2. Créer les quartiers de Montréal
  console.log('🏘️ Création des quartiers...');
  const neighborhoods = await Promise.all([
    prisma.neighborhood.upsert({
      where: { slug: 'quartier-des-spectacles' },
      update: {},
      create: {
        name: 'Quartier des spectacles',
        nameEn: 'Entertainment District',
        slug: 'quartier-des-spectacles',
        centerLat: 45.5088,
        centerLon: -73.5673,
      },
    }),
    prisma.neighborhood.upsert({
      where: { slug: 'vieux-montreal' },
      update: {},
      create: {
        name: 'Vieux-Montréal',
        nameEn: 'Old Montreal',
        slug: 'vieux-montreal',
        centerLat: 45.5017,
        centerLon: -73.5540,
      },
    }),
    prisma.neighborhood.upsert({
      where: { slug: 'plateau-mont-royal' },
      update: {},
      create: {
        name: 'Plateau-Mont-Royal',
        nameEn: 'Plateau-Mont-Royal',
        slug: 'plateau-mont-royal',
        centerLat: 45.5276,
        centerLon: -73.5794,
      },
    }),
    prisma.neighborhood.upsert({
      where: { slug: 'mile-end' },
      update: {},
      create: {
        name: 'Mile End',
        nameEn: 'Mile End',
        slug: 'mile-end',
        centerLat: 45.5276,
        centerLon: -73.6103,
      },
    }),
  ]);

  // 3. Créer des utilisateurs de test
  console.log('👥 Création des utilisateurs...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pulse-montreal.com' },
    update: {},
    create: {
      email: 'admin@pulse-montreal.com',
      name: 'Admin Pulse',
      role: UserRole.ADMIN,
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@pulse-montreal.com' },
    update: {},
    create: {
      email: 'organizer@pulse-montreal.com',
      name: 'Organisateur Test',
      role: UserRole.ORGANIZER,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@pulse-montreal.com' },
    update: {},
    create: {
      email: 'user@pulse-montreal.com',
      name: 'Utilisateur Test',
      role: UserRole.USER,
    },
  });

  // 4. Créer un profil organisateur
  const organizer = await prisma.organizer.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: {
      userId: organizerUser.id,
      displayName: 'Événements Pulse',
      website: 'https://pulse-montreal.com',
      verified: true,
      socials: {
        facebook: 'https://facebook.com/pulse-montreal',
        instagram: 'https://instagram.com/pulse_montreal',
        twitter: 'https://twitter.com/pulse_montreal',
      },
    },
  });

  // 5. Créer les venues
  console.log('🏢 Création des lieux...');
  const venues = await Promise.all(
    MONTREAL_VENUES.map(venueData =>
      prisma.venue.upsert({
        where: { 
          id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') 
        },
        update: {},
        create: {
          id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          ...venueData,
        },
      })
    )
  );

  // 6. Créer les événements
  console.log('🎉 Création des événements...');
  const events = [];
  
  for (let i = 0; i < EVENT_TEMPLATES.length * 3; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    
    // Dates aléatoires dans les 3 prochains mois
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90) + 1);
    startDate.setHours(Math.floor(Math.random() * 12) + 18); // Entre 18h et 6h
    startDate.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 4) + 1);

    const event = await prisma.event.create({
      data: {
        title: `${template.title} ${i > EVENT_TEMPLATES.length ? `#${Math.floor(i / EVENT_TEMPLATES.length) + 1}` : ''}`,
        description: template.description,
        startAt: startDate,
        endAt: endDate,
        timezone: 'America/Montreal',
        status: EventStatus.SCHEDULED,
        source: EventSource.INTERNAL,
        sourceId: `seed-${i}`,
        venueId: venue.id,
        organizerId: organizer.id,
        url: `https://pulse-montreal.com/events/seed-${i}`,
        priceMin: template.priceMin,
        priceMax: template.priceMax,
        currency: 'CAD',
        language: template.language,
        tags: template.tags,
        category: template.category,
        subcategory: template.subcategory,
        accessibility: Math.random() > 0.7 ? ['wheelchair'] : [],
        imageUrl: `https://picsum.photos/800/600?random=${i}`,
      },
    });

    events.push(event);
  }

  // 7. Créer quelques promotions
  console.log('💫 Création des promotions...');
  const featuredEvents = events.slice(0, 5);
  
  for (const event of featuredEvents) {
    await prisma.promotion.create({
      data: {
        eventId: event.id,
        kind: PromotionKind.FEATURED,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        priceCents: Math.floor(Math.random() * 10000) + 5000, // 50-150$
      },
    });
  }

  // 8. Créer des préférences utilisateur
  console.log('⚙️ Création des préférences...');
  await prisma.userPreferences.createMany({
    data: [
      {
        userId: adminUser.id,
        favoriteCategories: ['musique', 'theatre'],
        language: 'fr',
      },
      {
        userId: organizerUser.id,
        favoriteCategories: ['art-culture', 'education'],
        language: 'fr',
      },
      {
        userId: regularUser.id,
        favoriteCategories: ['musique', 'sport', 'famille'],
        language: 'fr',
      },
    ],
    skipDuplicates: true,
  });

  // 9. Créer quelques favoris
  console.log('❤️ Création des favoris...');
  const favoriteEvents = events.slice(0, 8);
  
  for (const event of favoriteEvents) {
    await prisma.favorite.createMany({
      data: [
        { userId: regularUser.id, eventId: event.id },
        ...(Math.random() > 0.5 ? [{ userId: organizerUser.id, eventId: event.id }] : []),
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Seeding terminé avec succès !');
  console.log(`📊 Résumé :`);
  console.log(`  - ${categories.length} catégories`);
  console.log(`  - ${neighborhoods.length} quartiers`);
  console.log(`  - 3 utilisateurs (admin, organisateur, utilisateur)`);
  console.log(`  - ${venues.length} lieux`);
  console.log(`  - ${events.length} événements`);
  console.log(`  - ${featuredEvents.length} promotions`);
  console.log(`  - Favoris et préférences créés`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
