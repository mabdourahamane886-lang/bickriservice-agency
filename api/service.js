// Dynamic service share pages backed by Supabase.
// The publishable Supabase key is safe to expose; RLS only permits public reads of active services.
const SITE = 'https://bickriservice-agency.vercel.app';
const SUPABASE_URL = 'https://okdohokhlkxrmxpevees.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function absoluteImage(src) {
  if (/^https?:\/\//i.test(src || '')) return src;
  return SITE + (String(src || '').charAt(0) === '/' ? src : '/' + src);
}

async function getService(code) {
  const url = SUPABASE_URL + '/rest/v1/agency_services?select=slug,name,short_description,description,image_url,reference_code,share_url,og_title,og_description,og_image&reference_code=eq.' + encodeURIComponent(code) + '&active=eq.true&limit=1';
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY
    }
  });
  if (!response.ok) throw new Error('Supabase returned ' + response.status);
  const rows = await response.json();
  return rows[0] || null;
}

module.exports = async function (req, res) {
  const code = String((req.query && req.query.code) || '').trim().toUpperCase();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (!code) {
    res.statusCode = 400;
    return res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Référence manquante</title></head><body><h1>Référence de service manquante</h1></body></html>');
  }

  let service;
  try {
    service = await getService(code);
  } catch (error) {
    console.error('Supabase service lookup failed:', error);
    res.statusCode = 503;
    return res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bickri Service Agency</title></head><body><h1>Service temporairement indisponible</h1><p>Veuillez réessayer dans quelques instants.</p></body></html>');
  }

  if (!service) {
    res.statusCode = 404;
    return res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Service introuvable</title></head><body><h1>Référence de service introuvable</h1><p><a href="' + SITE + '/services/">Voir tous les services</a></p></body></html>');
  }

  const publicUrl = service.share_url || (SITE + '/s/' + encodeURIComponent(service.reference_code));
  const appUrl = SITE + '/services/' + encodeURIComponent(service.slug) + '/';
  const image = absoluteImage(service.og_image || service.image_url);
  const title = service.og_title || (service.name + ' — Bickri Service Agency');
  const description = service.og_description || service.short_description;
  const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title>' +
    '<meta name="description" content="' + escapeHtml(description) + '">' +
    '<link rel="canonical" href="' + escapeHtml(publicUrl) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Bickri Service Agency">' +
    '<meta property="og:url" content="' + escapeHtml(publicUrl) + '">' +
    '<meta property="og:title" content="' + escapeHtml(title) + '">' +
    '<meta property="og:description" content="' + escapeHtml(description) + '">' +
    '<meta property="og:image" content="' + escapeHtml(image) + '">' +
    '<meta property="og:image:alt" content="' + escapeHtml(service.name) + '">' +
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' +
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + escapeHtml(title) + '">' +
    '<meta name="twitter:description" content="' + escapeHtml(description) + '"><meta name="twitter:image" content="' + escapeHtml(image) + '">' +
    '</head><body style="margin:0;background:#08101f;color:#fff;font-family:Arial,sans-serif">' +
    '<main style="max-width:900px;margin:auto;padding:24px">' +
    '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(service.name) + '" style="width:100%;max-height:520px;object-fit:cover;border-radius:20px">' +
    '<p style="color:#d9a441;font-weight:700;letter-spacing:.08em">BICKRI SERVICE AGENCY · NIAMEY · NIGER</p>' +
    '<h1>' + escapeHtml(service.name) + '</h1><p style="font-size:18px;line-height:1.6">' + escapeHtml(description) + '</p>' +
    '<p><strong>Référence :</strong> ' + escapeHtml(service.reference_code) + '</p>' +
    '<p><a href="' + escapeHtml(appUrl) + '" style="display:inline-block;padding:14px 20px;background:#d9a441;color:#08101f;text-decoration:none;border-radius:10px;font-weight:700">Ouvrir le service</a></p>' +
    '</main></body></html>';

  return res.end(html);
};
