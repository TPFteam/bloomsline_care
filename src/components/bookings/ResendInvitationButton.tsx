'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResendInvitationButtonProps {
  bookingId: string;
  /** Shown in the confirmation copy; may be blank if the email was just added to the member. */
  clientEmail?: string | null;
  clientName?: string | null;
  /** Override the trigger button styling per surface. */
  className?: string;
  label?: string;
  locale?: string;
  /** Called after a successful send (e.g. to refresh the surface). */
  onSent?: () => void;
}

const T = {
  en: {
    title: 'Resend invitation',
    withEmail: (email: string) => `Send the appointment invitation to ${email}? They'll receive it from Google Calendar.`,
    withoutEmail: (name: string) => `Send the appointment invitation to ${name}? They'll receive it from Google Calendar.`,
    theClient: 'the client',
    cancel: 'Cancel',
    send: 'Send invitation',
    sent: (email: string) => `Invitation sent to ${email}.`,
    generic: 'Could not send the invitation. Please try again.',
    no_email: 'Add an email address for this client first, then resend.',
    google_not_connected: 'Connect your Google Calendar to send invitations.',
    past: 'This appointment is in the past.',
    cancelled: 'This appointment was cancelled.',
  },
  fr: {
    title: "Renvoyer l'invitation",
    withEmail: (email: string) => `Envoyer l'invitation au rendez-vous à ${email} ? Elle sera envoyée via Google Agenda.`,
    withoutEmail: (name: string) => `Envoyer l'invitation au rendez-vous à ${name} ? Elle sera envoyée via Google Agenda.`,
    theClient: 'ce client',
    cancel: 'Annuler',
    send: "Envoyer l'invitation",
    sent: (email: string) => `Invitation envoyée à ${email}.`,
    generic: "Impossible d'envoyer l'invitation. Veuillez réessayer.",
    no_email: "Ajoutez d'abord une adresse e-mail pour ce client, puis renvoyez.",
    google_not_connected: 'Connectez votre Google Agenda pour envoyer des invitations.',
    past: 'Ce rendez-vous est passé.',
    cancelled: 'Ce rendez-vous a été annulé.',
  },
} as const;

/**
 * "Resend invitation" — re-sends the Google Calendar invite for a booking whose
 * client email was missing at creation. Confirmation popup → POST
 * /api/bookings/[id]/resend-invitation → Google emails the client. Shared across
 * the calendar, session detail, and home calendar surfaces so they behave alike.
 */
export function ResendInvitationButton({
  bookingId,
  clientEmail,
  clientName,
  className,
  label,
  locale,
  onSent,
}: ResendInvitationButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const t = T[locale === 'fr' ? 'fr' : 'en'];
  const recipient = (clientEmail || '').trim();

  async function send() {
    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/resend-invitation`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        toast.success(t.sent(data.email || recipient));
        setConfirming(false);
        onSent?.();
      } else {
        const reasonMsg = data?.reason && (t as Record<string, unknown>)[data.reason];
        toast.error(typeof reasonMsg === 'string' ? reasonMsg : t.generic);
        setConfirming(false);
      }
    } catch {
      toast.error(t.generic);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
        className={className || 'inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800'}
      >
        <Send className="w-4 h-4" />
        {label ?? t.title}
      </button>

      {confirming && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!sending) setConfirming(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {recipient ? t.withEmail(recipient) : t.withoutEmail(clientName || t.theClient)}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t.send}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
