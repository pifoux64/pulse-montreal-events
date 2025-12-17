'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { 
  Facebook, 
  Calendar, 
  Music, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

interface PlatformConnection {
  id: string;
  platform: string;
  platformUserId?: string;
  expiresAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Publiez vos événements sur votre page Facebook',
    scopes: ['pages_manage_events', 'pages_show_list'],
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    icon: Calendar,
    color: 'bg-orange-600',
    description: 'Publiez vos événements sur Eventbrite',
    scopes: ['event_management'],
  },
  {
    id: 'resident_advisor',
    name: 'Resident Advisor',
    icon: Music,
    color: 'bg-purple-600',
    description: 'Exportez vos événements au format RA (fichier JSON/CSV)',
    scopes: [],
  },
  {
    id: 'bandsintown',
    name: 'Bandsintown',
    icon: Music,
    color: 'bg-pink-600',
    description: 'Publiez vos événements sur Bandsintown',
    scopes: [],
  },
];

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/organisateur/integrations');
    } else if (status === 'authenticated') {
      loadConnections();
      
      // Vérifier les paramètres d'URL pour les messages de succès/erreur
      const urlParams = new URLSearchParams(window.location.search);
      const urlError = urlParams.get('error');
      const urlSuccess = urlParams.get('success');
      
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
      if (urlSuccess) {
        setSuccess(urlSuccess === 'facebook_connected' ? 'Facebook connecté avec succès' : 
                   urlSuccess === 'eventbrite_connected' ? 'Eventbrite connecté avec succès' : 
                   'Connexion réussie');
      }
    }
  }, [status, router]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizers/integrations');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des intégrations');
      }
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    try {
      setIsConnecting(platformId);
      setError(null);
      
      const response = await fetch(`/api/organizers/integrations/${platformId}/connect`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la connexion');
      }
      
      const data = await response.json();
      
      // Rediriger vers l'URL d'autorisation OAuth
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        // Si pas d'OAuth nécessaire (comme RA), juste recharger
        await loadConnections();
      }
    } catch (err: any) {
      setError(err.message);
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${platformId} ?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/organizers/integrations/${platformId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la déconnexion');
      }
      
      await loadConnections();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRefresh = async (platformId: string) => {
    try {
      const response = await fetch(`/api/organizers/integrations/${platformId}/refresh`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du rafraîchissement');
      }
      
      await loadConnections();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getConnectionStatus = (platformId: string) => {
    const connection = connections.find(c => c.platform === platformId);
    if (!connection) return 'disconnected';
    
    // Vérifier si le token est expiré
    if (connection.expiresAt) {
      const expiresAt = new Date(connection.expiresAt);
      if (expiresAt < new Date()) {
        return 'expired';
      }
    }
    
    return 'connected';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Intégrations
          </h1>
          <p className="text-gray-600">
            Connectez vos comptes pour publier vos événements automatiquement sur plusieurs plateformes
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const status = getConnectionStatus(platform.id);
            const connection = connections.find(c => c.platform === platform.id);
            const isConnecting = isConnecting === platform.id;
            
            return (
              <div
                key={platform.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${platform.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  
                  {status === 'connected' && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {status === 'expired' && (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>

                {status === 'connected' && connection && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">Connecté</p>
                      {connection.platformUserId && (
                        <p className="text-gray-500">
                          ID: {connection.platformUserId}
                        </p>
                      )}
                      {connection.expiresAt && (
                        <p className="text-gray-500">
                          Expire: {new Date(connection.expiresAt).toLocaleDateString('fr-CA')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {status === 'expired' && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      La connexion a expiré. Veuillez rafraîchir ou reconnecter.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {status === 'disconnected' ? (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Connecter
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {status === 'expired' && (
                        <button
                          onClick={() => handleRefresh(platform.id)}
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Rafraîchir
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Déconnecter
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Comment ça fonctionne ?
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Connectez vos comptes une fois</li>
            <li>• Créez un événement sur Pulse</li>
            <li>• Cliquez sur "Publier partout" pour le diffuser automatiquement</li>
            <li>• Vos événements seront synchronisés sur toutes les plateformes connectées</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

