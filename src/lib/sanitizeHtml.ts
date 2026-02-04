import DOMPurify from 'isomorphic-dompurify';

/** Balises autorisées pour les descriptions d'événements (éditeur riche). */
const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'h2', 'h3',
  'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'a',
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Indique si la chaîne ressemble à du HTML (contient des balises).
 */
export function looksLikeHtml(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str.trim());
}

/**
 * Désinfecte du HTML produit par l'éditeur riche (descriptions d'événements).
 * Autorise uniquement les balises de formatage basiques et les liens.
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel'],
  });
}
