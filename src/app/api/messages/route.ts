/**
 * API Route pour la messagerie entre utilisateurs
 * GET /api/messages - Récupère les conversations de l'utilisateur
 * POST /api/messages - Envoie un message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/messages - Récupère les conversations de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // Pour récupérer les messages avec un utilisateur spécifique

    if (userId) {
      // Récupérer les messages entre l'utilisateur connecté et userId
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId },
            { senderId: userId, receiverId: session.user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Marquer les messages non lus comme lus
      await prisma.message.updateMany({
        where: {
          receiverId: session.user.id,
          senderId: userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ messages });
    }

    // Récupérer toutes les conversations (dernier message de chaque conversation)
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Grouper par conversation (autre utilisateur)
    const conversationMap = new Map<string, any>();
    const unreadCounts = new Map<string, number>();

    for (const message of conversations) {
      const otherUserId = message.senderId === session.user.id 
        ? message.receiverId 
        : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }

      // Compter les messages non lus
      if (message.receiverId === session.user.id && !message.read) {
        unreadCounts.set(otherUserId, (unreadCounts.get(otherUserId) || 0) + 1);
      }
    }

    // Transformer en liste avec compteur de non lus
    const conversationsList = Array.from(conversationMap.entries()).map(([userId, lastMessage]) => ({
      userId,
      user: lastMessage.senderId === session.user.id 
        ? lastMessage.receiver 
        : lastMessage.sender,
      lastMessage: {
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isFromMe: lastMessage.senderId === session.user.id,
      },
      unreadCount: unreadCounts.get(userId) || 0,
    }));

    return NextResponse.json({ conversations: conversationsList });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages - Envoie un message
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'receiverId et content requis' },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous envoyer un message à vous-même' },
        { status: 400 }
      );
    }

    // Vérifier que le destinataire existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      );
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ message });

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
