import { readFileSync } from 'node:fs';

const fail = (message) => {
  console.error(`[site-check] FAIL: ${message}`);
  process.exitCode = 1;
};
const services = JSON.parse(readFileSync(new URL('../services-share.json', import.meta.url), 'utf8'));
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');

if (!Array.isArray(services) || services.length !== 37) {
  fail(`Expected 37 service entries; found ${Array.isArray(services) ? services.length : 'non-array'}.`);
} else {
  const slugs = services.map((item) => item?.slug);
  const codes = services.map((item) => item?.code);
  if (new Set(slugs).size !== slugs.length) fail('Duplicate service slug found.');
  if (new Set(codes).size !== codes.length) fail('Duplicate service code found.');

  for (const [index, item] of services.entries()) {
    for (const field of ['name', 'slug', 'desc', 'img', 'what', 'who', 'get', 'why', 'code']) {
      if (typeof item?.[field] !== 'string' || !item[field].trim()) {
        fail(`Service #${index + 1} is missing required field "${field}".`);
      }
    }
    if (item?.img && !/^https:\/\//i.test(item.img)) {
      fail(`Service #${index + 1} image must use HTTPS.`);
    }
    if (item?.slug && !sitemap.includes(`https://bickriservice-agency.org/services/${item.slug}/`)) {
      fail(`Sitemap is missing service URL for "${item.slug}".`);
    }
  }

  for (const field of ['what', 'get', 'why']) {
    const values = services.map((item) => item[field]?.trim().toLowerCase());
    if (new Set(values).size !== values.length) {
      fail(`Repeated generic copy found in service field "${field}".`);
    }
  }
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) fail('Sitemap XML root is malformed.');
if (new Set(urls).size !== urls.length) fail('Duplicate sitemap URL found.');

if (process.exitCode) process.exit(process.exitCode);
console.log(`[site-check] OK: ${services.length} services, unique slugs/codes/copy, all service URLs in sitemap (${urls.length} unique URLs).`);
