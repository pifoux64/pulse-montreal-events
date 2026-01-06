import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
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

  return NextResponse.next();
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
