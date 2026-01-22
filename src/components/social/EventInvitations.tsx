'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Invitation {
  id: string;
  event: {
    id: string;
    title: string;
    startAt: string;
    imageUrl: string | null;
    venue: {
      name: string;
    } | null;
  };
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
  };
  message: string | null;
  status: string;
  createdAt: string;
}

export default function EventInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadInvitations();
  }, [activeTab]);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/events/invitations?type=${activeTab}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const res = await fetch(`/api/events/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la réponse');
      }

      await loadInvitations();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réponse');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">Invitations</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'received'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reçues
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sent'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Envoyées
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {activeTab === 'received' 
            ? 'Aucune invitation reçue'
            : 'Aucune invitation envoyée'}
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {activeTab === 'received' ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-sm">
                          {invitation.sender.name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {invitation.sender.name || 'Utilisateur'}
                          </div>
                          <div className="text-xs text-slate-400">vous invite à</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm">
                          {invitation.receiver.name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {invitation.receiver.name || 'Utilisateur'}
                          </div>
                          <div className="text-xs text-slate-400">invité(e) à</div>
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/evenement/${invitation.event.id}`}
                    className="block mt-2"
                  >
                    <div className="font-semibold text-sky-400 hover:text-sky-300">
                      {invitation.event.title}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {format(new Date(invitation.event.startAt), 'PPP', { locale: fr })}
                      {invitation.event.venue && ` • ${invitation.event.venue.name}`}
                    </div>
                  </Link>
                  {invitation.message && (
                    <p className="text-sm text-slate-300 mt-2 italic">
                      "{invitation.message}"
                    </p>
                  )}
                </div>
                {activeTab === 'received' && invitation.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(invitation.id, 'ACCEPTED')}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRespond(invitation.id, 'DECLINED')}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                )}
                {invitation.status !== 'PENDING' && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invitation.status === 'ACCEPTED'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {invitation.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
