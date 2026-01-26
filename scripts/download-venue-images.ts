/**
 * Script pour télécharger et précharger les images des venues
 * Télécharge les images depuis Wikimedia Commons et les stocke localement
 * Met à jour les URLs dans la base de données pour pointer vers les images locales
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

const VENUES_IMAGES_DIR = path.join(process.cwd(), 'public', 'venues');

// Créer le dossier si il n'existe pas
if (!fs.existsSync(VENUES_IMAGES_DIR)) {
  fs.mkdirSync(VENUES_IMAGES_DIR, { recursive: true });
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url: string, filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://commons.wikimedia.org/',
      },
    };
    
    protocol.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Suivre les redirections
        return downloadImage(response.headers.location!, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Téléchargé: ${path.basename(filePath)}`);
        resolve(true);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Supprimer le fichier partiel
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Convertit une URL de thumbnail Wikimedia en URL originale
 */
function convertToOriginalUrl(thumbnailUrl: string): string {
  // Si c'est déjà une URL originale (pas de /thumb/), la retourner telle quelle
  if (!thumbnailUrl.includes('/thumb/')) {
    return thumbnailUrl;
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
    return thumbnailUrl;
  }
}

/**
 * Génère un nom de fichier à partir du slug de la venue
 */
function generateFileName(venueSlug: string | null, venueName: string, imageUrl: string): string {
  // Utiliser le slug si disponible, sinon générer un slug à partir du nom
  const slug = venueSlug || venueName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Extraire l'extension de l'URL
  const urlPath = new URL(imageUrl).pathname;
  const extension = path.extname(urlPath) || '.jpg';
  
  return `${slug}${extension}`;
}

/**
 * Télécharge toutes les images des venues
 */
async function downloadVenueImages() {
  console.log('📥 Début du téléchargement des images des venues...\n');
  
  const venues = await prisma.venue.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
    },
  });
  
  console.log(`📊 ${venues.length} venues avec images à télécharger\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const updates: Array<{ id: string; localPath: string }> = [];
  
  for (const venue of venues) {
    if (!venue.imageUrl) continue;
    
    try {
      // Convertir l'URL thumbnail en URL originale
      const originalUrl = convertToOriginalUrl(venue.imageUrl);
      const fileName = generateFileName(venue.slug, venue.name, originalUrl);
      const filePath = path.join(VENUES_IMAGES_DIR, fileName);
      
      // Vérifier si l'image existe déjà
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Déjà présent: ${fileName}`);
        updates.push({
          id: venue.id,
          localPath: `/venues/${fileName}`,
        });
        successCount++;
        continue;
      }
      
      console.log(`⬇️  Téléchargement: ${venue.name}...`);
      
      try {
        await downloadImage(originalUrl, filePath);
        
        updates.push({
          id: venue.id,
          localPath: `/venues/${fileName}`,
        });
        
        successCount++;
      } catch (downloadError) {
        // Si le téléchargement échoue, essayer avec l'URL originale de la BD (thumbnail)
        if (originalUrl !== venue.imageUrl && venue.imageUrl.includes('/thumb/')) {
          console.log(`   ⚠️  Tentative avec URL thumbnail...`);
          try {
            await downloadImage(venue.imageUrl, filePath);
            updates.push({
              id: venue.id,
              localPath: `/venues/${fileName}`,
            });
            successCount++;
          } catch (retryError) {
            // Si les deux échouent, on garde l'URL externe dans la BD
            console.log(`   ⏭️  Image non disponible, URL externe conservée`);
            // Ne pas mettre à jour cette venue
          }
        } else {
          // Si les deux échouent, on garde l'URL externe dans la BD
          console.log(`   ⏭️  Image non disponible, URL externe conservée`);
        }
      }
      
      // Pause plus longue pour éviter le rate limiting (429)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Erreur pour ${venue.name}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ ${successCount} images téléchargées/mises à jour`);
  console.log(`   ❌ ${errorCount} erreurs`);
  
  // Mettre à jour la base de données avec les chemins locaux
  console.log(`\n💾 Mise à jour de la base de données...`);
  
  for (const update of updates) {
    await prisma.venue.update({
      where: { id: update.id },
      data: { imageUrl: update.localPath },
    });
  }
  
  console.log(`✅ ${updates.length} venues mises à jour dans la base de données`);
}

// Exécuter le script
downloadVenueImages()
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
