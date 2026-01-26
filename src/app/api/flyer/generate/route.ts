import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'flyers';

// Formats de flyer
export type FlyerFormat = 'story' | 'square' | 'cover';
export type FlyerStyle = 'reggae' | 'techno' | 'family' | 'culture' | 'minimal';

const FORMAT_DIMENSIONS: Record<FlyerFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 }, // IG Story
  square: { width: 1080, height: 1080 }, // Square
  cover: { width: 1200, height: 628 }, // FB Cover
};

// Prompts de style pour la génération d'image
const STYLE_PROMPTS: Record<FlyerStyle, string> = {
  reggae: 'vibrant reggae music festival atmosphere, warm colors, tropical vibes, sunset, palm trees, musical instruments, energetic crowd, no text, no logos, abstract artistic background',
  techno: 'dark techno club atmosphere, neon lights, electronic music vibes, urban nightlife, geometric patterns, purple and blue tones, futuristic, no text, no logos, abstract artistic background',
  family: 'bright family-friendly event atmosphere, cheerful colors, balloons, confetti, happy people, warm lighting, playful design, pastel colors, no text, no logos, abstract artistic background',
  culture: 'elegant cultural event atmosphere, artistic design, sophisticated colors, museum gallery vibes, classical elements, refined aesthetic, warm lighting, no text, no logos, abstract artistic background',
  minimal: 'clean minimal design, simple geometric shapes, neutral colors, modern aesthetic, subtle gradients, professional look, no text, no logos, abstract artistic background',
};

/**
 * Génère une image de fond avec OpenAI DALL-E
 */
async function generateBackgroundImage(
  eventTitle: string,
  category: string,
  style: FlyerStyle
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configurée');
  }

  const prompt = `${STYLE_PROMPTS[style]}, event theme: ${category}, title: ${eventTitle}`;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024', // DALL-E 3 génère en 1024x1024, on redimensionnera après
        quality: 'standard',
        n: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Erreur génération image OpenAI:', error);
    // Fallback: retourner une image de gradient simple
    throw error;
  }
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Génère un QR code en buffer
 */
