const ALLOWED_TYPES = new Set(["technical", "referral", "integrator", "other"]);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const rateBuckets = globalThis.__bickriPartnerRateBuckets || new Map();
globalThis.__bickriPartnerRateBuckets = rateBuckets;

function clientIp(req) {
  // Vercel sets x-forwarded-for at the edge; use the first address for per-IP throttling.
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim().slice(0, 80);
}

function allowOrigin(origin) {
  return origin === "https://bickriservice-agency.org" ||
    origin === "https://www.bickriservice-agency.org" ||
    origin === "https://bickriservice-agency-w44v.vercel.app";
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true &&
      (!result.hostname || ["bickriservice-agency.org", "www.bickriservice-agency.org", "bickriservice-agency-w44v.vercel.app"].includes(result.hostname));
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const origin = String(req.headers.origin || "");
  if (!allowOrigin(origin)) return res.status(403).json({ error: "Origine non autorisée." });

  const ip = clientIp(req);
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (now - value.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
    }
  }
  if (bucket.count > RATE_MAX) {
    res.setHeader("Retry-After", String(Math.ceil((RATE_WINDOW_MS - (now - bucket.startedAt)) / 1000)));
    return res.status(429).json({ error: "Trop de tentatives. Réessayez dans quelques minutes." });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Requête invalide." });
  }
  const { fullName, email, companyName, websiteUrl = "", partnerType, message, website = "", turnstileToken = "" } = body;

  // Honeypot: respond generically to bots without sending mail.
  if (website) return res.status(200).json({ ok: true });

  if (
    typeof fullName !== "string" || fullName.trim().length < 2 || fullName.length > 120 ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    typeof companyName !== "string" || companyName.trim().length < 2 || companyName.length > 160 ||
    typeof message !== "string" || message.trim().length < 10 || message.length > 5000 ||
    !ALLOWED_TYPES.has(partnerType) ||
    (websiteUrl && (typeof websiteUrl !== "string" || websiteUrl.length > 500 || !/^https?:\/\//i.test(websiteUrl)))
  ) {
    return res.status(400).json({ error: "Vérifiez les champs du formulaire puis réessayez." });
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error("Partner API: TURNSTILE_SECRET_KEY is not configured.");
    return res.status(503).json({ error: "La vérification anti-robot est indisponible. Réessayez plus tard." });
  }
  const captchaValid = await verifyTurnstile(String(turnstileToken || "").trim(), ip);
  if (!captchaValid) return res.status(403).json({ error: "Vérification anti-robot échouée. Veuillez valider le contrôle puis réessayer." });

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.PARTNER_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !from) {
    console.error("Partner API is missing required email configuration.");
    return res.status(503).json({ error: "Le formulaire n'est pas encore configuré. Veuillez réessayer plus tard ou nous contacter directement." });
  }

  const typeLabels = {
    technical: "Partenaire technologique",
    referral: "Apporteur d'affaires",
    integrator: "Intégrateur",
    other: "Autre partenariat"
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email.trim(),
        subject: `Candidature partenaire — ${companyName.trim()}`,
        text: [
          "Nouvelle candidature de partenariat Bickri Service Agency",
          "",
          `Nom : ${fullName.trim()}`,
          `Email : ${email.trim()}`,
          `Organisation : ${companyName.trim()}`,
          `Site web : ${websiteUrl.trim() || "Non renseigné"}`,
          `Type : ${typeLabels[partnerType]}`,
          "",
          "Message :",
          message.trim()
        ].join("\n")
      })
    });
    if (!response.ok) {
      console.error("Resend partner email failed with status:", response.status);
      return res.status(502).json({ error: "L'envoi a échoué. Veuillez réessayer dans quelques instants." });
    }
    return res.status(200).json({ ok: true, message: "Votre candidature a bien été envoyée." });
  } catch (error) {
    console.error("Partner email request failed:", error?.message || "unknown error");
    return res.status(502).json({ error: "Impossible d'envoyer la candidature pour le moment." });
  }
};
