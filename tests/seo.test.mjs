import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('sitemap includes every public activity detail page', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const activitySlugs = fs.readdirSync(path.join(root, 'activities'))
    .filter((slug) => fs.existsSync(path.join(root, 'activities', slug, 'index.html')));

  assert.equal(activitySlugs.length, 18);
  for (const slug of activitySlugs) {
    assert.match(sitemap, new RegExp(`<loc>https://scdsg-med\\.com/activities/${slug}/</loc>`));
  }
});

test('homepage exposes valid WebSite and Organization structured data', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const json = homepage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];

  assert.ok(json);
  const structuredData = JSON.parse(json);
  const types = structuredData['@graph'].map((entry) => entry['@type']);
  assert.deepEqual(types, ['WebSite', 'Organization']);
});
