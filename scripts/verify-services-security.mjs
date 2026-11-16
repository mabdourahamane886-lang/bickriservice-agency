import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const services = JSON.parse(readFileSync('services-share.json', 'utf8'));
const page = readFileSync('services/index.html', 'utf8');
const worker = readFileSync('worker.js', 'utf8');
const migration = readFileSync('supabase/migrations/20261007_security_hardening.sql', 'utf8');

assert.equal(services.length, 37, 'Le catalogue doit contenir exactement 37 services.');
const slugs = services.map((service) => service.slug);
assert.equal(new Set(slugs).size, 37, 'Chaque service doit avoir un slug unique.');

const match = page.match(/const CATEGORY_BY_SLUG = Object\.freeze\((\{[\s\S]*?\})\);/);
assert.ok(match, 'La classification explicite des services est absente.');
const categories = JSON.parse(match[1]);
assert.deepEqual(Object.keys(categories).sort(), [...slugs].sort(), 'Chaque service, et uniquement chaque service, doit appartenir à un groupe.');

const expectedCounts = { web: 11, marketing: 9, creation: 12, conseil: 5 };
const actualCounts = Object.fromEntries(Object.keys(expectedCounts).map((group) => [
  group,
  Object.values(categories).filter((value) => value === group).length
]));
assert.deepEqual(actualCounts, expectedCounts, 'Les 37 services doivent être répartis dans les quatre groupes attendus.');

for (const group of Object.keys(expectedCounts)) {
  assert.ok(page.includes(`data-filter="${group}"`), `Filtre manquant pour le groupe ${group}.`);
}

for (const header of [
  /'X-Content-Type-Options'\s*:\s*'nosniff'/,
  /'Strict-Transport-Security'/,
  /'Content-Security-Policy'/,
  /'X-Frame-Options'/
]) assert.match(worker, header, 'Un en-tête de sécurité requis est absent.');

assert.match(worker, /allowedHosts\.includes\(data\.hostname\.toLowerCase\(\)\)/, 'La validation du nom d’hôte Turnstile doit rester active.');
assert.match(worker, /data\.action === expectedAction/, 'La validation de l’action Turnstile doit rester active.');
assert.match(worker, /checkAiRateLimit\(request\)/, 'La limitation de débit de Bickri IA doit rester active.');
assert.match(migration, /alter table public\.bickri_admin_users enable row level security/i, 'La RLS des administrateurs doit rester active.');
assert.match(migration, /revoke all on table public\.agency_settings from anon, authenticated/i, 'Les paramètres privés ne doivent pas être accessibles publiquement.');

console.log('OK — 37 services classés dans 4 groupes (11 / 9 / 12 / 5).');
console.log('OK — garde-fous de sécurité Worker, Turnstile, limitation de débit et RLS présents.');
