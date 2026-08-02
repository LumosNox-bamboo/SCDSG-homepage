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

test('homepage activity cards are complete, matched and newest first', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const cards = [...homepage.matchAll(
    /class="activity-card[^"]*"[^>]*href="activities\/([^/]+)\/index\.html">\s*<img[^>]*src="([^"]+)"[^>]*>\s*<div class="card-copy"><span>(\d{4}\.\d{2}\.\d{2})/gu
  )].map((match) => ({ slug: match[1], image: match[2], date: match[3] }));

  const activitySlugs = fs.readdirSync(path.join(root, 'activities'))
    .filter((slug) => fs.existsSync(path.join(root, 'activities', slug, 'index.html')))
    .sort();

  assert.equal(cards.length, 18);
  assert.deepEqual(cards.map((card) => card.slug).sort(), activitySlugs);
  assert.deepEqual(
    cards.map((card) => card.date),
    cards.map((card) => card.date).toSorted().reverse()
  );

  for (const card of cards) {
    assert.ok(fs.existsSync(path.join(root, card.image)), `${card.slug} is missing its card image`);
    const detail = fs.readFileSync(path.join(root, 'activities', card.slug, 'index.html'), 'utf8');
    const detailDate = detail.match(/<time>(\d{4})年(\d{2})月(\d{2})日/u)?.slice(1).join('.');
    const detailImage = detail.match(/class="detail-hero" src="\.\.\/\.\.\/([^"]+)"/u)?.[1];
    assert.equal(card.date, detailDate, `${card.slug} has a mismatched date`);
    assert.equal(card.image, detailImage, `${card.slug} has a mismatched image`);
  }

  const stylesheet = fs.readFileSync(path.join(root, 'styles-v2.css'), 'utf8');
  assert.match(stylesheet, /\.activity-card img \{[^}]*object-fit: contain;/u);
});
