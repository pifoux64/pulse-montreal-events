'use client';

import VenueRequestButton from './VenueRequestButton';
import VenueClaimButton from './VenueClaimButton';

interface VenuePageActionsProps {
  venueId: string;
  venueName: string;
}

export default function VenuePageActions({ venueId, venueName }: VenuePageActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <VenueClaimButton venueId={venueId} venueName={venueName} />
      <VenueRequestButton venueId={venueId} venueName={venueName} />
    </div>
  );
}
