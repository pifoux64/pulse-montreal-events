'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import { MessageCircle, Send, ArrowLeft, Users } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/messages');
    } else if (status === 'authenticated') {
      loadConversations();
      if (selectedUserId) {
        loadMessages(selectedUserId);
      }
    }
  }, [status, router, selectedUserId]);

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // Si un userId est dans l'URL, sélectionner cette conversation
        if (selectedUserId) {
          const conversation = data.conversations?.find(
            (c: Conversation) => c.userId === selectedUserId
          );
          if (conversation) {
            setSelectedUser(conversation);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedUser(conversation);
    loadMessages(conversation.userId);
    router.push(`/messages?userId=${conversation.userId}`);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedUser || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.userId,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setMessageContent('');
        
        // Recharger les conversations pour mettre à jour le dernier message
        loadConversations();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="pt-24 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <ModernLoader size="lg" text="Chargement des messages..." variant="default" />
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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <MessageCircle className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Messages</h1>
              <p className="text-slate-400 text-sm">Discute avec les autres pulsers</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex h-[calc(100vh-12rem)]">
              {/* Conversations List */}
              <div className="w-full md:w-1/3 border-r border-white/10 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Aucune conversation</p>
                  </div>
                ) : (
                  <div>
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.userId}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/10 ${
                          selectedUser?.userId === conversation.userId ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                            {conversation.user.image ? (
                              <Image
                                src={conversation.user.image}
                                alt={conversation.user.name || 'User'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Users className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {conversation.user.name || 'Utilisateur'}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 truncate">
                              {conversation.lastMessage.isFromMe ? 'Vous: ' : ''}
                              {conversation.lastMessage.content}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="hidden md:flex flex-col flex-1">
                {selectedUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                        {selectedUser.user.image ? (
                          <Image
                            src={selectedUser.user.image}
                            alt={selectedUser.user.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {selectedUser.user.name || 'Utilisateur'}
                        </h3>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => {
                        const isFromMe = message.sender.id === session.user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isFromMe
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white/10 text-slate-200'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {formatDistanceToNow(new Date(message.createdAt), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Tapez un message..."
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim() || isSending}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">Sélectionnez une conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
