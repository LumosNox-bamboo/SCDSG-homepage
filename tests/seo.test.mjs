import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('sitemap includes every public activity detail page', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const activitySlugs = fs.readdirSync(path.join(root, 'activities'))
    .filter((slug) => fs.existsSync(path.join(root, 'activities', slug, 'index.html')));

  assert.equal(activitySlugs.length, 24);
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

  assert.equal(cards.length, 24);
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

  assert.equal((homepage.match(/data-category="academic"/gu) || []).length, 10);
  assert.equal((homepage.match(/data-category="career"/gu) || []).length, 4);
  assert.equal((homepage.match(/data-category="community"/gu) || []).length, 10);
});

test('homepage history is chronological and the English script is cache-busted', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const timeline = homepage.match(/<div class="timeline"[^>]*>([\s\S]*?)<\/div>/u)?.[1];
  const years = [...timeline.matchAll(/<time[^>]*>([^<]+)<\/time>/gu)].map((match) => match[1]);

  assert.deepEqual(years, ['2012', '2014—15', '2016', '2017—19', '2020—21', '2022—23', '2024—至今']);
  assert.match(homepage, /<script src="script\.js\?v=[\d-]+" defer><\/script>/u);
});

test('forum presents eight aligned research areas and the revised programme', () => {
  const forum = fs.readFileSync(path.join(root, 'forum-2026', 'index.html'), 'utf8');
  const registration = fs.readFileSync(path.join(root, 'forum-2026', 'register', 'index.html'), 'utf8');
  const trackSection = forum.match(/<div class="science-track">([\s\S]*?)<\/div>/u)?.[1];
  const programme = forum.match(/<div class="programme-stream">([\s\S]*?)<\/div>\s*<\/div>/u)?.[1];

  assert.equal((trackSection.match(/<article>/gu) || []).length, 8);
  assert.equal((programme.match(/<article/gu) || []).length, 8);
  for (const area of ['基础医学', '临床医学', '转化医学', '生命科学', '药学与化学', '医学人工智能', '生物医药交叉学科']) {
    assert.match(trackSection, new RegExp(area, 'u'));
    assert.match(registration, new RegExp(area, 'u'));
  }
  for (const stage of ['本科生', '硕士研究生']) assert.match(registration, new RegExp(stage, 'u'));
  assert.match(registration, /Background、Method、Result、Conclusion/u);
  for (const range of ['13:00–13:15', '13:15–13:45', '13:45–15:10', '15:10–16:15', '16:15–16:45', '16:45–18:10', '18:10–18:20', '18:20–18:30']) {
    assert.match(programme, new RegExp(range, 'u'));
  }
  assert.match(forum, /€200/u);
  assert.doesNotMatch(forum, /5 HONOREES/u);
  assert.doesNotMatch(forum, /东二区|会议规模|Keynote Lecture II|KEYNOTE II|主旨报告 II/u);
  assert.match(forum, /2012 年成立的“海德堡龙一族”/u);
  assert.equal((forum.match(/class="forum-keyfacts"[\s\S]*?<\/section>/u)?.[0].match(/<article>/gu) || []).length, 3);
  assert.match(forum, /<script src="\.\.\/script\.js\?v=[\d-]+" defer><\/script>/u);
});

test('contact channels and local icons are present across the public site', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const forum = fs.readFileSync(path.join(root, 'forum-2026', 'index.html'), 'utf8');
  const activityFiles = fs.readdirSync(path.join(root, 'activities'))
    .map((slug) => path.join(root, 'activities', slug, 'index.html'))
    .filter((file) => fs.existsSync(file));

  for (const social of ['wechat-qr.jpg', 'xiaohongshu-qr.jpg', 'douyin-qr.jpg', 'instagram-qr.png']) {
    assert.match(homepage, new RegExp(social, 'u'));
    assert.match(forum, new RegExp(social, 'u'));
    assert.ok(fs.existsSync(path.join(root, 'assets', 'images', 'social', social)));
  }
  assert.match(homepage, /linkedin\.com\/company\/society-of-chinese-doctors-and-scholars-in-germany-scdsg/u);
  assert.match(forum, /linkedin\.com\/company\/society-of-chinese-doctors-and-scholars-in-germany-scdsg/u);

  for (const file of [path.join(root, 'index.html'), path.join(root, 'forum-2026', 'index.html'), path.join(root, 'forum-2026', 'register', 'index.html'), ...activityFiles]) {
    assert.match(fs.readFileSync(file, 'utf8'), /rel="icon"/u, `${file} is missing its favicon`);
  }
  for (const icon of ['logo.png', 'favicon-32.png', 'apple-touch-icon.png']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'images', icon)));
  }
});
