/**
 * Script pour donner le rôle ADMIN à un utilisateur
 * Usage: tsx scripts/make-admin.ts your@email.com
 */

import { prisma } from '../src/lib/prisma';

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.error(`❌ Utilisateur avec l'email "${email}" non trouvé.`);
      console.log('\n💡 Créez d\'abord un compte en vous connectant sur le site.');
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ L'utilisateur ${email} a déjà le rôle ADMIN.`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Rôle ADMIN accordé à ${email}`);
    console.log(`\n🔐 Vous pouvez maintenant accéder à /admin/ingestion`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: tsx scripts/make-admin.ts your@email.com');
  console.log('\n📝 Exemple: tsx scripts/make-admin.ts admin@pulse-montreal.com');
  process.exit(1);
}

makeAdmin(email);









