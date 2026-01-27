/**
 * GET /api/admin/venue-claims
 * Liste toutes les demandes de claim venues (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        roleAssignments: {
          select: { role: true },
        },
      },
    });

    const userRoles = new Set([user?.role || 'USER']);
    user?.roleAssignments?.forEach(ra => userRoles.add(ra.role));
    
    if (!userRoles.has('ADMIN')) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [claims, total] = await Promise.all([
      prisma.venueClaim.findMany({
        where,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.venueClaim.count({ where }),
    ]);

    return NextResponse.json({
      items: claims,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error('Erreur récupération claims venues:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des claims' },
      { status: 500 }
    );
  }
}
