import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const catalog = JSON.parse(await read("../services-share.json"));
const vercel = JSON.parse(await read("../vercel.json"));
const api = await read("../api/service.js");
const schema = await read("../supabase/schema.sql");
const profileHardening = await read("../supabase/migrations/20261012170000_harden_profile_role_and_public_profile_grants.sql");

test("service catalog keeps all 37 entries", () => {
  assert.equal(catalog.length, 37);
});

test("service catalog has unique, non-empty slugs and share codes", () => {
  const slugs = catalog.map((item) => item.slug);
  const codes = catalog.map((item) => item.code);
  assert.ok(slugs.every((value) => typeof value === "string" && value.trim()));
  assert.ok(codes.every((value) => typeof value === "string" && /^[A-Z0-9]{8,16}$/.test(value)));
  assert.equal(new Set(slugs).size, slugs.length, "duplicate service slug");
  assert.equal(new Set(codes).size, codes.length, "duplicate service share code");
});

test("catalog images use HTTPS", () => {
  assert.ok(catalog.every((item) => typeof item.img === "string" && item.img.startsWith("https://")));
});

test("Vercel security headers are present", () => {
  const headers = vercel.headers.find((entry) => entry.source === "/(.*)")?.headers ?? [];
  const values = new Map(headers.map(({ key, value }) => [key.toLowerCase(), value]));
  for (const key of [
    "x-content-type-options",
    "referrer-policy",
    "x-frame-options",
    "strict-transport-security",
    "content-security-policy",
    "permissions-policy",
  ]) assert.ok(values.has(key), `missing header: ${key}`);
  assert.match(values.get("content-security-policy"), /object-src 'none'/);
  assert.match(values.get("content-security-policy"), /frame-ancestors/);
});

test("short-link renderer escapes untrusted HTML text and attributes", () => {
  assert.match(api, /function escapeHtml\(value\)/);
  assert.match(api, /replace\(\/\[&<>/);
  assert.match(api, /escapeHtml\(title\)/);
  assert.match(api, /escapeHtml\(description\)/);
  assert.match(api, /escapeHtml\(image\)/);
});

test("core customer-facing tables have RLS enabled", () => {
  for (const table of [
    "agency_settings",
    "agency_services",
    "agency_projects",
    "agency_faqs",
    "agency_testimonials",
    "agency_leads",
    "bickri_ai_knowledge",
    "bickri_ai_memory",
    "bickri_ai_conversations",
  ]) {
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security;?`, "i"), `RLS missing for ${table}`);
  }
});

test("service share links route through the existing API", () => {
  assert.ok(vercel.rewrites.some((entry) =>
    entry.source === "/s/:code" && entry.destination === "/api/service?code=:code"
  ));
  assert.match(api, /statusCode = 400/);
  assert.match(api, /statusCode = 404/);
});

test("profile hardening migration removes self-assigned role writes", () => {
  assert.match(profileHardening, /revoke insert, update, truncate on table public\\.profiles from authenticated/i);
  assert.match(profileHardening, /revoke update \\(id, email, full_name, avatar_url, provider, created_at, updated_at, role, account_code, phone, learning_path\\)/i);
  assert.match(profileHardening, /grant update \\(full_name, avatar_url, phone, learning_path\\) on table public\\.profiles to authenticated/i);
  assert.doesNotMatch(profileHardening, /grant update \\([^)]*\\brole\\b[^)]*\\) on table public\\.profiles to authenticated/i);
});
