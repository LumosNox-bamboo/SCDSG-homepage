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
  assert.match(homepage, /<title>旅德华人医师学者协会（SCDSG）<\/title>/u);
  assert.match(homepage, /property="og:site_name" content="旅德华人医师学者协会"/u);
  assert.deepEqual(structuredData['@graph'][0].alternateName, ['SCDSG', 'Chinese Association of Medical Doctors and Scholars in Germany', 'scdsg-med.com']);
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

test('2023 Wenzhou forum uses the supplied collage and full group photo without cropping', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const detail = fs.readFileSync(path.join(root, 'activities', 'forum-2023', 'index.html'), 'utf8');
  const detailStyles = fs.readFileSync(path.join(root, 'activities', 'forum-2023', 'photo-layout.css'), 'utf8');

  for (const image of ['forum-2023-collage.png', 'forum-2023-group.png']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'images', 'activity-records', image)));
    assert.match(detail, new RegExp(image, 'u'));
  }
  assert.match(homepage, /activity-card[^>]*href="activities\/forum-2023\/index\.html">\s*<img src="assets\/images\/activity-records\/forum-2023-collage\.png"/u);
  assert.match(homepage, /gallery-item[^>]*href="activities\/forum-2023\/index\.html"[^>]*><figure><img class="group-photo" src="assets\/images\/activity-records\/forum-2023-group\.png"/u);
  assert.match(detailStyles, /\.detail-photo-stack img\s*\{[^}]*height: auto;[^}]*object-fit: contain;/u);
  assert.match(detail, /<link rel="stylesheet" href="photo-layout\.css\?v=[\d-]+">/u);
});

test('forum presents eight aligned research areas and the revised programme', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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
  assert.match(registration, /placeholder="Background \/ Method \/ Result \/ Conclusion"/u);
  assert.match(registration, /建议至少填写一个非机构邮箱/u);
  assert.doesNotMatch(forum, /abstract-template-link|下载英文摘要准备模板/u);
  assert.doesNotMatch(registration, /registration-template-link|下载英文摘要准备模板/u);
  assert.match(registration, /我同意协会为本次论坛的投稿评审及会务联络处理所提交的信息与材料/u);
  assert.match(forum, /投稿需要准备哪些材料/u);
  assert.match(forum, /投稿和评审的关键日期是什么/u);
  assert.match(homepage, /data-zh="免费注册参会" data-en="Free Registration"/u);
  assert.match(forum, /data-zh="免费注册参会" data-en="Free Registration"/u);
  assert.match(forum, /参加本次学术论坛是否需要缴费？/u);
  assert.match(forum, /本次青年学术论坛免收注册费/u);
  for (const range of ['13:00–13:15', '13:15–13:45', '13:45–15:10', '15:10–16:15', '16:15–16:45', '16:45–18:10', '18:10–18:20', '18:20–18:30']) {
    assert.match(programme, new RegExp(range, 'u'));
  }
  assert.match(forum, /€200/u);
  assert.doesNotMatch(forum, /5 HONOREES/u);
  assert.doesNotMatch(forum, /东二区|会议规模|Keynote Lecture II|KEYNOTE II|主旨报告 II/u);
  assert.equal((forum.match(/class="keynote-card(?:\s[^"]*)?"/gu) || []).length, 2);
  const keynoteSection = forum.match(/<div class="keynote-grid">([\s\S]*?)<\/div>\s*<div class="faculty-more/u)?.[1];
  const facultyCandidates = forum.match(/<div class="faculty-more[^>]*>([\s\S]*?)<\/div>\s*<\/section>/u)?.[1];
  assert.doesNotMatch(keynoteSection, /孔波|Bo Kong/u);
  assert.match(facultyCandidates, /孔波教授 · 海德堡大学医院/u);
  assert.match(facultyCandidates, /Prof Bo Kong · Heidelberg University Hospital/u);
  assert.doesNotMatch(facultyCandidates, /孔波 医学博士|PD Dr Dr med Bo Kong/u);
  assert.equal((facultyCandidates.match(/data-zh="拟邀嘉宾" data-en="PROPOSED FACULTY"/gu) || []).length, 3);
  assert.match(facultyCandidates, /研究方向：胰腺疾病外科及转化研究/u);
  assert.doesNotMatch(facultyCandidates, /patient stratification|查看 UKHD 官方资料/u);
  const stylesheet = fs.readFileSync(path.join(root, 'styles-v2.css'), 'utf8');
  const facultyLayout = fs.readFileSync(path.join(root, 'forum-2026', 'faculty-layout.css'), 'utf8');
  assert.match(stylesheet, /\.faculty-more \{[^}]*grid-template-columns: repeat\(3, 1fr\)/u);
  assert.match(facultyLayout, /\.faculty-more > div \{[^}]*display: grid;[^}]*grid-template-rows: auto 1fr auto;/u);
  assert.match(forum, /<link rel="stylesheet" href="faculty-layout\.css\?v=[\d-]+">/u);
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

test('submission and admin interfaces expose the revised email workflow', () => {
  const registrationScript = fs.readFileSync(path.join(root, 'forum-2026', 'register.js'), 'utf8');
  const admin = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
  const adminScript = fs.readFileSync(path.join(root, 'admin', 'admin.js'), 'utf8');

  assert.doesNotMatch(registrationScript, /正在尝试发送确认邮件/u);
  assert.match(admin, /value="none-sent">两个邮箱均未成功/u);
  for (const decision of ['oral', 'poster', 'not_selected']) {
    assert.match(admin, new RegExp(`value="${decision}"`, 'u'));
  }
  assert.match(adminScript, /\/admin\/api\/notify-results/u);
  assert.match(adminScript, /window\.confirm/u);
});