async function generateQRCode(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Compose le flyer avec Canvas
 */
async function composeFlyer(
  backgroundImageUrl: string,
  eventData: {
    title: string;
    date: string;
    time: string;
    venue: string;
    price: string;
    lineup?: string[];
    eventUrl: string;
  },
  format: FlyerFormat,
  includeQR: boolean
): Promise<Buffer> {
  // Dynamiquement importer canvas (nécessaire pour Next.js)
  const { createCanvas, loadImage } = await import('canvas');
  
  const { width, height } = FORMAT_DIMENSIONS[format];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Télécharger et dessiner l'image de fond
  try {
    const backgroundBuffer = await downloadImage(backgroundImageUrl);
    const background = await loadImage(backgroundBuffer);
    
    // Redimensionner et centrer l'image de fond
    const scale = Math.max(width / background.width, height / background.height);
    const scaledWidth = background.width * scale;
    const scaledHeight = background.height * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;
    
    ctx.drawImage(background, x, y, scaledWidth, scaledHeight);
  } catch (error) {
    console.error('Erreur chargement image de fond, utilisation gradient:', error);
    // Fallback: gradient coloré
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Ajouter un overlay sombre pour améliorer la lisibilité du texte
  const overlayGradient = ctx.createLinearGradient(0, 0, 0, height);
  overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
  overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, width, height);

  // Configuration du texte
  const textColor = '#FFFFFF';
  const textShadow = 'rgba(0, 0, 0, 0.8)';
  const padding = format === 'cover' ? 40 : 60;
  let yPos = padding;

  // Titre de l'événement
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const titleFontSize = format === 'cover' ? 48 : format === 'square' ? 56 : 64;
  ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
  
  // Ombre du texte
  ctx.shadowColor = textShadow;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Wrapper le titre si trop long
  const maxWidth = width - padding * 2;
  const words = eventData.title.split(' ');
  let line = '';
  const lines: string[] = [];
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  
  // Dessiner le titre
  ctx.shadowColor = textShadow;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, yPos + index * (titleFontSize + 10));
  });
  
  yPos += lines.length * (titleFontSize + 10) + 30;

  // Date et heure
  ctx.font = `${format === 'cover' ? 24 : 32}px Arial, sans-serif`;
  ctx.fillText(eventData.date, width / 2, yPos);
  yPos += format === 'cover' ? 35 : 45;
  ctx.fillText(eventData.time, width / 2, yPos);
  yPos += format === 'cover' ? 35 : 45;

  // Lieu
  ctx.font = `${format === 'cover' ? 20 : 28}px Arial, sans-serif`;
  ctx.fillText(eventData.venue, width / 2, yPos);
  yPos += format === 'cover' ? 30 : 40;

  // Prix
  if (eventData.price) {
    ctx.font = `bold ${format === 'cover' ? 24 : 32}px Arial, sans-serif`;
    ctx.fillText(eventData.price, width / 2, yPos);
    yPos += format === 'cover' ? 35 : 45;
  }

  // Lineup (si disponible et format vertical)
  if (eventData.lineup && eventData.lineup.length > 0 && format !== 'cover') {
    ctx.font = `${format === 'square' ? 24 : 28}px Arial, sans-serif`;
    ctx.fillText('Lineup:', width / 2, yPos);
    yPos += format === 'square' ? 30 : 35;
    
    eventData.lineup.slice(0, 3).forEach((artist) => {
      ctx.font = `${format === 'square' ? 20 : 24}px Arial, sans-serif`;
      ctx.fillText(`• ${artist}`, width / 2, yPos);
      yPos += format === 'square' ? 28 : 32;
    });
  }

  // QR Code (en bas à droite ou centré en bas)
  if (includeQR) {
    try {
      const qrBuffer = await generateQRCode(eventData.eventUrl);
      const qrImage = await loadImage(qrBuffer);
      const qrSize = format === 'cover' ? 120 : 150;
      const qrX = format === 'cover' ? width - qrSize - padding : (width - qrSize) / 2;
      const qrY = height - qrSize - padding;
      
      // Fond blanc pour le QR code
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
      
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  }

  // Retourner le buffer PNG
  return canvas.toBuffer('image/png');
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

    const body = await request.json();
    const { eventId, format, stylePreset, includeQR = true } = body;

    if (!eventId || !format || !stylePreset) {
      return NextResponse.json(
        { error: 'eventId, format et stylePreset sont requis' },
        { status: 400 }
      );
    }

    if (!['story', 'square', 'cover'].includes(format)) {
      return NextResponse.json(
        { error: 'Format invalide. Utilisez: story, square, ou cover' },
        { status: 400 }
      );
    }

    if (!['reggae', 'techno', 'family', 'culture', 'minimal'].includes(stylePreset)) {
      return NextResponse.json(
        { error: 'Style invalide. Utilisez: reggae, techno, family, culture, ou minimal' },
        { status: 400 }
      );
    }

    // Récupérer l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        organizer: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est l'organisateur ou admin
    if (event.organizer?.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à générer un flyer pour cet événement' },
        { status: 403 }
      );
    }

    // Générer l'image de fond
    let backgroundImageUrl: string;
    try {
      backgroundImageUrl = await generateBackgroundImage(
        event.title,
        event.category,
        stylePreset
      );
    } catch (error) {
      console.error('Erreur génération image de fond:', error);
      // Utiliser une image de fallback ou un gradient
      backgroundImageUrl = ''; // Sera géré dans composeFlyer
    }

    // Préparer les données de l'événement
    const eventDate = new Date(event.startAt).toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Montreal',
    });

    const eventTime = new Date(event.startAt).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Montreal',
    });

    const priceText = event.priceMin === 0
      ? 'Gratuit'
      : event.priceMax && event.priceMax !== event.priceMin
      ? `${(event.priceMin / 100).toFixed(2)} $ - ${(event.priceMax / 100).toFixed(2)} $`
      : `${(event.priceMin / 100).toFixed(2)} $`;

    const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-event.ca'}/evenement/${event.id}`;

    // Composer le flyer
    const flyerBuffer = await composeFlyer(
      backgroundImageUrl,
      {
        title: event.title,
        date: eventDate,
        time: eventTime,
        venue: event.venue?.name || 'Montréal',
        price: priceText,
        lineup: event.lineup || undefined,
        eventUrl,
      },
      format,
      includeQR
    );

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
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: ['image/png'],
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
    const fileName = `${session.user.id}/${eventId}/${format}-${stylePreset}-${timestamp}-${randomString}.png`;

    // Uploader vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, flyerBuffer, {
        contentType: 'image/png',
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
        { error: `Erreur lors de l'upload du flyer: ${error.message || 'Erreur inconnue'}` },
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
      format,
      stylePreset,
    });
  } catch (error: any) {
    console.error('[flyer/generate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la génération du flyer' },
      { status: 500 }
    );
  }
}
