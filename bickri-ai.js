(() => {
  const DATA = {
    web: {
      name: 'Création web',
      keywords: ['site', 'site web', 'website', 'plateforme', 'landing', 'vitrine', 'internet', 'application web'],
      answer: 'Bickri Service Agency crée des sites vitrines, landing pages, plateformes web et interfaces responsive. Nous adaptons la structure au besoin, à l’objectif et au mobile.'
    },
    ecommerce: {
      name: 'E-commerce',
      keywords: ['ecommerce', 'e-commerce', 'boutique', 'vente en ligne', 'produits', 'shop', 'catalogue'],
      answer: 'Nous créons des boutiques en ligne avec catalogue, fiches produits, parcours de commande et expérience mobile. La solution peut être adaptée à votre activité et à votre mode de vente.'
    },
    social: {
      name: 'Réseaux sociaux',
      keywords: ['facebook', 'instagram', 'tiktok', 'whatsapp', 'réseaux', 'social', 'contenu', 'abonnés', 'audience'],
      answer: 'Nous accompagnons les créateurs, marques et entrepreneurs sur les réseaux sociaux : stratégie, optimisation de profil, calendrier éditorial, idées de contenus et développement d’audience.'
    },
    ai: {
      name: 'Intelligence artificielle',
      keywords: ['ia', 'intelligence artificielle', 'chatbot', 'automatisation', 'assistant', 'automatiser', 'productivité'],
      answer: 'Nous intégrons l’IA dans les activités : assistants, automatisations, workflows et formation aux outils adaptés. L’objectif est de gagner du temps et d’améliorer la productivité.'
    },
    branding: {
      name: 'Branding & design',
      keywords: ['logo', 'branding', 'identité visuelle', 'design', 'charte', 'couleurs', 'affiche', 'flyer'],
      answer: 'Nous construisons des identités visuelles professionnelles : logo, couleurs, typographie, supports de communication et direction créative.'
    },
    ads: {
      name: 'Publicité digitale',
      keywords: ['publicité', 'ads', 'facebook ads', 'instagram ads', 'campagne', 'marketing', 'acquisition', 'prospects'],
      answer: 'Nous préparons et optimisons des campagnes publicitaires orientées vers un objectif : visibilité, génération de prospects ou ventes.'
    },
    coaching: {
      name: 'Formation & coaching',
      keywords: ['formation', 'coaching', 'apprendre', 'cours', 'entrepreneuriat', 'entrepreneur', 'coach', 'réussir'],
      answer: 'Nous proposons du coaching entrepreneurial, réseaux sociaux, IA et stratégie digitale, avec une approche pratique et une feuille de route adaptée au niveau du client.'
    }
  };

  const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const findService = (text) => {
    const q = normalize(text);
    let best = null;
    let score = 0;
    Object.entries(DATA).forEach(([key, service]) => {
      let s = 0;
      service.keywords.forEach((keyword) => {
        const k = normalize(keyword);
        if (q.includes(k)) s += k.length > 5 ? 3 : 2;
      });
      if (s > score) { score = s; best = { key, ...service }; }
    });
    return best && score > 0 ? best : null;
  };

  const answer = (question) => {
    const q = normalize(question);
    const service = findService(question);
    if (/bonjour|salut|hello|bonsoir/.test(q)) {
      return 'Bonjour 👋 Je suis Bickri AI, l’assistant de Bickri Service Agency. Je peux vous renseigner sur nos services, le fonctionnement de nos accompagnements et la façon de demander un devis.';
    }
    if (/qui etes vous|qui es tu|bickri ai|c'est quoi bickri/.test(q)) {
      return 'Je suis Bickri AI, l’assistant digital de Bickri Service Agency. Je réponds aux questions sur nos services et vous oriente vers l’équipe.';
    }
    if (/service|faites vous|proposez|offre|expertise/.test(q) && !service) {
      return 'Nous proposons notamment : création web, e-commerce, réseaux sociaux, intelligence artificielle, branding & design, publicité digitale, formation et coaching.';
    }
    if (/prix|tarif|cout|combien|budget|devis/.test(q)) {
      return 'Le tarif dépend du besoin, du périmètre et des fonctionnalités. Bickri Service Agency prépare un devis personnalisé après avoir compris votre projet. Vous pouvez demander un devis directement sur WhatsApp.';
    }
    if (/contact|whatsapp|joindre|telephone|numero|email/.test(q)) {
      return 'Vous pouvez contacter Bickri Service Agency sur WhatsApp au +227 88 37 61 33 ou par e-mail à bickriserviceagency@gmail.com.';
    }
    if (/niamey|niger|distance|remote|exterieur/.test(q)) {
      return 'Bickri Service Agency est basée à Niamey, Niger, et peut aussi accompagner des projets à distance.';
    }
    if (service) {
      return `${service.answer} Pour ce service, cliquez sur « Démarrer » ou contactez-nous pour préciser votre projet.`;
    }
    if (/commencer|demarrer|projet|besoin|aide/.test(q)) {
      return 'Expliquez-moi votre objectif, par exemple « Je veux un site pour mon entreprise », « Je veux développer mon TikTok » ou « Je veux automatiser une tâche ». Je vous orienterai vers le service adapté.';
    }
    return 'Je peux vous renseigner sur nos services de création web, e-commerce, réseaux sociaux, IA, branding, publicité, formation et coaching. Posez-moi votre question en quelques mots.';
  };

  const style = document.createElement('style');
  style.textContent = `
    #bickriAiButton{position:fixed;right:22px;bottom:88px;z-index:80;width:62px;height:62px;border-radius:50%;border:1px solid #f3cf78;background:linear-gradient(145deg,#08101f,#172640);color:#f3cf78;display:grid;place-items:center;font:900 13px Manrope,Arial;box-shadow:0 16px 40px rgba(8,16,31,.28);cursor:pointer}
    #bickriAiButton span{font-size:11px;letter-spacing:.04em}
    #bickriAiPanel{position:fixed;right:22px;bottom:162px;z-index:79;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100vh - 190px));display:none;flex-direction:column;overflow:hidden;border-radius:24px;background:#fff;border:1px solid #e3e8f0;box-shadow:0 28px 100px rgba(8,16,31,.27)}
    #bickriAiPanel.open{display:flex}
    .bai-head{padding:18px 18px 15px;background:linear-gradient(135deg,#08101f,#12203b);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .bai-brand{display:flex;align-items:center;gap:10px}.bai-mark{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#f3cf78;color:#08101f;font-weight:900}.bai-head strong{font:800 15px Manrope,Arial}.bai-head small{display:block;color:#c4cedd;font-size:10px;margin-top:2px}.bai-close{border:0;background:#ffffff14;color:#fff;width:34px;height:34px;border-radius:10px;cursor:pointer;font-size:18px}
    .bai-suggest{display:flex;gap:7px;overflow:auto;padding:10px 12px;border-bottom:1px solid #edf0f5;background:#fafbfd}.bai-chip{border:1px solid #e1e6ee;background:#fff;color:#4e5b70;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer}
    #bickriAiMessages{flex:1;overflow:auto;padding:14px;background:#f7f9fc}.bai-msg{display:flex;margin:8px 0}.bai-msg.user{justify-content:flex-end}.bai-bubble{max-width:86%;padding:10px 12px;border-radius:15px;font-size:12px;line-height:1.55}.bai-msg.assistant .bai-bubble{background:#fff;border:1px solid #e5eaf1;color:#253149;border-bottom-left-radius:6px}.bai-msg.user .bai-bubble{background:#08101f;color:#fff;border-bottom-right-radius:6px}.bai-time{display:block;font-size:9px;opacity:.55;margin-top:5px}
    .bai-input{display:flex;gap:7px;padding:11px;border-top:1px solid #e5eaf1;background:#fff}.bai-input textarea{flex:1;resize:none;min-height:44px;max-height:90px;padding:10px 11px;border:1px solid #dce3ed;border-radius:12px;font:inherit;font-size:12px;outline:none}.bai-send{width:45px;border:0;border-radius:12px;background:linear-gradient(135deg,#d9a441,#b9852d);color:#08101f;font-size:17px;cursor:pointer}.bai-note{padding:7px 11px;background:#fff9e9;color:#7e5b1b;font-size:9px;border-top:1px solid #ead9ad;text-align:center}
    @media(max-width:620px){#bickriAiButton{right:14px;bottom:84px;width:57px;height:57px}#bickriAiPanel{right:10px;bottom:150px;width:calc(100vw - 20px);height:min(72vh,640px)}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'bickriAiPanel';
  panel.innerHTML = `
    <div class="bai-head"><div class="bai-brand"><div class="bai-mark">B</div><div><strong>Bickri AI</strong><small>Assistant de Bickri Service Agency</small></div></div><button class="bai-close" type="button" aria-label="Fermer">×</button></div>
    <div class="bai-suggest"><button class="bai-chip">Quels services proposez-vous ?</button><button class="bai-chip">Combien coûte un site ?</button><button class="bai-chip">Vous faites du coaching ?</button><button class="bai-chip">Comment vous contacter ?</button></div>
    <div id="bickriAiMessages"></div>
    <div class="bai-input"><textarea id="bickriAiInput" rows="1" placeholder="Posez votre question…"></textarea><button class="bai-send" type="button" aria-label="Envoyer">➤</button></div>
    <div class="bai-note">Bickri AI répond à partir des informations publiques de Bickri Service Agency.</div>
  `;
  document.body.appendChild(panel);

  const button = document.createElement('button');
  button.id = 'bickriAiButton';
  button.type = 'button';
  button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>AI</span>';
  button.setAttribute('aria-label', 'Ouvrir Bickri AI');
  document.body.appendChild(button);

  const messages = panel.querySelector('#bickriAiMessages');
  const input = panel.querySelector('#bickriAiInput');
  const send = panel.querySelector('.bai-send');

  const addMessage = (text, role = 'assistant') => {
    const row = document.createElement('div');
    row.className = `bai-msg ${role}`;
    row.innerHTML = `<div class="bai-bubble">${text.replace(/[<>]/g, '')}<span class="bai-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>`;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  };

  const sendMessage = () => {
    const q = input.value.trim();
    if (!q) return;
    addMessage(q, 'user');
    input.value = '';
    setTimeout(() => addMessage(answer(q), 'assistant'), 260);
  };

  addMessage('Bonjour 👋 Je suis <strong>Bickri AI</strong>. Je peux vous renseigner sur nos services, nos accompagnements et la façon de démarrer un projet.', 'assistant');
  button.addEventListener('click', () => panel.classList.toggle('open'));
  panel.querySelector('.bai-close').addEventListener('click', () => panel.classList.remove('open'));
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
  panel.querySelectorAll('.bai-chip').forEach((chip) => chip.addEventListener('click', () => { input.value = chip.textContent || ''; sendMessage(); }));
})();
