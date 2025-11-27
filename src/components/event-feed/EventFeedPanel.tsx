'use client';

import EventPostComposer from './EventPostComposer';
import EventPostList from './EventPostList';

interface EventFeedPanelProps {
  eventId: string;
  canPost: boolean;
}

export default function EventFeedPanel({ eventId, canPost }: EventFeedPanelProps) {
  return (
    <div className="space-y-6">
      {canPost && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <EventPostComposer eventId={eventId} />
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
        <EventPostList eventId={eventId} />
      </div>
    </div>
  );
}

