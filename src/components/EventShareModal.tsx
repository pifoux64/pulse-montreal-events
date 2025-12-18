'use client';

/**
 * Modal de partage d'événement avec QR code et options de partage social
 * Sprint V1: Amélioré avec Web Share API, deep links WhatsApp/Messenger/SMS, et tracking
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Copy, Share2, Facebook, Twitter, Linkedin, QrCode, Check, MessageCircle, MessageSquare, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateEventShareText, generateDeepLinks, shareWithWebAPI, copyToClipboard, addUtmParams } from '@/lib/sharing/shareUtils';
import { trackShareClick, trackShareSuccess } from '@/lib/analytics/tracking';

interface EventShareModalProps {
  eventId: string;
  eventTitle: string;
  eventVenue?: { name: string } | null;
  eventStartAt?: Date;
  eventNeighborhood?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventShareModal({
  eventId,
  eventTitle,
  eventVenue,
  eventStartAt,
  eventNeighborhood,
  isOpen,
  onClose,
}: EventShareModalProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const eventUrl = addUtmParams(`${baseUrl}/evenement/${eventId}`, 'share', 'link');
  
  // Générer un texte de partage intelligent basé sur la date
  const shareText = eventStartAt
    ? generateEventShareText({
        title: eventTitle,
        venue: eventVenue,
        startAt: eventStartAt,
        neighborhood: eventNeighborhood,
      })
    : `Découvrez cet événement : ${eventTitle}`;

  const deepLinks = generateDeepLinks(eventUrl, shareText);

  const handleCopyLink = async () => {
    await trackShareClick('event', eventId);
    const success = await copyToClipboard(eventUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackShareSuccess({
        context: 'event',
        method: 'copy',
        eventId,
        success: true,
        userId: session?.user?.id,
      });
    }
  };

  const handleShare = async (method: 'web_share' | 'whatsapp' | 'messenger' | 'sms' | 'facebook' | 'twitter' | 'linkedin') => {
    await trackShareClick('event', eventId);

    let success = false;

    if (method === 'web_share') {
      success = await shareWithWebAPI({
        title: eventTitle,
        text: shareText,
        url: eventUrl,
        eventId,
        context: 'event',
      });
      if (!success) {
        // Fallback vers copie si Web Share API n'est pas disponible
        await handleCopyLink();
        return;
      }
    } else if (method === 'whatsapp' || method === 'messenger' || method === 'sms') {
      const link = deepLinks[method];
      if (link) {
        window.open(link, '_blank');
        success = true;
      }
    } else {
      // Facebook, Twitter, LinkedIn
      const urls: Record<string, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
      };
      window.open(urls[method], '_blank', 'width=600,height=400');
      success = true;
    }

    // Track le succès
    await trackShareSuccess({
      context: 'event',
      method,
      eventId,
      success,
      userId: session?.user?.id,
    });

    // Track aussi dans l'ancien système pour compatibilité
    if (session?.user?.id) {
      fetch('/api/user/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, type: 'SHARE' }),
      }).catch(() => {});
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
                  {/* Web Share API (mobile) */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={() => handleShare('web_share')}
                      className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Partager</span>
                    </button>
                  )}
                  
                  {/* WhatsApp (desktop) */}
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </button>
                  
                  {/* Messenger */}
                  <button
                    onClick={() => handleShare('messenger')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Messenger</span>
                  </button>
                  
                  {/* SMS */}
                  <button
                    onClick={() => handleShare('sms')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">SMS</span>
                  </button>
                  
                  {/* QR Code */}
                  <button
                    onClick={() => setShowQR(true)}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">QR Code</span>
                  </button>
                  
                  {/* Facebook */}
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </button>
                  
                  {/* Twitter */}
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                  </button>
                  
                  {/* LinkedIn */}
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
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

