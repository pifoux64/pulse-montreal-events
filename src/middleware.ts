import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n';

// Créer le middleware next-intl avec détection de locale depuis le cookie
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never', // Ne pas utiliser de préfixe dans l'URL (on utilise le cookie)
  localeDetection: true, // Activer la détection
  // Fonction personnalisée pour détecter la locale depuis le cookie
  alternateLinks: false, // Désactiver les liens alternatifs
});

export async function middleware(request: NextRequest) {
  // Détecter la locale depuis le cookie NEXT_LOCALE
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = (cookieLocale && locales.includes(cookieLocale as any)) 
    ? cookieLocale 
    : defaultLocale;

  // Créer une requête modifiée avec la locale dans les headers pour next-intl
  const requestWithLocale = new NextRequest(request.url, {
    ...request,
    headers: {
      ...request.headers,
      'x-next-intl-locale': locale,
    },
  });

  // Exécuter le middleware next-intl d'abord
  // Il va configurer la locale pour que getRequestConfig puisse la lire
  const intlResponse = intlMiddleware(requestWithLocale);
  
  // Si next-intl a retourné une redirection, on la retourne directement
  if (intlResponse && intlResponse.status === 307) {
    return intlResponse;
  }

  // Ensuite, gérer la logique d'onboarding
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Si l'utilisateur est authentifié et n'a pas complété l'onboarding
  if (token?.sub) {
    // Vérifier si l'utilisateur a complété l'onboarding
    // On fait une requête à l'API pour vérifier (on pourrait optimiser avec un cache)
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/user/preferences`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const preferences = data.preferences;

        // Si l'onboarding n'est pas complété et que l'utilisateur n'est pas déjà sur /onboarding
        if (
          !preferences?.onboardingCompleted &&
          !request.nextUrl.pathname.startsWith('/onboarding') &&
          !request.nextUrl.pathname.startsWith('/auth') &&
          !request.nextUrl.pathname.startsWith('/api')
        ) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      }
    } catch (error) {
      // En cas d'erreur, on laisse passer pour ne pas bloquer l'utilisateur
      console.error('[Middleware] Erreur vérification onboarding:', error);
    }
  }

  // Retourner la réponse de next-intl ou créer une nouvelle réponse
  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
