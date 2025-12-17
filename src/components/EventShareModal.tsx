'use client';

/**
 * Modal de partage d'événement avec QR code et options de partage social
 */

import { useState } from 'react';
import { X, Copy, Share2, Facebook, Twitter, Linkedin, QrCode, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface EventShareModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventShareModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}: EventShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const eventUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/evenement/${eventId}`
    : '';
  const shareText = `Découvrez cet événement : ${eventTitle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleShare = async (platform: 'native' | 'facebook' | 'twitter' | 'linkedin') => {
    if (platform === 'native') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: eventTitle,
            text: shareText,
            url: eventUrl,
          });
        } else {
          await handleCopyLink();
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          await handleCopyLink();
        }
      }
    } else {
      const urls: Record<string, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
      };
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Partager l'événement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showQR ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={eventUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Scannez ce code pour accéder à l'événement
                </p>
              </div>
              <button
                onClick={() => setShowQR(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retour
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lien à copier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien de l'événement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eventUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
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
              </div>

              {/* Options de partage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Partager sur
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare('native')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Partager</span>
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">QR Code</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

