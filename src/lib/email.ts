/**
 * Resend wrapper. All transactional email leaves the app through this module
 * so the provider can be swapped without touching call sites.
 */

import { Resend } from 'resend';
import { logger } from './logger';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@example.com';

export const resend = apiKey ? new Resend(apiKey) : null;

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ id: string } | { error: string }> {
  if (!resend) {
    logger.warn({ to: input.to, subject: input.subject }, 'Resend not configured; skipping email send');
    return { error: 'email_disabled' };
  }
  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (res.error) {
      logger.error({ error: res.error, to: input.to }, 'Resend returned error');
      return { error: res.error.message ?? 'unknown_error' };
    }
    return { id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: input.to }, 'Resend threw');
    return { error: (err as Error).message };
  }
}

// Email bodies are composed by callers (templates live in src/lib/emails/*).
// Keeping the wiring here lets us swap SMTP later without touching call sites.
export const emailTemplates = {
  orderConfirmation(orderNumber: string, locale: 'en' | 'es' = 'en') {
    const subject =
      locale === 'es'
        ? `Confirmación de tu pedido ${orderNumber}`
        : `Your order ${orderNumber} is confirmed`;
    const html =
      locale === 'es'
        ? `<p>Gracias por tu compra. Tu número de pedido es <strong>${orderNumber}</strong>.</p>`
        : `<p>Thanks for your order. Your order number is <strong>${orderNumber}</strong>.</p>`;
    return { subject, html };
  },
  shipmentNotification(
    orderNumber: string,
    carrier: string,
    trackingNumber: string,
    locale: 'en' | 'es' = 'en',
  ) {
    const subject =
      locale === 'es'
        ? `Tu pedido ${orderNumber} ha sido enviado`
        : `Your order ${orderNumber} has shipped`;
    const html =
      locale === 'es'
        ? `<p>Tu pedido ha sido enviado por ${carrier}. Número de seguimiento: <strong>${trackingNumber}</strong>.</p>`
        : `<p>Your order has shipped via ${carrier}. Tracking number: <strong>${trackingNumber}</strong>.</p>`;
    return { subject, html };
  },
  refundIssued(orderNumber: string, amountCents: number, locale: 'en' | 'es' = 'en') {
    const amount = (amountCents / 100).toFixed(2);
    const subject =
      locale === 'es' ? `Reembolso emitido para ${orderNumber}` : `Refund issued for ${orderNumber}`;
    const html =
      locale === 'es'
        ? `<p>Hemos emitido un reembolso de $${amount} para tu pedido ${orderNumber}.</p>`
        : `<p>We've issued a refund of $${amount} for your order ${orderNumber}.</p>`;
    return { subject, html };
  },
};