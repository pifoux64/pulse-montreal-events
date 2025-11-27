import { describe, expect, it } from 'vitest';
import { MediaKind, NotificationType } from '@prisma/client';
import {
  buildFavoriteNotificationPayloads,
  buildMarkAsReadWhereClause,
  getEventPostType,
  getNotificationPreview,
  normalizeMediaPayload,
  sanitizePostContent,
} from '../event-feed';

describe('event feed helpers', () => {
  it('sanitizes content and preserves text', () => {
    expect(sanitizePostContent('  Bonjour Montréal  ')).toBe('Bonjour Montréal');
  });

  it('normalizes media payloads and removes duplicates', () => {
    const media = normalizeMediaPayload([
      { url: ' https://example.com/a.jpg ', kind: MediaKind.IMAGE },
      { url: 'https://example.com/a.jpg', kind: MediaKind.VIDEO },
      { url: 'https://example.com/b.jpg' },
    ]);

    expect(media).toEqual([
      { url: 'https://example.com/a.jpg', kind: MediaKind.IMAGE },
      { url: 'https://example.com/b.jpg', kind: MediaKind.IMAGE },
    ]);
  });

  it('derives post type from media presence', () => {
    expect(getEventPostType([])).toBe('TEXT');
    expect(getEventPostType([{ url: 'https://example.com', kind: MediaKind.IMAGE }])).toBe('MEDIA');
  });

  it('builds notification preview with ellipsis', () => {
    const preview = getNotificationPreview('a'.repeat(200), 20);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBe(20);
  });

  it('builds favorite notification payloads with unique users', () => {
    const payloads = buildFavoriteNotificationPayloads({
      userIds: ['u1', 'u2', 'u1'],
      eventId: 'event',
      eventTitle: 'Festival Jazz',
      postId: 'post',
      previewText: 'Nouveau message',
    });

    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({
      type: NotificationType.EVENT_POST_PUBLISHED,
      body: 'Nouveau message',
    });
  });

  it('builds where clause for specific notifications', () => {
    const where = buildMarkAsReadWhereClause({
      ids: ['a', 'a', 'b'],
      userId: 'user',
    });

    expect(where).toEqual({
      userId: 'user',
      id: { in: ['a', 'b'] },
      readAt: null,
    });
  });

  it('builds where clause for mark all', () => {
    const where = buildMarkAsReadWhereClause({
      userId: 'user',
      markAll: true,
    });

    expect(where).toEqual({
      userId: 'user',
      readAt: null,
    });
  });

  it('throws when no ids supplied', () => {
    expect(() =>
      buildMarkAsReadWhereClause({
        userId: 'user',
      })
    ).toThrowError('Aucun identifiant de notification fourni');
  });
});

