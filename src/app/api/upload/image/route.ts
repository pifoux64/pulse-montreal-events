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

    // Créer le bucket s'il n'existe pas (nécessite SUPABASE_SERVICE_ROLE_KEY)
    try {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
      if (createError) {
        const msg = createError.message ?? '';
        const alreadyExists =
          /already exists|duplicate|Bucket already exists/i.test(msg);
        if (!alreadyExists) {
          console.warn(`[upload/image] createBucket "${BUCKET_NAME}":`, msg);
        }
      }
    } catch (bucketErr: unknown) {
      const msg = bucketErr instanceof Error ? bucketErr.message : String(bucketErr);
      console.warn('[upload/image] createBucket check (ignored):', msg);
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
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (error.message?.includes('Bucket not found') ||
          error.message?.includes('does not exist') ||
          statusCode === 404) {
        const dashboardHint = supabaseUrl
          ? ` Allez dans Supabase → Storage → New bucket → nommez-le "${BUCKET_NAME}" et cochez "Public".`
          : '';
        return NextResponse.json(
          {
            error: `Le bucket de stockage "${BUCKET_NAME}" n'existe pas.${dashboardHint} Vérifiez que SUPABASE_SERVICE_ROLE_KEY est bien configurée pour une création automatique, ou créez le bucket manuellement.`,
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
