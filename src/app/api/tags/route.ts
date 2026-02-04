/**
 * GET /api/tags - Recherche de tags existants (TagDefinition, category "tag")
 * Query: search (optionnel), limit (défaut 15)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FREE_TAG_CATEGORY = 'tag';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '15', 10), 30);

    const where: { category: string; OR?: Array<{ label?: { contains: string; mode: 'insensitive' }; value?: { contains: string; mode: 'insensitive' } }> } = {
      category: FREE_TAG_CATEGORY,
    };

    if (search.length >= 1) {
      where.OR = [
        { label: { contains: search, mode: 'insensitive' } },
        { value: { contains: search.replace(/\s+/g, '_'), mode: 'insensitive' } },
      ];
    } else {
      // Pas de recherche = pas de résultats (éviter d'afficher tout le catalogue au focus)
      return NextResponse.json({ items: [], total: 0 });
    }

    const items = await prisma.tagDefinition.findMany({
      where,
      select: {
        value: true,
        label: true,
      },
      orderBy: [
        { label: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      items: items.map((t) => ({ value: t.value, label: t.label })),
      total: items.length,
    });
  } catch (error) {
    console.error('[API /api/tags]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche des tags' },
      { status: 500 }
    );
  }
}
