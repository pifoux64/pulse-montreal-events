'use client';

import { useState } from 'react';
import { UserPlus, X, Loader2, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface InviteFriendButtonProps {
  eventId: string;
  eventTitle: string;
}

export default function InviteFriendButton({ eventId, eventTitle }: InviteFriendButtonProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

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
      const promises = selectedUsers.map((userId) =>
        fetch('/api/events/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            receiverId: userId,
            message: message || undefined,
          }),
        })
      );

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
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Inviter des amis</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUsers([]);
                  setMessage('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-2">Événement :</p>
              <p className="text-white font-semibold">{eventTitle}</p>
            </div>

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
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer"
                      >
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
          </div>
        </div>
      )}
    </>
  );
}
