import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';
import { TagCategory, filterToAllowedTags } from './taxonomy';
import { AIClassificationOutput, classifyEventWithAI } from './aiClassifier';

/**
 * Enrichit un événement avec des tags structurés EventTag.
 *
 * Étapes :
 *  1) Charger l'événement + lieu
 *  2) Appeler classifyEventWithAI (IA externe à terme)
 *  3) Filtrer les tags pour ne garder que ceux présents dans la taxonomie
 *  4) (Re)créer les EventTag correspondants
 */
export async function enrichEventWithTags(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
    },
  });

  if (!event) {
    return;
  }

  if (event.status === EventStatus.CANCELLED) {
    // Pas utile de tagger les événements annulés
    return;
  }

  const aiResult: AIClassificationOutput = await classifyEventWithAI({
    title: event.title,
    description: event.description,
    venueName: event.venue?.name ?? undefined,
  });

  const filtered = filterToAllowedTags(aiResult);

  // Préparer les EventTag à écrire
  const tagsToCreate: { category: TagCategory; value: string }[] = [];

  if (filtered.type) {
    tagsToCreate.push({ category: 'type', value: filtered.type });
  }
  for (const g of filtered.genres) {
    tagsToCreate.push({ category: 'genre', value: g });
  }
  for (const a of filtered.ambiance) {
    tagsToCreate.push({ category: 'ambiance', value: a });
  }
  for (const p of filtered.public) {
    tagsToCreate.push({ category: 'public', value: p });
  }

  // Transaction : on remplace les tags existants de cet événement
  await prisma.$transaction([
    prisma.eventTag.deleteMany({ where: { eventId } }),
    tagsToCreate.length
      ? prisma.eventTag.createMany({
          data: tagsToCreate.map((t) => ({
            eventId,
            category: t.category,
            value: t.value,
          })),
          skipDuplicates: true,
        })
      : prisma.eventTag.createMany({ data: [] }), // no-op
  ]);
}


