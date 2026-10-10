/**
 * Bickri Service Agency — envoi des candidatures partenaires via Gmail.
 * Déployer ce projet comme application Web exécutée en tant que votre compte.
 * Dans Paramètres du projet > Propriétés du script, définir PARTNER_MAIL_SECRET
 * avec la même valeur que le secret Cloudflare Worker.
 */
const RECIPIENT = 'bickriserviceagency@gmail.com';

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('PARTNER_MAIL_SECRET');
    if (!expectedSecret || !payload._secret || payload._secret !== expectedSecret) {
      return output({ok:false, error:'Unauthorized'});
    }

    const fullName = clean(payload.fullName, 120);
    const email = clean(payload.email, 254);
    const companyName = clean(payload.companyName, 160);
    const websiteUrl = clean(payload.websiteUrl, 500);
    const partnerType = clean(payload.partnerType, 40);
    const message = clean(payload.message, 5000);
    if (payload.website) return output({ok:true});
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        companyName.length < 2 || message.length < 10 ||
        !['technical','referral','integrator','other'].includes(partnerType) ||
        (websiteUrl && !/^https?:\/\//i.test(websiteUrl))) {
      return output({ok:false, error:'Invalid form'});
    }

    const labels = {
      technical:'Partenaire technologique',
      referral:'Apporteur d’affaires',
      integrator:'Intégrateur',
      other:'Autre partenariat'
    };
    const subject = 'Candidature partenaire — ' + companyName;
    const body = [
      'Nouvelle candidature de partenariat Bickri Service Agency',
      '',
      'Nom : ' + fullName,
      'Email du candidat : ' + email,
      'Entreprise / organisation : ' + companyName,
      'Site web : ' + (websiteUrl || 'Non renseigné'),
      'Type de partenariat : ' + labels[partnerType],
      '',
      'Message :',
      message
    ].join('\n');

    GmailApp.sendEmail(RECIPIENT, subject, body, {
      replyTo: email,
      name: 'Bickri Service Agency — Candidatures partenaires'
    });
    return output({ok:true});
  } catch (error) {
    console.error('Partner mail error: ' + (error && error.message ? error.message : error));
    return output({ok:false, error:'Mail delivery failed'});
  }
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
