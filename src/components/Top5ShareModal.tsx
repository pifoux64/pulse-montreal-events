'use client';

/**
 * Modal de partage pour un Top 5 Pulse Picks
 * Sprint V3: Share triggers
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Copy, Share2, Check, MessageCircle, MessageSquare, Phone } from 'lucide-react';
import { generateDeepLinks, shareWithWebAPI, copyToClipboard, addUtmParams } from '@/lib/sharing/shareUtils';
import { trackShareClick, trackShareSuccess } from '@/lib/analytics/tracking';

interface Top5ShareModalProps {
  slug: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Top5ShareModal({
  slug,
  title,
  isOpen,
  onClose,
}: Top5ShareModalProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const top5Url = addUtmParams(`${baseUrl}/top-5/${slug}`, 'share', 'link', 'top5');
  const shareText = `Découvre ce Top 5 : ${title}`;

  const deepLinks = generateDeepLinks(top5Url, shareText);

  const handleCopyLink = async () => {
    await trackShareClick('top5', undefined, slug);
    const success = await copyToClipboard(top5Url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackShareSuccess({
        context: 'top5',
        method: 'copy',
        top5Slug: slug,
        success: true,
        userId: session?.user?.id,
      });
    }
  };

  const handleShare = async (method: 'web_share' | 'whatsapp' | 'messenger' | 'sms') => {
    await trackShareClick('top5', undefined, slug);

    let success = false;

    if (method === 'web_share') {
      success = await shareWithWebAPI({
        title,
        text: shareText,
        url: top5Url,
        context: 'top5',
        top5Slug: slug,
      });
      if (!success) {
        await handleCopyLink();
        return;
      }
    } else if (method === 'whatsapp' || method === 'messenger' || method === 'sms') {
      const link = deepLinks[method];
      if (link) {
        window.open(link, '_blank');
        success = true;
      }
    }

    await trackShareSuccess({
      context: 'top5',
      method,
      top5Slug: slug,
      success,
      userId: session?.user?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Partager ce Top 5</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Lien à copier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien du Top 5
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={top5Url}
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
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => handleShare('web_share')}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Partager</span>
                </button>
              )}
              
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
              </button>
              
              <button
                onClick={() => handleShare('messenger')}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Messenger</span>
              </button>
              
              <button
                onClick={() => handleShare('sms')}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">SMS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

