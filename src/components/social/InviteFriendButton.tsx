'use client';

import { useState } from 'react';
import { UserPlus, X, Loader2, CheckCircle, Copy, Share2, MessageCircle, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface InviteFriendButtonProps {
  eventId: string;
  eventTitle: string;
  eventUrl?: string;
}

export default function InviteFriendButton({ eventId, eventTitle, eventUrl }: InviteFriendButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [urlCopied, setUrlCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'share'>('invite');
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const finalEventUrl = eventUrl || `${baseUrl}/evenement/${eventId}`;

  const handleOpenModal = async () => {
    if (!session) return;
    setShowModal(true);
    setError(null);
    setIsLoading(true);

    try {
      // Récupérer la liste des utilisateurs que je suis (mes amis)
      const res = await fetch('/api/users/following');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.following || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des amis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) {
      setError('Sélectionnez au moins un ami');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Envoyer les invitations ET les messages via Pulse
      const promises = selectedUsers.map(async (userId) => {
        // Créer l'invitation
        await fetch('/api/events/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            receiverId: userId,
            message: message || undefined,
          }),
        });
        
        // Envoyer un message via Pulse avec le lien de l'événement
        const messageContent = message 
          ? `${message}\n\n${finalEventUrl}`
          : `Viens à cet événement avec moi ! ${eventTitle}\n\n${finalEventUrl}`;
        
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: userId,
            content: messageContent,
          }),
        });
      });

      await Promise.all(promises);
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedUsers([]);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(finalEventUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      setError('Impossible de copier le lien');
    }
  };

  const handleSendMessage = async (userId: string) => {
    // Rediriger vers la page de messages avec l'utilisateur sélectionné
    router.push(`/messages?userId=${userId}&eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`);
    setShowModal(false);
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
      >
        <UserPlus className="w-4 h-4" />
        Inviter des amis
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Inviter des amis</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUsers([]);
                  setMessage('');
                  setUrlCopied(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
              <button
                onClick={() => setActiveTab('invite')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'invite'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Inviter via Pulse
              </button>
              <button
                onClick={() => setActiveTab('share')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'share'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                Partager l'URL
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-2">Événement :</p>
              <p className="text-white font-semibold">{eventTitle}</p>
            </div>

            {activeTab === 'share' ? (
              /* Tab Partage URL */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Lien de l'événement
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={finalEventUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                    >
                      {urlCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Partagez ce lien sur WhatsApp, Messenger, SMS ou tout autre moyen
                  </p>
                </div>
              </div>
            ) : (
              /* Tab Invitation Pulse */
              <>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>Vous ne suivez personne pour le moment</p>
                <p className="text-sm mt-2">Suivez des utilisateurs pour les inviter</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-slate-300 text-sm mb-2">Sélectionnez des amis :</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      >
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-sm">
                            {user.name?.[0] || '?'}
                          </div>
                          <span className="text-white">{user.name || 'Utilisateur'}</span>
                        </label>
                        <button
                          onClick={() => handleSendMessage(user.id)}
                          className="p-2 text-sky-400 hover:text-sky-300 hover:bg-white/5 rounded-lg transition-colors"
                          title="Envoyer un message direct"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message (optionnel)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Viens à cet événement avec moi !"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Invitations envoyées !
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSendInvitations}
                    disabled={isSending || selectedUsers.length === 0}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Envoyer ({selectedUsers.length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedUsers([]);
                      setMessage('');
                    }}
                    className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
            )}
          </div>
        </div>
      )}
    </>
  );
}
