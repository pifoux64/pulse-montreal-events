/**
 * Client Resend minimaliste pour l'envoi d'emails
 * Provider: Resend (https://resend.com)
 *
 * Nécessite la variable d'environnement RESEND_API_KEY.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

export async function sendEmailViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[Resend] RESEND_API_KEY manquante');
    return { success: false, error: 'RESEND_API_KEY manquante' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'Pulse Montréal <noreply@pulse-montreal.com>',
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[Resend] Erreur HTTP', res.status, body);
      return { success: false, error: `HTTP ${res.status}: ${body}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[Resend] Exception lors de l'envoi:", error);
    return { success: false, error: error?.message || 'Erreur inconnue' };
  }
}


