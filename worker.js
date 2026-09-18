const SITE_VERSION = '2026-09-18-macaly-sync-1';
const ASSET_VERSION = '2026-09-18-macaly-sync-1';
const SUPABASE_URL = 'https://okdohokhlkxrmxpevees.supabase.co';

const SERVICES = [
  'Création web', 'E-commerce', 'Réseaux sociaux', 'Intelligence artificielle',
  'Branding & design', 'Publicité digitale', 'Formation & coaching'
];

const SYSTEM_PROMPT = `Tu es Bickri AI, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.
MISSION: répondre clairement aux visiteurs à propos des services de l'agence et les orienter vers la prise de contact.
SERVICES: ${SERVICES.join(', ')}.
CONTACT: WhatsApp +227 88 37 61 33. Email bickriserviceagency@gmail.com.
REGLES: reste dans le périmètre de Bickri Service Agency. Ne fabrique pas de tarifs, délais, garanties, clients ou résultats non fournis. Pour un prix exact, indique que le devis est personnalisé. Réponds en français sauf si l'utilisateur écrit clairement dans une autre langue. Ton professionnel, chaleureux et concis.`;

function json(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extraHeaders
  });
  return new Response(JSON.stringify(body), { status, headers });
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getSessionId(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)bickri_ai_session=([^;]+)/i);
  return match && isUuid(match[1]) ? match[1] : null;
}

async function supabaseRequest(path, key, options = {}) {
  if (!key) return null;
  const headers = new Headers(options.headers || {});
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response;
}

async function ensureConversation(sessionId, key) {
  if (!key || !sessionId) return null;
  const response = await supabaseRequest('agency_ai_conversations?on_conflict=session_id', key, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ session_id: sessionId, updated_at: new Date().toISOString() })
  });
  const rows = await response.json().catch(() => []);
  return rows?.[0]?.id || null;
}

async function loadConversationHistory(conversationId, key) {
  if (!key || !conversationId) return [];
  const response = await supabaseRequest(
    `agency_ai_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=role,content&order=created_at.desc&limit=8`,
    key,
    { method: 'GET' }
  );
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows)
    ? rows.reverse().filter(item => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string').map(item => ({ role: item.role, content: item.content.slice(0, 2000) }))
    : [];
}

async function saveConversationExchange(conversationId, key, userMessage, assistantAnswer) {
  if (!key || !conversationId) return;
  await supabaseRequest('agency_ai_messages', key, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify([
      { conversation_id: conversationId, role: 'user', content: userMessage.slice(0, 4000) },
      { conversation_id: conversationId, role: 'assistant', content: assistantAnswer.slice(0, 4000) }
    ])
  });
  await supabaseRequest(`agency_ai_conversations?id=eq.${encodeURIComponent(conversationId)}`, key, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ updated_at: new Date().toISOString() })
  });
}

function secureSessionCookie(sessionId) {
  return `bickri_ai_session=${sessionId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/bickri-ai') {
      if (request.method === 'OPTIONS') return json({}, 204);
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

      const apiKey = env.AI_API_KEY;
      const endpoint = env.AI_API_URL;
      const model = env.AI_MODEL;
      if (!apiKey || !endpoint || !model) return json({ error: 'AI provider not configured' }, 503);

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      if (!message) return json({ error: 'Message required' }, 400);
      if (message.length > 2000) return json({ error: 'Message too long' }, 400);

      const safeClientHistory = Array.isArray(body?.history)
        ? body.history.slice(-8).filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').map(item => ({ role: item.role, content: item.content.slice(0, 2000) }))
        : [];

      let sessionId = getSessionId(request);
      let conversationId = null;
      let storedHistory = [];
      const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (!sessionId && supabaseKey) sessionId = crypto.randomUUID();
      if (supabaseKey && sessionId) {
        try {
          conversationId = await ensureConversation(sessionId, supabaseKey);
          storedHistory = await loadConversationHistory(conversationId, supabaseKey);
        } catch (error) {
          console.error('Supabase persistence read failed', error);
        }
      }

      const history = storedHistory.length ? storedHistory : safeClientHistory;

      try {
        const upstream = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: message }]
          })
        });
        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) return json({ error: 'AI provider error' }, 502);
        const answer = data?.choices?.[0]?.message?.content || data?.output_text || data?.response;
        if (typeof answer !== 'string' || !answer.trim()) return json({ error: 'Empty AI response' }, 502);

        const finalAnswer = answer.trim();
        if (ctx?.waitUntil && supabaseKey && conversationId) {
          ctx.waitUntil(saveConversationExchange(conversationId, supabaseKey, message, finalAnswer).catch(error => console.error('Supabase persistence write failed', error)));
        }

        const headers = {};
        if (sessionId && !getSessionId(request)) headers['Set-Cookie'] = secureSessionCookie(sessionId);
        return json({ answer: finalAnswer, version: SITE_VERSION, persistence: Boolean(supabaseKey && conversationId) }, 200, headers);
      } catch {
        return json({ error: 'AI request failed' }, 502);
      }
    }

    if (url.pathname === '/api/site-version') return json({ version: SITE_VERSION, assets: ASSET_VERSION, platform: 'Cloudflare Workers' });

    // Production frontend source: latest Macaly application.
    // Cloudflare remains the public production endpoint; /api/bickri-ai stays on this Worker.
    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = 'https:';
    upstreamUrl.hostname = 'r8m11vobvcj4ndqzqvxgylr6.macaly.app';
    upstreamUrl.port = '';
    const upstreamRequest = new Request(upstreamUrl.toString(), request);
    const response = await fetch(upstreamRequest);
    const type = response.headers.get('content-type') || '';
    if (url.pathname === '/' || url.pathname === '/index.html') {
      if (type.includes('text/html')) {
        let html = await response.text();
        const aiTag = `<script src="/bickri-ai.js?v=${ASSET_VERSION}" defer></script>`;
        const headTag = `<script src="/site-head.js?v=${ASSET_VERSION}" defer></script>`;
        const fixTag = `<script src="/site-fix.js?v=${ASSET_VERSION}" defer></script>`;
        html = html.replace(/<script\s+src=["']\/bickri-ai\.js(?:\?[^"']*)?["']\s+defer><\/script>/i, aiTag);
        if (!html.includes('/bickri-ai.js')) html = html.replace('</head>', aiTag + '</head>');
        html = html.replace(/<script\s+src=["']\/site-head\.js(?:\?[^"']*)?["']\s+defer><\/script>/i, headTag);
        if (!html.includes('/site-head.js')) html = html.replace('</head>', headTag + '</head>');
        html = html.replace(/<script\s+src=["']\/site-fix\.js(?:\?[^"']*)?["']\s+defer><\/script>/i, fixTag);
        if (!html.includes('/site-fix.js')) html = html.replace('</head>', fixTag + '</head>');
        const versionMeta = `<meta name="bickri-site-version" content="${SITE_VERSION}">`;
        html = html.replace(/<meta\s+name=["']bickri-site-version["'][^>]*>/i, versionMeta);
        if (!html.includes('name="bickri-site-version"')) html = html.replace('</head>', versionMeta + '</head>');
        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        headers.set('Pragma', 'no-cache');
        headers.set('Expires', '0');
        return new Response(html, { status: response.status, headers });
      }
    }
    return response;
  }
};