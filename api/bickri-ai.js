const SERVICES = [
  {name:'Création web', details:'Sites vitrines, landing pages, plateformes web et interfaces responsive pour entrepreneurs, entreprises, associations, créateurs et organisations.'},
  {name:'E-commerce', details:'Boutiques en ligne, catalogues, fiches produits, parcours de commande et expériences mobiles pour commerçants et marques.'},
  {name:'Réseaux sociaux', details:'Stratégie de contenu, optimisation de profils, calendrier éditorial, idées de publications et développement d’audience.'},
  {name:'Intelligence artificielle', details:'Conseil IA, automatisations, assistants, workflows et formation pratique aux outils adaptés.'},
  {name:'Branding & design', details:'Logo, identité visuelle, couleurs, typographie, supports de communication et direction créative.'},
  {name:'Publicité digitale', details:'Stratégie publicitaire, création de messages, ciblage, campagnes et optimisation autour d’objectifs de visibilité, prospects ou ventes.'},
  {name:'Formation & coaching', details:'Coaching entrepreneurial, réseaux sociaux, IA, stratégie digitale et formations personnalisées.'}
];

const SYSTEM_PROMPT = `Tu es Bickri AI, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.\n\nMISSION: répondre clairement aux visiteurs à propos des services de l'agence et les orienter vers la prise de contact.\n\nSERVICES:\n${SERVICES.map(s => `- ${s.name}: ${s.details}`).join('\n')}\n\nAUTRES INFORMATIONS: l'agence accompagne les entrepreneurs, créateurs, entreprises et organisations au Niger et à distance. Contact WhatsApp: +227 88 37 61 33. Email: bickriserviceagency@gmail.com.\n\nREGLES: reste dans le périmètre de Bickri Service Agency. Ne fabrique pas de tarifs, délais, garanties, clients ou résultats non fournis. Pour un prix exact, indique que le devis est personnalisé. Tu peux proposer de contacter l'agence. Réponds en français sauf si l'utilisateur écrit clairement dans une autre langue. Ton: professionnel, chaleureux, concis.`;

function fallbackAnswer(message) {
  const q = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (/bonjour|salut|salam|hello|bonsoir/.test(q)) return 'Bonjour 👋 Je suis Bickri IA. Je peux vous renseigner sur nos services, les tarifs sur devis, les formations, le coaching et la façon de démarrer un projet.';
  if (/prix|tarif|cout|combien|devis|budget/.test(q)) return 'Les tarifs sont personnalisés selon le projet, ses fonctionnalités, ses contenus et ses intégrations. Utilisez la page Tarifs ou demandez un devis pour recevoir une proposition adaptée.';
  if (/site|web|plateforme/.test(q)) return 'Nous créons des sites vitrine, landing pages, plateformes web et expériences responsive. Demandez un devis pour décrire votre besoin.';
  if (/e.?commerce|boutique|vente/.test(q)) return 'Nous créons des boutiques en ligne, catalogues, parcours d’achat et fonctionnalités e-commerce adaptées au projet.';
  if (/reseaux|facebook|instagram|tiktok|whatsapp/.test(q)) return 'Nous accompagnons la stratégie de contenu, l’optimisation des profils et le développement de votre présence sur les réseaux sociaux.';
  if (/ia|intelligence artificielle|automatisation|chatbot/.test(q)) return 'Nous travaillons sur les assistants IA, l’automatisation, les workflows et l’intégration d’outils intelligents dans les activités digitales.';
  if (/logo|branding|design|identite/.test(q)) return 'Nous créons logos, identités visuelles, supports de communication et directions artistiques.';
  if (/publicite|ads|campagne/.test(q)) return 'Nous structurons des campagnes de publicité digitale autour d’objectifs de visibilité, prospects ou ventes.';
  if (/formation|cours|apprendre/.test(q)) return 'Nous proposons des formations pratiques en IA, marketing digital, réseaux sociaux et entrepreneuriat.';
  if (/coaching|accompagnement/.test(q)) return 'Nous proposons du coaching entrepreneurial, réseaux sociaux et IA & digital.';
  if (/contact|email|adresse|joindre/.test(q)) return 'Contact : bickriserviceagency@gmail.com ou via le bouton WhatsApp. Bickri Service Agency est basée à Niamey, Niger.';
  return 'Je suis Bickri IA. Je peux vous aider à choisir un service, préparer une demande de devis ou vous expliquer le fonctionnement de Bickri Service Agency. Quel est votre projet ?';
}

function json(res, status, body) {
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return json(res, 405, {error:'Method not allowed'});

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return json(res, 400, {error:'Message required'});
  if (message.length > 2000) return json(res, 400, {error:'Message too long'});

  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_API_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !endpoint || !model) return json(res, 200, {answer:fallbackAnswer(message),mode:'local'});

  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  const safeHistory = history
    .filter(x => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string')
    .map(x => ({role:x.role, content:x.content.slice(0, 2000)}));

  try {
    const upstream = await fetch(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        model,
        temperature:0.2,
        messages:[
          {role:'system', content:SYSTEM_PROMPT},
          ...safeHistory,
          {role:'user', content:message}
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Bickri AI provider error', upstream.status, data);
      return json(res, 200, {answer:fallbackAnswer(message),mode:'local'});
    }

    const content = data?.choices?.[0]?.message?.content || data?.output_text || data?.response;
    if (typeof content !== 'string' || !content.trim()) return json(res, 200, {answer:fallbackAnswer(message),mode:'local'});

    res.setHeader('Cache-Control','no-store');
    return json(res, 200, {answer:content.trim()});
  } catch (error) {
    console.error('Bickri AI request failed', error);
    return json(res, 200, {answer:fallbackAnswer(message),mode:'local'});
  }
};
