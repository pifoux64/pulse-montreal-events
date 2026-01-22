/**
 * Script pour vérifier les pulsers disponibles dans la base de données
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔍 Vérification des pulsers dans la base de données\n');

  try {
    // Compter les utilisateurs
    const usersCount = await prisma.user.count({
      where: {
        role: 'USER',
      },
    });
    console.log(`📊 Utilisateurs (role=USER): ${usersCount}`);

    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`   Premiers utilisateurs:`);
    users.forEach((u, i) => {
      console.log(`     ${i + 1}. ${u.name || u.email || 'Anonyme'} (${u.id.substring(0, 8)}...)`);
    });

    // Compter les venues
    const venuesCount = await prisma.venue.count();
    console.log(`\n🏢 Venues: ${venuesCount}`);

    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`   Premières venues:`);
    venues.forEach((v, i) => {
      console.log(`     ${i + 1}. ${v.name} (${v.slug || 'pas de slug'}) - ${v._count.events} événements`);
    });

    // Compter les organisateurs
    const organizersCount = await prisma.organizer.count();
    console.log(`\n👤 Organisateurs: ${organizersCount}`);

    const organizers = await prisma.organizer.findMany({
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      take: 5,
      orderBy: {
        id: 'desc',
      },
    });
    console.log(`   Premiers organisateurs:`);
    organizers.forEach((o, i) => {
      console.log(`     ${i + 1}. ${o.displayName} (${o.slug || 'pas de slug'}) - ${o._count.events} événements`);
      if (o.user) {
        console.log(`        User: ${o.user.name || 'Anonyme'}`);
      }
    });

    console.log(`\n✅ Vérification terminée`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
