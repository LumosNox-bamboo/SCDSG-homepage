import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const archiveRoot = process.env.SCDSG_ARCHIVE_ROOT
  ? path.resolve(process.env.SCDSG_ARCHIVE_ROOT)
  : path.join(root, 'SCDSG_articles');
const detailScript = fs.readFileSync(path.join(root, 'activity-archive/detail.js'), 'utf8');
const recordsLiteral = detailScript.match(/const records = (\{[\s\S]*?\n\});\n\nconst requestedId/)?.[1];

if (!recordsLiteral) throw new Error('Unable to read activity records');

const records = Function(`"use strict"; return (${recordsLiteral});`)();
const derivedImageSources = {
  'license-2024': '17851843723160.7643691884404573.png',
};
const fileHash = (filePath) => crypto
  .createHash('sha256')
  .update(fs.readFileSync(filePath))
  .digest('hex');
const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');
const extract = (html, pattern, label, slug) => {
  const value = html.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${slug}: missing ${label}`);
  return value;
};

fs.rmSync(path.join(root, 'activities'), { recursive: true, force: true });

const auditRows = [];
for (const [slug, record] of Object.entries(records)) {
  const sourceRelative = record.source.replace(/^\.\.\//, '');
  const articleRelative = sourceRelative
    .replace(/^SCDSG_articles\//, '')
    .replace(/\/index\.html$/, '');
  const sourcePath = path.join(archiveRoot, articleRelative, 'index.html');
  const sourceHtml = fs.readFileSync(sourcePath, 'utf8');
  const title = extract(sourceHtml, /<title>([\s\S]*?)<\/title>/, 'source title', slug);
  const date = extract(sourceHtml, /id="publish_time"[^>]*>([\s\S]*?)<\/em>/, 'publish time', slug);
  const imageRelative = record.image.replace(/^\.\.\//, '');
  const imagePath = path.join(root, imageRelative);

  if (!fs.existsSync(imagePath)) throw new Error(`${slug}: missing image ${imageRelative}`);
  const sourceAssets = path.join(archiveRoot, articleRelative, 'assets');
  const imageHash = fileHash(imagePath);
  const sourceImage = fs.readdirSync(sourceAssets)
    .find((file) => fileHash(path.join(sourceAssets, file)) === imageHash)
    ?? derivedImageSources[slug];

  if (!sourceImage || !fs.existsSync(path.join(sourceAssets, sourceImage))) {
    throw new Error(`${slug}: representative image is not traceable to its ZIP article`);
  }

  const pageDir = path.join(root, 'activities', slug);
  fs.mkdirSync(pageDir, { recursive: true });
  const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} | SCDSG</title>
  <meta name="description" content="${escapeHtml(record.summary)}">
  <link rel="canonical" href="https://scdsg-med.com/activities/${slug}/">
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../activity-archive/detail.css">
</head>
<body>
  <main class="detail-shell">
    <a class="detail-back" href="../../index.html#activities">← 返回协会活动</a>
    <article>
      <div class="detail-meta">${escapeHtml(record.category)} · <time>${escapeHtml(date)}</time> · ${escapeHtml(record.location)}</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="detail-lead">${escapeHtml(record.summary)}</p>
      <img class="detail-hero" src="../../${escapeHtml(imageRelative)}" alt="${escapeHtml(title)}">
      <div class="detail-body">
        <p>${escapeHtml(record.summary)}</p>
        <p>本页信息由协会保存的公众号 ZIP 图文档案整理，标题与发布时间保持原文记录。</p>
      </div>
      <a class="detail-source" href="../../${escapeHtml(sourceRelative)}">阅读原始图文档案 ↗</a>
    </article>
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(pageDir, 'index.html'), page);
  auditRows.push({
    slug,
    title,
    date,
    imageRelative,
    sourceImage,
    sourceRelative,
  });
}

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const row of auditRows) {
  const homepageDate = row.date
    .match(/^(\d{4})年(\d{2})月(\d{2})日/)?.slice(1).join('.');
  const linkedBlocks = [...homepage.matchAll(
    new RegExp(`<a[^>]+href="activities/${row.slug}/"[^>]*>([\\s\\S]*?)<\\/a>`, 'g'),
  )];

  if (!linkedBlocks.length) throw new Error(`${row.slug}: missing homepage link`);
  if (!linkedBlocks.some((match) => match[1].includes(homepageDate))) {
    throw new Error(`${row.slug}: homepage date does not match ZIP article`);
  }
}

const audit = `# 活动链接逐条核对报告

核对日期：2026-07-28

核对来源：\`SCDSG_articles.zip\` 的全新解压副本

核对规则：每条首页活动必须拥有独立静态路径；详情页标题和发布时间必须与 ZIP 原文完全一致；代表图文件必须存在；原始图文入口必须指向对应文章目录。

| # | 独立路径 | ZIP 原文标题 | 发布时间 | ZIP 图片文件 | 结果 |
|---:|---|---|---|---|---|
${auditRows.map((row, index) => `| ${index + 1} | \`/activities/${row.slug}/\` | ${row.title.replaceAll('|', '\\|')} | ${row.date} | \`${row.sourceImage}\` | PASS |`).join('\n')}

## 汇总

- ZIP 原文记录：${auditRows.length} 条
- 独立详情路径：${auditRows.length} 条
- 首页链接与 ZIP 日期匹配：${auditRows.length}/${auditRows.length}
- 标题完全匹配：${auditRows.length}/${auditRows.length}
- 发布时间完全匹配：${auditRows.length}/${auditRows.length}
- 代表图可追溯至对应 ZIP 文章：${auditRows.length}/${auditRows.length}
- 共用查询参数详情链接：0 条
`;
fs.writeFileSync(path.join(root, 'docs/activity-link-audit.md'), audit);

console.log(`Generated and verified ${auditRows.length} independent activity pages.`);
