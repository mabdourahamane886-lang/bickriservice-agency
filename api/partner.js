const ALLOWED_TYPES = new Set(["technical", "referral", "integrator", "other"]);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { fullName, email, companyName, websiteUrl = "", partnerType, message, website = "" } = req.body || {};

  // Champ piège anti-spam : les vrais utilisateurs le laissent vide.
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

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.PARTNER_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !recipient || !from) {
    console.error("Partner API is missing RESEND_API_KEY, PARTNER_EMAIL or RESEND_FROM_EMAIL.");
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
