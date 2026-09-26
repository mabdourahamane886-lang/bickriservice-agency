// Dynamic social preview pages for Bickri Service Agency.
const services = [
  {
    "name": "Création de sites web",
    "slug": "creation-sites-web",
    "desc": "Sites, plateformes et expériences responsive.",
    "img": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",
    "what": "Conception de sites vitrine, plateformes et expériences web modernes.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une interface responsive, structurée et orientée conversion.",
    "why": "Pour disposer d’une présence web professionnelle et évolutive.",
    "code": "BSAF4EMA8V"
  },
  {
    "name": "E-commerce",
    "slug": "e-commerce",
    "desc": "Boutiques et parcours d’achat adaptés.",
    "img": "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
    "what": "Boutique en ligne, catalogue, parcours d’achat et présentation des offres.",
    "who": "Commerçants, marques et entrepreneurs.",
    "get": "Une expérience de vente digitale claire et adaptée.",
    "why": "Pour transformer votre catalogue en parcours d’achat simple.",
    "code": "BSATXERV6J"
  },
  {
    "name": "Réseaux sociaux",
    "slug": "reseaux-sociaux",
    "desc": "Stratégie, contenu et développement d’audience.",
    "img": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85",
    "what": "Stratégie éditoriale, optimisation des profils et contenus.",
    "who": "Créateurs, marques, entrepreneurs et organisations.",
    "get": "Une stratégie de présence et de contenu structurée.",
    "why": "Pour mieux organiser votre communication digitale.",
    "code": "BSAA574TMY"
  },
  {
    "name": "Intelligence artificielle",
    "slug": "intelligence-artificielle",
    "desc": "IA, automatisation et productivité.",
    "img": "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=85",
    "what": "Intégration d’outils IA, automatisation et workflows digitaux.",
    "who": "Entrepreneurs, équipes et organisations.",
    "get": "Des processus plus rapides et une meilleure organisation.",
    "why": "Pour réduire les tâches répétitives et gagner en productivité.",
    "code": "BSANBSJ9RZ"
  },
  {
    "name": "Branding & design",
    "slug": "branding-design",
    "desc": "Logo, identité visuelle et supports de marque.",
    "img": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85",
    "what": "Identité visuelle, logo et supports de communication.",
    "who": "Marques, entreprises, créateurs et projets.",
    "get": "Un univers visuel cohérent et professionnel.",
    "why": "Pour renforcer votre image et votre crédibilité.",
    "code": "BSAVB3Y83M"
  },
  {
    "name": "Publicité digitale",
    "slug": "publicite-digitale",
    "desc": "Campagnes et acquisition ciblée.",
    "img": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85",
    "what": "Campagnes digitales, messages publicitaires et optimisation.",
    "who": "Entreprises, marques et projets en croissance.",
    "get": "Une campagne structurée autour d’objectifs définis.",
    "why": "Pour mieux organiser vos actions d’acquisition.",
    "code": "BSA4SK5C8L"
  },
  {
    "name": "Formation & coaching",
    "slug": "formation-coaching",
    "desc": "Accompagnement pratique et personnalisé.",
    "img": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85",
    "what": "Formation pratique en digital, IA, marketing et stratégie.",
    "who": "Entrepreneurs, créateurs et professionnels.",
    "get": "Un accompagnement adapté à votre niveau et à votre objectif.",
    "why": "Pour développer vos compétences et gagner en autonomie.",
    "code": "BSAXRVRKHF"
  },
  {
    "name": "SEO & Référencement Google",
    "slug": "seo-referencement",
    "desc": "Référencement naturel, optimisation technique et visibilité sur Google.",
    "img": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85",
    "what": "Référencement naturel, optimisation technique et visibilité sur Google.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAV7N62K8"
  },
  {
    "name": "Création de contenu",
    "slug": "creation-contenu",
    "desc": "Posts, articles, carrousels et contenus digitaux adaptés à votre marque.",
    "img": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=85",
    "what": "Posts, articles, carrousels et contenus digitaux adaptés à votre marque.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA6PLT4KZ"
  },
  {
    "name": "Montage vidéo",
    "slug": "montage-video",
    "desc": "Reels, TikTok, Shorts et vidéos publicitaires professionnelles.",
    "img": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85",
    "what": "Reels, TikTok, Shorts et vidéos publicitaires professionnelles.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAARTPY4P"
  },
  {
    "name": "Applications mobiles",
    "slug": "applications-mobiles",
    "desc": "Conception d'applications mobiles Android et iOS.",
    "img": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85",
    "what": "Conception d'applications mobiles Android et iOS.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAMUNDMXE"
  },
  {
    "name": "Chatbots & Assistants IA",
    "slug": "chatbots-assistants-ia",
    "desc": "Assistants intelligents pour sites web, support client et automatisation.",
    "img": "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=85",
    "what": "Assistants intelligents pour sites web, support client et automatisation.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSATNRFWSV"
  },
  {
    "name": "Automatisation digitale",
    "slug": "automatisation-digitale",
    "desc": "Automatisation des tâches répétitives et des workflows d'entreprise.",
    "img": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
    "what": "Automatisation des tâches répétitives et des workflows d'entreprise.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAPRUQ26J"
  },
  {
    "name": "Email marketing",
    "slug": "email-marketing",
    "desc": "Newsletters, campagnes email et scénarios d'automatisation.",
    "img": "https://images.unsplash.com/photo-1497366754035-5c3f8b3f6f1f?auto=format&fit=crop&w=1200&q=85",
    "what": "Newsletters, campagnes email et scénarios d'automatisation.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSATYDYYJ7"
  },
  {
    "name": "Google Business Profile",
    "slug": "google-business-profile",
    "desc": "Création et optimisation de votre présence locale sur Google.",
    "img": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
    "what": "Création et optimisation de votre présence locale sur Google.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAHJU2UBY"
  },
  {
    "name": "Réputation en ligne",
    "slug": "reputation-en-ligne",
    "desc": "Gestion et amélioration de votre présence et image numérique.",
    "img": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85",
    "what": "Gestion et amélioration de votre présence et image numérique.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAEMKFCEH"
  },
  {
    "name": "Community management",
    "slug": "community-management",
    "desc": "Gestion professionnelle de vos pages et communautés sociales.",
    "img": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
    "what": "Gestion professionnelle de vos pages et communautés sociales.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAFC5PDVK"
  },
  {
    "name": "Influence & partenariats",
    "slug": "influence-partenariats",
    "desc": "Campagnes avec créateurs, influenceurs et partenaires digitaux.",
    "img": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85",
    "what": "Campagnes avec créateurs, influenceurs et partenaires digitaux.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA462ZFXS"
  },
  {
    "name": "Produits numériques",
    "slug": "produits-numeriques",
    "desc": "Création d'e-books, guides, templates, formations et ressources numériques.",
    "img": "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&q=85",
    "what": "Création d'e-books, guides, templates, formations et ressources numériques.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSACA4FVND"
  },
  {
    "name": "Landing pages",
    "slug": "landing-pages",
    "desc": "Pages de destination conçues pour présenter une offre et générer des prospects.",
    "img": "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85",
    "what": "Pages de destination conçues pour présenter une offre et générer des prospects.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAE6UQDHY"
  },
  {
    "name": "Audit digital",
    "slug": "audit-digital",
    "desc": "Analyse de votre présence digitale avec recommandations prioritaires.",
    "img": "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85",
    "what": "Analyse de votre présence digitale avec recommandations prioritaires.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA8P74W6Y"
  },
  {
    "name": "Cybersécurité de base",
    "slug": "cybersecurite",
    "desc": "Bonnes pratiques et sécurisation de base des sites et comptes numériques.",
    "img": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
    "what": "Bonnes pratiques et sécurisation de base des sites et comptes numériques.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAYNRNS8U"
  },
  {
    "name": "Maintenance web",
    "slug": "maintenance-web",
    "desc": "Corrections, mises à jour, sauvegardes et suivi de sites web.",
    "img": "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=85",
    "what": "Corrections, mises à jour, sauvegardes et suivi de sites web.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA4YSW6D4"
  },
  {
    "name": "Hébergement & domaines",
    "slug": "hebergement-domaines",
    "desc": "Accompagnement pour domaines, DNS, hébergement et déploiement.",
    "img": "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85",
    "what": "Accompagnement pour domaines, DNS, hébergement et déploiement.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAVPQA266"
  },
  {
    "name": "Analytics & reporting",
    "slug": "analytics-reporting",
    "desc": "Installation, suivi des statistiques et rapports de performance.",
    "img": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85",
    "what": "Installation, suivi des statistiques et rapports de performance.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAGBZJBS4"
  },
  {
    "name": "Marketing WhatsApp",
    "slug": "marketing-whatsapp",
    "desc": "Catalogues, campagnes et stratégies d'acquisition via WhatsApp.",
    "img": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85",
    "what": "Catalogues, campagnes et stratégies d'acquisition via WhatsApp.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAC95TRJW"
  },
  {
    "name": "Création de podcasts",
    "slug": "creation-podcasts",
    "desc": "Conception, habillage et préparation de podcasts pour le digital.",
    "img": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85",
    "what": "Conception, habillage et préparation de podcasts pour le digital.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAKAQVRY9"
  },
  {
    "name": "Production photo digitale",
    "slug": "production-photo",
    "desc": "Visuels professionnels pour marques, produits et réseaux sociaux.",
    "img": "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=85",
    "what": "Visuels professionnels pour marques, produits et réseaux sociaux.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAEVJ5PSQ"
  },
  {
    "name": "Motion design",
    "slug": "motion-design",
    "desc": "Animations graphiques et contenus visuels dynamiques.",
    "img": "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=85",
    "what": "Animations graphiques et contenus visuels dynamiques.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSACFQX267"
  },
  {
    "name": "Design UI/UX",
    "slug": "design-ui-ux",
    "desc": "Conception d'interfaces modernes, intuitives et centrées utilisateur.",
    "img": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=85",
    "what": "Conception d'interfaces modernes, intuitives et centrées utilisateur.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA4VJ6R44"
  },
  {
    "name": "Prototypage digital",
    "slug": "prototypage-digital",
    "desc": "Maquettes interactives pour valider une application ou un site avant développement.",
    "img": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85",
    "what": "Maquettes interactives pour valider une application ou un site avant développement.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA53X5LYM"
  },
  {
    "name": "Conseil en transformation digitale",
    "slug": "transformation-digitale",
    "desc": "Accompagnement des entreprises dans leur transition numérique.",
    "img": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=85",
    "what": "Accompagnement des entreprises dans leur transition numérique.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA9MVSL6M"
  },
  {
    "name": "CRM & gestion clients",
    "slug": "crm-gestion-clients",
    "desc": "Mise en place et organisation d'outils pour suivre prospects et clients.",
    "img": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85",
    "what": "Mise en place et organisation d'outils pour suivre prospects et clients.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAQPFMJGZ"
  },
  {
    "name": "Solutions de réservation",
    "slug": "solutions-reservation",
    "desc": "Systèmes de réservation en ligne pour services, événements et établissements.",
    "img": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
    "what": "Systèmes de réservation en ligne pour services, événements et établissements.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSASPD4W5V"
  },
  {
    "name": "Billetterie en ligne",
    "slug": "billetterie-en-ligne",
    "desc": "Création de parcours de vente de billets et inscriptions en ligne.",
    "img": "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=85",
    "what": "Création de parcours de vente de billets et inscriptions en ligne.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAMUT39D6"
  },
  {
    "name": "Création de plateformes web",
    "slug": "plateformes-web",
    "desc": "Développement de plateformes digitales adaptées aux besoins métier.",
    "img": "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1200&q=85",
    "what": "Développement de plateformes digitales adaptées aux besoins métier.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSAUP347JP"
  },
  {
    "name": "Intégration d'API",
    "slug": "integration-api",
    "desc": "Connexion de services, paiements et outils externes à vos applications.",
    "img": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
    "what": "Connexion de services, paiements et outils externes à vos applications.",
    "who": "Entrepreneurs, entreprises, créateurs et organisations.",
    "get": "Une solution digitale structurée, professionnelle et adaptée à votre besoin.",
    "why": "Pour développer votre présence et vos performances numériques.",
    "code": "BSA2E8UJGF"
  }
];

