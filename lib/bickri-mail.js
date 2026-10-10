/**
 * Bickri Mail — module d'envoi d'e-mails pour Cloudflare Workers.
 * Utilise le binding natif Cloudflare Email Service (PARTNER_EMAIL).
 * Aucun fournisseur tiers ni secret SMTP dans le code public.
 */
const DESTINATION = 'bickriserviceagency@gmail.com';
const SENDER = 'partenaires@bickriservice-agency.org';

const TYPE_LABELS = Object.freeze({
  technical: 'Partenaire technologique',
  referral: 'Apporteur d’affaires',
  integrator: 'Intégrateur',
  other: 'Autre partenariat'
});

function cleanHeader(value, maxLength = 180) {
  return String(value ?? '').replace(/[\r\n\0]/g, ' ').trim().slice(0, maxLength);
}

export async function sendPartnerApplication(binding, data) {
  if (!binding || typeof binding.send !== 'function') {
    const error = new Error('Bickri Mail: le binding PARTNER_EMAIL n’est pas configuré.');
    error.code = 'BICKRI_MAIL_NOT_CONFIGURED';
    throw error;
  }

  const fullName = data.fullName.trim();
  const email = data.email.trim();
  const companyName = data.companyName.trim();
  const websiteUrl = (data.websiteUrl || '').trim();
  const message = data.message.trim();
  const partnerType = data.partnerType;

  const subject = cleanHeader('Candidature partenaire — ' + companyName);
  const text = [
    'Nouvelle candidature de partenariat — Bickri Service Agency',
    '',
    'Nom : ' + fullName,
    'E-mail du candidat : ' + email,
    'Entreprise / organisation : ' + companyName,
    'Site web : ' + (websiteUrl || 'Non renseigné'),
    'Type de partenariat : ' + TYPE_LABELS[partnerType],
    '',
    'Message :',
    message,
    '',
    'Répondre directement au candidat en utilisant la fonction Répondre de votre messagerie.'
  ].join('\n');

  await binding.send({
    from: SENDER,
    to: DESTINATION,
    replyTo: email,
    subject,
    text
  });

  return { ok: true, message: 'Votre candidature a bien été envoyée.' };
}

export const BICKRI_MAIL_INFO = Object.freeze({
  name: 'Bickri Mail',
  destination: DESTINATION,
  sender: SENDER,
  transport: 'Cloudflare Email Service'
});
