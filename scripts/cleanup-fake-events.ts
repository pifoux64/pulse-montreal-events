import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/lib/prisma';
import { EventSource } from '@prisma/client';

async function main() {
  console.log('🧹 Suppression des événements non Ticketmaster...');
  const result = await prisma.event.deleteMany({
    where: {
      source: {
        not: EventSource.TICKETMASTER,
      },
    },
  });
  console.log(`✅ ${result.count} événements supprimés (sources ≠ TICKETMASTER)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
