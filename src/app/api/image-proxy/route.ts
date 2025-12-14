import { NextRequest, NextResponse } from 'next/server';

// Proxy simple pour servir des images externes via le domaine Pulse
// Objectif: contourner les blocages CSP / hotlink côté navigateur

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const urlParam = request.nextUrl.searchParams.get('url');
    if (!urlParam) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Sécurité basique: n'accepter que http/https
    let target: URL;
    try {
      target = new URL(urlParam);
    } catch {
      return new NextResponse('Invalid url', { status: 400 });
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return new NextResponse('Invalid protocol', { status: 400 });
    }

    const res = await fetch(target.toString(), {
      redirect: 'follow',
    });

    if (!res.ok) {
      return new NextResponse('Upstream error', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[image-proxy] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}












