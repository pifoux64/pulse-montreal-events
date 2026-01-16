import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { locales, defaultLocale } from '@/lib/i18n';

export async function middleware(request: NextRequest) {
  // Exclure les routes API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Gérer la locale manuellement (sans middleware next-intl)
  // S'assurer qu'un cookie NEXT_LOCALE existe
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = (cookieLocale && locales.includes(cookieLocale as any)) ? cookieLocale : defaultLocale;
  
  // Créer la réponse
  const response = NextResponse.next();
  
  // Définir le cookie si nécessaire
  if (!cookieLocale || !locales.includes(cookieLocale as any)) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 an
      sameSite: 'lax',
    });
  }
  
  // Définir le header x-next-intl-locale pour que getRequestConfig puisse le détecter
  response.headers.set('x-next-intl-locale', locale);

  // Ensuite, gérer la logique d'onboarding
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Si l'utilisateur est authentifié et n'a pas complété l'onboarding
  if (token?.sub) {
    // Vérifier si l'utilisateur a complété l'onboarding
    // On fait une requête à l'API pour vérifier (on pourrait optimiser avec un cache)
    try {
      const onboardingResponse = await fetch(`${request.nextUrl.origin}/api/user/preferences`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });

      if (onboardingResponse.ok) {
        const data = await onboardingResponse.json();
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

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
