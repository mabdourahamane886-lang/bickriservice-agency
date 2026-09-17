const SERVICES = [
  'Création web',
  'E-commerce',
  'Réseaux sociaux',
  'Intelligence artificielle',
  'Branding & design',
  'Publicité digitale',
  'Formation & coaching'
];

const SYSTEM_PROMPT = `Tu es Bickri AI, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.

MISSION: répondre clairement aux visiteurs à propos des services de l'agence et les orienter vers la prise de contact.

SERVICES: ${SERVICES.join(', ')}.

CONTACT: WhatsApp +227 88 37 61 33. Email bickriserviceagency@gmail.com.

REGLES: reste dans le périmètre de Bickri Service Agency. Ne fabrique pas de tarifs, délais, garanties, clients ou résultats non fournis. Pour un prix exact, indique que le devis est personnalisé. Réponds en français sauf si l'utilisateur écrit clairement dans une autre langue. Ton professionnel, chaleureux et concis.`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/bickri-ai') {
      if (request.method === 'OPTIONS') return json({}, 204);
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

      const apiKey = env.AI_API_KEY;
      const endpoint = env.AI_API_URL;
      const model = env.AI_MODEL;

      if (!apiKey || !endpoint || !model) {
        return json({ error: 'AI provider not configured' }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      if (!message) return json({ error: 'Message required' }, 400);
      if (message.length > 2000) return json({ error: 'Message too long' }, 400);

      const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
      const safeHistory = history
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));

      try {
        const upstream = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...safeHistory,
              { role: 'user', content: message }
            ]
          })
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) return json({ error: 'AI provider error' }, 502);

        const answer = data?.choices?.[0]?.message?.content || data?.output_text || data?.response;
        if (typeof answer !== 'string' || !answer.trim()) {
          return json({ error: 'Empty AI response' }, 502);
        }

        return json({ answer: answer.trim() }, 200);
      } catch {
        return json({ error: 'AI request failed' }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
