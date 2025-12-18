/**
 * Social Kit pour Pulse Picks
 * SPRINT 4: Génération de légendes + hashtags pour IG/FB (sans API Meta)
 */

import { EditorialPost, Event, EventTag } from '@prisma/client';

export interface SocialKit {
  shortCaption: string;
  longCaption: string;
  hashtags: string;
}

function buildHashtags(post: EditorialPost, events: (Event & { eventTags: EventTag[] })[]): string {
  const baseTags = new Set<string>();

  // Tags basés sur le thème
  baseTags.add('#PulseMontreal');
  baseTags.add('#PulsePicks');
  baseTags.add('#Montreal');

  if (post.theme) {
    const themeSlug = post.theme.toLowerCase().replace(/\s+/g, '');
    baseTags.add(`#${themeSlug}`);
    if (post.theme === 'musique') {
      baseTags.add('#concerts');
      baseTags.add('#nuitMTL');
    }
    if (post.theme === 'famille') {
      baseTags.add('#sortiesfamille');
      baseTags.add('#kidsfriendly');
    }
  }

  // Tags basés sur les EventTag (genre / ambiance / public)
  for (const event of events) {
    for (const tag of event.eventTags || []) {
      if (['genre', 'ambiance', 'public'].includes(tag.category)) {
        const valueSlug = tag.value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (valueSlug && valueSlug.length > 2) {
          baseTags.add(`#${valueSlug}`);
        }
      }
    }
  }

  return Array.from(baseTags).join(' ');
}

export function generateSocialKit(
  post: EditorialPost,
  events: (Event & { eventTags: EventTag[] })[],
): SocialKit {
  const periodStart = new Date(post.periodStart);
  const periodEnd = new Date(post.periodEnd);

  const formatter = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const startStr = formatter.format(periodStart);
  const endStr = formatter.format(periodEnd);

  const firstEvent = events[0];
  const firstTitle = firstEvent?.title || '';

  const shortCaption = firstTitle
    ? `Top 5 ${post.theme} à Montréal 🎧\n${firstTitle}\nDu ${startStr} au ${endStr}.`
    : `Top 5 ${post.theme} à Montréal 🎧\nDu ${startStr} au ${endStr}.`;

  const eventLines = events
    .slice(0, 5)
    .map((e, idx) => `${idx + 1}. ${e.title}`)
    .join('\n');

  const longCaption = `Les choix Pulse de la semaine ✨\n\nTop 5 ${post.theme} à Montréal, du ${startStr} au ${endStr} :\n\n${eventLines}\n\nRetrouve la sélection complète et les détails sur pulse-mtl.vercel.app`;

  const hashtags = buildHashtags(post, events);

  return {
    shortCaption,
    longCaption,
    hashtags,
  };
}


