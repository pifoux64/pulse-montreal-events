/**
 * Script pour créer le bucket Supabase Storage "events"
 * Usage: npx tsx scripts/create-supabase-bucket.ts
 * 
 * Ce script crée le bucket "events" dans Supabase Storage s'il n'existe pas déjà.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'events';

async function main() {
  try {
    console.log(`🔍 Vérification du bucket "${BUCKET_NAME}"...`);
    
    // Lister les buckets existants
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur lors de la liste des buckets:', listError.message);
      console.error('\n💡 Vérifiez que:');
      console.error('   1. SUPABASE_SERVICE_ROLE_KEY est correctement configuré');
      console.error('   2. Votre projet Supabase a Storage activé');
      console.error('   3. Vous avez les permissions nécessaires');
      process.exit(1);
    }
    
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Le bucket "${BUCKET_NAME}" existe déjà`);
      
      // Vérifier les permissions
      const bucket = buckets?.find(b => b.name === BUCKET_NAME);
      if (bucket) {
        console.log(`   - Public: ${bucket.public ? 'Oui' : 'Non'}`);
        console.log(`   - Créé le: ${bucket.created_at}`);
      }
      
      process.exit(0);
    }
    
    console.log(`📦 Création du bucket "${BUCKET_NAME}"...`);
    
    // Créer le bucket
    const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création du bucket:', createError.message);
      
      if (createError.message?.includes('already exists') || 
          createError.message?.includes('duplicate')) {
        console.log('✅ Le bucket existe déjà (créé entre-temps)');
        process.exit(0);
      }
      
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Créez le bucket manuellement dans le dashboard Supabase:');
      console.error('      - Allez dans Storage > Buckets');
      console.error('      - Cliquez sur "New bucket"');
      console.error(`      - Nom: ${BUCKET_NAME}`);
      console.error('      - Public: Oui');
      console.error('   2. Vérifiez que SUPABASE_SERVICE_ROLE_KEY est correct');
      console.error('   3. Vérifiez que Storage est activé dans votre projet Supabase');
      
      process.exit(1);
    }
    
    console.log(`✅ Bucket "${BUCKET_NAME}" créé avec succès!`);
    console.log(`   - Public: Oui`);
    console.log(`   - Taille max: 5MB`);
    console.log(`   - Types autorisés: JPEG, JPG, PNG, WEBP`);
    
  } catch (error: any) {
    console.error('❌ Erreur inattendue:', error.message);
    process.exit(1);
  }
}

main();
