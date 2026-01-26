/**
 * Script pour télécharger et précharger les images des venues
 * Télécharge les images depuis Wikimedia Commons et les stocke dans Supabase Storage
 * Met à jour les URLs dans la base de données pour pointer vers les images Supabase
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'venues';

/**
 * Télécharge une image depuis une URL et retourne le buffer
 */
async function downloadImageBuffer(url: string): Promise<Buffer> {
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
        return downloadImageBuffer(response.headers.location!)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload une image vers Supabase Storage
 */
async function uploadToSupabase(fileName: string, buffer: Buffer, contentType: string = 'image/jpeg'): Promise<string> {
  // Vérifier si le bucket existe, sinon le créer
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`📦 Création du bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      throw new Error(`Erreur création bucket: ${createError.message}`);
    }
  }
  
  // Vérifier si le fichier existe déjà
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path.dirname(fileName) || '.', {
      limit: 1000,
    });
  
  const fileExists = existingFiles?.some(f => f.name === path.basename(fileName));
  
  if (fileExists) {
    console.log(`⏭️  Fichier déjà présent dans Supabase: ${fileName}`);
    // Retourner l'URL publique
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    return data.publicUrl;
  }
  
  // Uploader le fichier
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType,
      upsert: false,
    });
  
  if (error) {
    throw new Error(`Erreur upload Supabase: ${error.message}`);
  }
  
  // Retourner l'URL publique
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);
  
  console.log(`✅ Uploadé vers Supabase: ${fileName}`);
  return urlData.publicUrl;
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
  const updates: Array<{ id: string; supabaseUrl: string }> = [];
  
  for (const venue of venues) {
    if (!venue.imageUrl) continue;
    
    try {
      // Convertir l'URL thumbnail en URL originale
      const originalUrl = convertToOriginalUrl(venue.imageUrl);
      const fileName = generateFileName(venue.slug, venue.name, originalUrl);
      
      console.log(`⬇️  Téléchargement: ${venue.name}...`);
      
      try {
        // Télécharger l'image en mémoire
        const imageBuffer = await downloadImageBuffer(originalUrl);
        
        // Déterminer le type MIME
        const extension = path.extname(fileName).toLowerCase();
        const contentType = extension === '.png' ? 'image/png' : 
                           extension === '.gif' ? 'image/gif' : 
                           extension === '.webp' ? 'image/webp' : 'image/jpeg';
        
        // Uploader vers Supabase Storage
        const supabaseUrl = await uploadToSupabase(fileName, imageBuffer, contentType);
        
        updates.push({
          id: venue.id,
          supabaseUrl,
        });
        
        successCount++;
      } catch (downloadError) {
        // Si le téléchargement échoue, essayer avec l'URL originale de la BD (thumbnail)
        if (originalUrl !== venue.imageUrl && venue.imageUrl.includes('/thumb/')) {
          console.log(`   ⚠️  Tentative avec URL thumbnail...`);
          try {
            const imageBuffer = await downloadImageBuffer(venue.imageUrl);
            const extension = path.extname(fileName).toLowerCase();
            const contentType = extension === '.png' ? 'image/png' : 
                               extension === '.gif' ? 'image/gif' : 
                               extension === '.webp' ? 'image/webp' : 'image/jpeg';
            const supabaseUrl = await uploadToSupabase(fileName, imageBuffer, contentType);
            updates.push({
              id: venue.id,
              supabaseUrl,
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
  
  // Mettre à jour la base de données avec les URLs Supabase
  console.log(`\n💾 Mise à jour de la base de données...`);
  
  for (const update of updates) {
    await prisma.venue.update({
      where: { id: update.id },
      data: { imageUrl: update.supabaseUrl },
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
