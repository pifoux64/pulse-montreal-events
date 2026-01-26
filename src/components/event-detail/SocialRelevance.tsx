'use client';

import { useState, useEffect } from 'react';
import { Users, Heart, UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import InviteFriendButton from '../social/InviteFriendButton';

interface SocialRelevanceProps {
  eventId: string;
  eventTitle: string;
  eventUrl?: string | null;
}

interface FriendsData {
  friendsAttending: number;
  friendsInterested: number;
  tasteMatch?: number; // 0-100
}

export default function SocialRelevance({
  eventId,
  eventTitle,
  eventUrl,
}: SocialRelevanceProps) {
  const { data: session } = useSession();
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchSocialData = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/social?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setFriendsData(data);
        }
      } catch (error) {
        console.error('Erreur fetch social data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialData();
  }, [eventId, session]);

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!friendsData || (friendsData.friendsAttending === 0 && friendsData.friendsInterested === 0 && !friendsData.tasteMatch)) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Inviter des amis</h3>
        </div>
        <InviteFriendButton eventId={eventId} eventTitle={eventTitle} eventUrl={eventUrl || undefined} />
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Réseau social</h3>
      </div>

      {/* Friends attending/interested */}
      {(friendsData.friendsAttending > 0 || friendsData.friendsInterested > 0) && (
        <div className="space-y-2">
          {friendsData.friendsAttending > 0 && (
            <div className="flex items-center gap-2 text-white">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm">
                {friendsData.friendsAttending} {friendsData.friendsAttending === 1 ? 'ami participe' : 'amis participent'}
              </span>
            </div>
          )}
          {friendsData.friendsInterested > 0 && (
            <div className="flex items-center gap-2 text-white">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm">
                {friendsData.friendsInterested} {friendsData.friendsInterested === 1 ? 'ami intéressé' : 'amis intéressés'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Taste match indicator */}
      {friendsData.tasteMatch !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Correspondance avec vos goûts</span>
            <span className="text-sm font-semibold text-white">{friendsData.tasteMatch}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${friendsData.tasteMatch}%` }}
            />
          </div>
        </div>
      )}

      {/* Invite action */}
      <div className="pt-4 border-t border-white/10">
        <InviteFriendButton eventId={eventId} eventTitle={eventTitle} eventUrl={eventUrl || undefined} />
      </div>
    </div>
  );
}
