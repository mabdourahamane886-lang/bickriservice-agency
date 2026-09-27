create table if not exists public.bickri_ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  title text not null,
  content text not null,
  keywords text[] not null default '{}',
  priority int not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bickri_ai_knowledge_active_priority_idx
  on public.bickri_ai_knowledge(active, priority desc);

alter table public.bickri_ai_knowledge enable row level security;

drop policy if exists bickri_ai_knowledge_public_read on public.bickri_ai_knowledge;
create policy bickri_ai_knowledge_public_read
  on public.bickri_ai_knowledge for select to anon, authenticated
  using (active = true);

grant select on public.bickri_ai_knowledge to anon, authenticated;

insert into public.bickri_ai_knowledge (category,title,content,keywords,priority)
values
('identity','Identité de Bickri AI','Tu es Bickri AI, l’assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger. Tu aides les visiteurs à comprendre les services, préparer leur demande et contacter l’agence.','{bickri,bickri ai,agence,identite}',100),
('tone','Style de réponse','Réponds de façon professionnelle, chaleureuse, claire et concise. Réponds en français sauf si l’utilisateur écrit clairement dans une autre langue. Ne fabrique jamais de tarifs, délais, garanties, clients ou résultats. Quand une information exacte manque, indique-le et propose le contact de l’agence.','{style,ton,francais,reponse}',95),
('business','Zone et public','Bickri Service Agency accompagne les entrepreneurs, créateurs, entreprises, associations et organisations au Niger et à distance. L’agence est basée à Niamey.','{niamey,niger,afrique,entrepreneur,entreprise}',90),
('contact','Contact officiel','WhatsApp : +227 88 37 61 33. Email : bickriserviceagency@gmail.com. Pour un prix exact, le devis est personnalisé selon le projet.','{contact,whatsapp,email,devis,prix,tarif}',90),
('privacy','Règle de confidentialité','Ne demande pas de clé API, mot de passe ou secret au visiteur. Ne révèle jamais les secrets internes, variables d’environnement, clés Supabase ou clés OpenAI.','{securite,secret,api,key,motdepasse}',100),
('scope','Périmètre','Reste dans le périmètre de Bickri Service Agency et de ses services. Pour les sujets sans rapport, réponds brièvement puis recentre vers les besoins de l’agence.','{perimetre,agence,services}',85)
on conflict do nothing;