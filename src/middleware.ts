/**
 * Middleware Next.js pour le rate limiting et la sécurité
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { postRateLimit, getClientIP } from '@/lib/rateLimit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { method } = request;
  
  // Appliquer le rate limiting uniquement sur les requêtes POST sensibles
  if (method === 'POST') {
    // Endpoints sensibles qui nécessitent un rate limit
    const sensitiveEndpoints = [
      '/api/events',
      '/api/promotions',
      '/api/favorites',
      '/api/organizers',
      '/auth/signin',
      '/auth/signup',
    ];
    
    const isSensitive = sensitiveEndpoints.some(endpoint => 
      pathname.startsWith(endpoint)
    );
    
    if (isSensitive && postRateLimit) {
      const ip = getClientIP(request);
      const result = await postRateLimit.limit(ip);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: 'Trop de requêtes. Veuillez réessayer plus tard.',
            retryAfter: Math.round((result.reset - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(Math.round((result.reset - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.reset),
            }
          }
        );
      }
      
      // Ajouter les headers de rate limit à la réponse
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', String(result.limit));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.reset));
      
      return response;
    }
    // Si isSensitive mais postRateLimit n'est pas configuré, continuer quand même
    // (utile en développement)
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