const SITE='https://bickriservice-agency.vercel.app';
function escapeHtml(value){
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function absoluteImage(src){
  if(/^https?:\/\//i.test(src)) return src;
  return SITE+(String(src).charAt(0)==='/'?src:'/'+src);
}
module.exports=function(req,res){
  const code=String(req.query&&req.query.code||'').toUpperCase();
  const service=services.find(function(item){return item.code===code;});
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  if(!service){
    res.statusCode=404;
    return res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Service introuvable</title></head><body><h1>Référence de service introuvable</h1><p><a href="'+SITE+'">Retour à Bickri Service Agency</a></p></body></html>');
  }
  const publicUrl=SITE+'/s/'+encodeURIComponent(service.code);
  const appUrl=SITE+'/?service='+encodeURIComponent(service.code);
  const image=absoluteImage(service.img);
  const title=service.name+' — Bickri Service Agency';
  const description=service.desc+' Service disponible à Niamey, Niger. Référence : '+service.code;
  const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escapeHtml(title)+'</title><meta name="description" content="'+escapeHtml(description)+'"><link rel="canonical" href="'+escapeHtml(publicUrl)+'">'+
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Bickri Service Agency"><meta property="og:url" content="'+escapeHtml(publicUrl)+'"><meta property="og:title" content="'+escapeHtml(title)+'"><meta property="og:description" content="'+escapeHtml(description)+'"><meta property="og:image" content="'+escapeHtml(image)+'"><meta property="og:image:alt" content="'+escapeHtml(service.name)+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+escapeHtml(title)+'"><meta name="twitter:description" content="'+escapeHtml(description)+'"><meta name="twitter:image" content="'+escapeHtml(image)+'">'+
    '</head><body style="margin:0;background:#08101f;color:#fff;font-family:Arial,sans-serif"><main style="max-width:900px;margin:auto;padding:24px"><img src="'+escapeHtml(image)+'" alt="'+escapeHtml(service.name)+'" style="width:100%;max-height:520px;object-fit:cover;border-radius:20px"><p style="color:#d9a441;font-weight:700;letter-spacing:.08em">BICKRI SERVICE AGENCY · NIAMEY · NIGER</p><h1>'+escapeHtml(service.name)+'</h1><p style="font-size:18px;line-height:1.6">'+escapeHtml(service.desc)+'</p><p><strong>Référence :</strong> '+escapeHtml(service.code)+'</p><p><a href="'+escapeHtml(appUrl)+'" style="display:inline-block;padding:14px 20px;background:#d9a441;color:#08101f;text-decoration:none;border-radius:10px;font-weight:700">Ouvrir la fiche du service</a></p></main><script>window.location.replace('+JSON.stringify(appUrl)+')</script></body></html>';
  return res.end(html);
};
