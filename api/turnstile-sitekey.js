module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'GET') {
    res.setHeader('Content-Type','application/json');
    return res.status(200).json({siteKey: process.env.TURNSTILE_SITE_KEY || process.env.PUBLIC_TURNSTILE_SITE_KEY || ''});
  }
  return res.status(405).json({error:'Method not allowed'});
};
