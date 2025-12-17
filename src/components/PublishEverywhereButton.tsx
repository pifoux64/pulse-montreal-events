'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Share2, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface PublicationResult {
  platform: string;
  success: boolean;
  platformEventId?: string;
  platformEventUrl?: string;
  error?: string;
  warnings?: string[];
}

interface PublicationSummary {
  eventId: string;
  organizerId: string;
  results: PublicationResult[];
  totalSuccess: number;
  totalErrors: number;
}

interface PublishEverywhereButtonProps {
  eventId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export default function PublishEverywhereButton({
  eventId,
  className = '',
  variant = 'default',
}: PublishEverywhereButtonProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState<PublicationSummary | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setResults(null);
      setShowResults(false);

      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la publication');
      }

      const data = await response.json();
      setResults(data.summary);
      setShowResults(true);
    } catch (error: any) {
      setResults({
        eventId,
        organizerId: '',
        results: [{
          platform: 'error',
          success: false,
          error: error.message,
        }],
        totalSuccess: 0,
        totalErrors: 1,
      });
      setShowResults(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50';
      case 'ghost':
        return 'text-blue-600 hover:bg-blue-50';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      facebook: 'Facebook',
      eventbrite: 'Eventbrite',
      resident_advisor: 'Resident Advisor',
      bandsintown: 'Bandsintown',
    };
    return names[platform] || platform;
  };

  return (
    <div className="relative">
      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className={`
          px-6 py-3 rounded-lg font-semibold transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
          ${getVariantClasses()}
          ${className}
        `}
      >
        {isPublishing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Publication en cours...
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            Publier partout
          </>
        )}
      </button>

      {showResults && results && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Résultats de publication
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {getPlatformName(result.platform)}
                      </p>
                      {result.platformEventUrl && (
                        <a
                          href={result.platformEventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {result.success ? (
                      <p className="text-sm text-green-700 mt-1">
                        Publié avec succès
                        {result.platformEventId && ` (ID: ${result.platformEventId})`}
                      </p>
                    ) : (
                      <p className="text-sm text-red-700 mt-1">
                        {result.error || 'Erreur inconnue'}
                      </p>
                    )}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="mt-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                          {result.warnings.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {results.totalSuccess} succès
              </span>
              <span className="text-gray-600">
                {results.totalErrors} erreur{results.totalErrors > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

