'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import FollowUserButton from '@/components/social/FollowUserButton';
import { Users, MessageCircle, Heart, Calendar, TrendingUp, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface RecommendedUser {
  userId: string;
  name: string | null;
  image: string | null;
  similarityScore: number;
  commonFavorites: number;
  commonEvents: number;
  isFollowing: boolean;
}

export default function PulsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/pulsers');
    } else if (status === 'authenticated') {
      loadRecommendedUsers();
    }
  }, [status, router]);

  const loadRecommendedUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/recommended?limit=50');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = (userId: string, newState: boolean) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.userId === userId ? { ...user, isFollowing: newState } : user
      )
    );
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSimilarityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="pt-24 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <ModernLoader size="lg" text="Chargement des pulsers..." variant="default" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Découvrir les Pulsers</h1>
                <p className="text-slate-400 mt-1">
                  Trouve des personnes avec des goûts similaires aux tiens
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un pulser..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
              {error}
            </div>
          )}

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center border border-white/10">
              <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur recommandé pour le moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {user.name || 'Utilisateur anonyme'}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatSimilarityScore(user.similarityScore)} de similarité</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Stats */}
                  <div className="space-y-2 mb-4">
                    {user.commonFavorites > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>{user.commonFavorites} favori{user.commonFavorites > 1 ? 's' : ''} en commun</span>
                      </div>
                    )}
                    {user.commonEvents > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{user.commonEvents} événement{user.commonEvents > 1 ? 's' : ''} en commun</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <FollowUserButton
                      userId={user.userId}
                      isFollowing={user.isFollowing}
                      onToggle={(newState) => handleFollowToggle(user.userId, newState)}
                      className="flex-1"
                    />
                    <Link
                      href={`/messages?userId=${user.userId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
