'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, Users, DollarSign, CheckCircle, X, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VenueRequest {
  id: string;
  concept: string;
  dateStart: string;
  dateEnd: string | null;
  expectedAttendance: number | null;
  budget: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  comments: string | null;
  createdAt: string;
  organizer: {
    displayName: string;
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface VenueRequestsListProps {
  venueId: string;
}

export default function VenueRequestsList({ venueId }: VenueRequestsListProps) {
  const [requests, setRequests] = useState<VenueRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null);
  const [comments, setComments] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [venueId]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/venue-requests?venueId=${venueId}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des demandes');
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/venue-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comments: comments || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await loadRequests();
      setSelectedRequest(null);
      setComments('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
        {error}
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED');
  const declinedRequests = requests.filter(r => r.status === 'DECLINED');

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{pendingRequests.length}</div>
          <div className="text-sm text-slate-400">En attente</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-green-400">{acceptedRequests.length}</div>
          <div className="text-sm text-slate-400">Acceptées</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-red-400">{declinedRequests.length}</div>
          <div className="text-sm text-slate-400">Refusées</div>
        </div>
      </div>

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          Aucune demande de réservation pour le moment
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white/5 rounded-lg p-6 border ${
                request.status === 'PENDING'
                  ? 'border-yellow-500/50'
                  : request.status === 'ACCEPTED'
                  ? 'border-green-500/50'
                  : 'border-red-500/50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-white">
                      {request.organizer.displayName || request.organizer.user.name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : request.status === 'ACCEPTED'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {request.status === 'PENDING' && 'En attente'}
                      {request.status === 'ACCEPTED' && 'Acceptée'}
                      {request.status === 'DECLINED' && 'Refusée'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {request.organizer.user.email}
                  </p>
                </div>
                {request.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setComments('');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accepter
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setComments('');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Concept</p>
                  <p className="text-white">{request.concept}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-slate-400">Date début</p>
                      <p className="text-sm">
                        {format(new Date(request.dateStart), 'PPP', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {request.dateEnd && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-slate-400">Date fin</p>
                        <p className="text-sm">
                          {format(new Date(request.dateEnd), 'PPP', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                  {request.expectedAttendance && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-slate-400">Personnes</p>
                        <p className="text-sm">{request.expectedAttendance}</p>
                      </div>
                    </div>
                  )}
                  {request.budget && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-slate-400">Budget</p>
                        <p className="text-sm">
                          {(request.budget / 100).toLocaleString('fr-CA', {
                            style: 'currency',
                            currency: 'CAD',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {request.comments && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Commentaires
                    </p>
                    <p className="text-white">{request.comments}</p>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Demandé le {format(new Date(request.createdAt), 'PPP', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour accepter/refuser */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedRequest.status === 'PENDING' && 'Répondre à la demande'}
            </h3>
            <div className="mb-4">
              <p className="text-slate-300 mb-2">
                Organisateur : <strong>{selectedRequest.organizer.displayName || selectedRequest.organizer.user.name}</strong>
              </p>
              <p className="text-slate-400 text-sm mb-4">
                {selectedRequest.concept}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Commentaires (optionnel)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ajoutez un commentaire pour l'organisateur..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, 'ACCEPTED')}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Enregistrement...' : 'Accepter'}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, 'DECLINED')}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Enregistrement...' : 'Refuser'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setComments('');
                }}
                className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
