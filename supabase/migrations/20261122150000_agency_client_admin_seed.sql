-- Autoriser le compte administrateur déjà configuré dans le portail partenaire.
-- Le rôle modifiable dans profiles n'est PAS utilisé comme autorisation persistante :
-- l'accès aux nouvelles API requiert un enregistrement dans bickri_admin_users.
-- La correspondance doit inclure l'adresse exacte du compte administrateur existant.
insert into public.bickri_admin_users (user_id)
select u.id from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = 'mabdourahamane886@gmail.com' and p.role = 'admin'
on conflict (user_id) do nothing;
