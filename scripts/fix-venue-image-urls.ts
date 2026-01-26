/**
 * Script pour convertir toutes les URLs thumbnails Wikimedia en URLs originales
 * Met à jour directement la base de données
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Mapping des URLs incorrectes vers les vraies URLs originales
 * Certains chemins dans les URLs sont incorrects, on doit les corriger manuellement
 */
const URL_MAPPING: Record<string, string> = {
  // Place des Arts - le chemin /4/4e/ est incorrect, le vrai chemin est /0/03/
  '/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg': '/0/03/Place_des_Arts_de_Montr%C3%A9al.jpg',
  '4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg': '0/03/Place_des_Arts_de_Montr%C3%A9al.jpg',
  // Club Soda - le chemin /0/0a/ est incorrect, le vrai chemin est /0/09/
  '/0/0a/Club_Soda%2C_Montr%C3%A9al_2011.jpg': '/0/09/Club_Soda%2C_Montr%C3%A9al_2011.jpg',
  '0/0a/Club_Soda%2C_Montr%C3%A9al_2011.jpg': '0/09/Club_Soda%2C_Montr%C3%A9al_2011.jpg',
  // Casino - le chemin /4/4a/ est incorrect, le vrai chemin est /b/be/
  '/4/4a/Casino_de_Montreal.JPG': '/b/be/Casino_de_Montreal.JPG',
  '4/4a/Casino_de_Montreal.JPG': 'b/be/Casino_de_Montreal.JPG',
  // Basilique Notre-Dame - le chemin /4/4f/ est incorrect, le vrai chemin est /b/ba/
  '/4/4f/Notre-Dame_Basilica_Montreal.jpg': '/b/ba/Notre_Dame_Basilica_Montreal.jpg',
  '4/4f/Notre-Dame_Basilica_Montreal.jpg': 'b/ba/Notre_Dame_Basilica_Montreal.jpg',
  // Stade Saputo - le chemin /8/8a/Saputo_Stadium_2012.jpg est incorrect, le vrai chemin est /b/b6/Saputo_Stadium.jpg
  '/8/8a/Saputo_Stadium_2012.jpg': '/b/b6/Saputo_Stadium.jpg',
  '8/8a/Saputo_Stadium_2012.jpg': 'b/b6/Saputo_Stadium.jpg',
};

/**
 * Convertit une URL de thumbnail Wikimedia en URL originale
 */
function convertToOriginalUrl(thumbnailUrl: string): string | null {
  try {
    const urlObj = new URL(thumbnailUrl);
    const pathname = urlObj.pathname;
    
    // Vérifier d'abord le mapping manuel pour les chemins incorrects (même si pas thumbnail)
    for (const [wrongPath, correctPath] of Object.entries(URL_MAPPING)) {
      if (pathname.includes(wrongPath)) {
        urlObj.pathname = pathname.replace(wrongPath, correctPath);
        return urlObj.toString();
      }
    }
    
    // Si c'est déjà une URL originale (pas de /thumb/), vérifier quand même le mapping
    if (!thumbnailUrl.includes('/thumb/')) {
      return null; // Pas besoin de conversion
    }
  
  try {
    const urlObj = new URL(thumbnailUrl);
    let pathname = urlObj.pathname;
    
    // Format thumbnail: /wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg
    // Format original: /wikipedia/commons/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg
    
    // Remplacer /thumb/ par rien et supprimer la dernière partie (dimensions)
    const match = pathname.match(/^(\/wikipedia\/commons)\/thumb\/(.+?)\/(\d+px-.+)$/);
    if (match) {
      // match[1] = /wikipedia/commons
      // match[2] = 4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg
      pathname = `${match[1]}/${match[2]}`;
    } else {
      // Fallback: méthode simple
      pathname = pathname.replace(/\/thumb\//, '/');
      const parts = pathname.split('/');
      // Supprimer la dernière partie qui contient les dimensions
      if (parts.length > 0 && parts[parts.length - 1].match(/^\d+px-/)) {
        parts.pop();
        pathname = parts.join('/');
      }
    }
    
    urlObj.pathname = pathname;
    return urlObj.toString();
  } catch (error) {
    console.warn(`Erreur de conversion URL: ${thumbnailUrl}`, error);
    return null;
  }
}

/**
 * Met à jour toutes les URLs thumbnails en URLs originales
 */
async function fixImageUrls() {
  console.log('🔧 Correction des URLs d\'images...\n');
  
  const venues = await prisma.venue.findMany({
    where: {
      imageUrl: {
        not: null,
        contains: 'wikimedia',
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });
  
  console.log(`📊 ${venues.length} venues avec images Wikimedia à vérifier\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const venue of venues) {
    if (!venue.imageUrl) continue;
    
    const originalUrl = convertToOriginalUrl(venue.imageUrl);
    
    if (originalUrl === null) {
      // URL déjà originale, pas besoin de conversion
      skippedCount++;
      continue;
    }
    
    try {
      await prisma.venue.update({
        where: { id: venue.id },
        data: { imageUrl: originalUrl },
      });
      
      console.log(`✅ ${venue.name}`);
      console.log(`   ${venue.imageUrl.substring(0, 80)}...`);
      console.log(`   → ${originalUrl.substring(0, 80)}...\n`);
      
      updatedCount++;
    } catch (error) {
      console.error(`❌ Erreur pour ${venue.name}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ ${updatedCount} URLs corrigées`);
  console.log(`   ⏭️  ${skippedCount} URLs déjà originales`);
  console.log(`   ❌ ${errorCount} erreurs`);
}

// Exécuter le script
fixImageUrls()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
