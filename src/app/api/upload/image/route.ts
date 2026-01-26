import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'events';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;

// Fonction pour valider les dimensions de l'image
async function validateImageDimensions(buffer: Buffer, mimeType: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Utiliser une bibliothèque simple pour lire les dimensions
    // Pour l'instant, on valide juste la taille du fichier
    // Les dimensions seront validées côté client avant l'upload
    // TODO: Ajouter sharp ou image-size pour validation serveur complète
    
    // Validation basique : on accepte si le fichier est valide
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Impossible de lire les dimensions de l\'image',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Le fichier est trop volumineux. Taille maximale: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer pour validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Valider les dimensions (validation basique pour l'instant)
    // La validation complète se fait côté client
    const dimensionValidation = await validateImageDimensions(buffer, file.type);
    if (!dimensionValidation.valid) {
      return NextResponse.json(
        { error: dimensionValidation.error },
        { status: 400 }
      );
    }

    // Essayer de créer le bucket s'il n'existe pas (mais ne pas bloquer si ça échoue)
    // Le bucket peut déjà exister ou on peut ne pas avoir les permissions pour le créer
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
      
      if (!bucketExists) {
        // Essayer de créer le bucket, mais ignorer l'erreur si ça échoue
        // (le bucket peut exister mais on n'a peut-être pas les permissions pour le lister)
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_TYPES,
        });
        
        if (createError) {
          // Si l'erreur indique que le bucket existe déjà, c'est OK
          if (createError.message?.includes('already exists') || 
              createError.message?.includes('duplicate') ||
              createError.message?.includes('Bucket already exists')) {
            console.log(`Bucket "${BUCKET_NAME}" existe déjà`);
          } else {
            // Autre erreur : logger mais continuer quand même
            // (on essaiera l'upload et si ça échoue, on retournera une erreur plus claire)
            console.warn(`Impossible de créer le bucket "${BUCKET_NAME}":`, createError.message);
          }
        }
      }
    } catch (bucketError: any) {
      // Ignorer les erreurs de vérification/création du bucket
      // On essaiera quand même l'upload
      console.warn('Erreur lors de la vérification du bucket (ignorée):', bucketError.message);
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${session.user.id}/${timestamp}-${randomString}.${fileExtension}`;

    // Uploader vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      
      // Si l'erreur indique que le bucket n'existe pas, donner un message plus clair
      if (error.message?.includes('Bucket not found') || 
          error.message?.includes('does not exist') ||
          error.statusCode === 404) {
        return NextResponse.json(
          { 
            error: `Le bucket de stockage "${BUCKET_NAME}" n'existe pas. Veuillez le créer dans votre dashboard Supabase ou contacter l'administrateur.` 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Erreur lors de l'upload de l'image: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('[upload/image] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}
