# SCDSG Cloudflare Pages 自定义域名迁移方案

状态：**设计完成，尚未购买、绑定、发布或修改 DNS**

占位符：`SELECTED_DOMAIN`  
唯一正式 canonical：`https://SELECTED_DOMAIN`

## 当前项目概况

| 项目 | 当前结果 | 证据来源 |
|---|---|---|
| 源代码仓库 | `LumosNox-bamboo/SCDSG-homepage` | Git remote |
| 当前本地分支 | `agent/forum-2026-congress-redesign` | Git |
| 当前本地版本 | `2c927c6` | Git HEAD |
| Cloudflare Pages 项目 | `scdsg-homepage` | Cloudflare Pages API / Wrangler 只读查询 |
| Pages 底层地址 | `scdsg-homepage.pages.dev` | Cloudflare Pages API |
| 用户提供的公开地址 | `agent-forum-2026-congress-re.scdsg-homepage.pages.dev` | 现场 HTTP 检查 |
| 生产分支 | `main` | Cloudflare Pages API |
| 当前生产版本 | `7c661a2` | Cloudflare 部署记录 |
| 当前公开预览版本 | `2c927c6`，分支预览别名 | Cloudflare 部署记录 |
| 项目连接方式 | Direct Upload；没有 Git Provider | Cloudflare Pages API / Wrangler |
| 框架 | 无；静态 HTML、CSS、JavaScript | 仓库文件 |
| 构建命令 | 无 | 无 `package.json`，Pages build config 为空 |
| 发布目录 | `.` | `wrangler.jsonc` 的 `pages_build_output_dir` |
| 自定义域 | 无 | Cloudflare Pages domains API |

重要发现：

- 用户提供的公开地址是**预览分支别名**，不是 Cloudflare 标记的 Production 环境。
- Production 环境当前没有 D1、R2 或环境变量绑定；Preview 环境有 `REGISTRATIONS_DB` D1 绑定。
- 在绑定正式域名前，必须先由人工确认 `2c927c6` 或后续审核版本是否应成为 `main` 的生产版本。此动作会影响正式站点，当前未执行。

## 当前配置审计

| 检查项 | 结果 |
|---|---|
| `wrangler.toml` | 不存在 |
| `wrangler.jsonc` | 存在；配置 Pages 输出目录、兼容日期/标志及 D1 |
| Pages 配置 | Direct Upload，生产分支 `main` |
| 环境变量 | 源代码、Preview、Production 中均未发现变量名称 |
| Pages Functions | 存在：`functions/api/submit-abstract.js` |
| 独立 Workers 代码/路由 | 仓库中未发现 |
| D1 | Preview 有 `REGISTRATIONS_DB`；Production 无绑定 |
| R2 | 无绑定；当前文件输入为 disabled |
| KV / Durable Objects / Queues | Pages Preview 与 Production 均无绑定 |
| `_headers` | 不存在 |
| `_redirects` | 不存在 |
| `robots.txt` | 不存在；线上请求被 HTML fallback 以 200 返回，不能当作有效 robots 文件 |
| `sitemap.xml` | 不存在；线上请求被 HTML fallback 以 200 返回，不能当作有效 sitemap |
| manifest | 不存在 |
| RSS/feed | 未发现 |

## 站内链接与 SEO 待修改清单

本轮没有修改下列项目：

| 项目 | 当前状态 | 迁移时的待办 |
|---|---|---|
| 站内相对链接/资产 | 51 个本地引用均有有效目标；页面内 hash 链接均对应现有 ID | 新路由实施后更新旧论坛路径并做 301 |
| 写死 `pages.dev` | 源代码中未发现 | 部署规则中新增从 Pages 地址到正式域的 301 |
| canonical | 三个 HTML 页面均没有 | 为每个可索引页面加入指向正式绝对 URL 的 canonical |
| Open Graph URL | 未发现 | 加入 `og:url`，同时补齐适当的 OG 元数据 |
| Twitter/X Card | 未发现 | 如协会需要分享卡片再加入；URL 使用正式域 |
| structured data | 未发现 | 加入真实且已确认的 `Organization` / `WebSite` 数据；不得虚构地址、电话、人员或日期 |
| sitemap | 不存在 | 生成正式域绝对 URL 的 `sitemap.xml` |
| robots | 不存在 | 创建正式 `robots.txt` 并引用正式 sitemap |
| manifest | 不存在 | 如启用 PWA/安装图标，再创建并使用正式域或相对路径 |
| RSS/feed | 不存在 | 未来存在 `/news` feed 时使用正式域 |
| API CORS | 当前 API 仅允许同源，比较的是请求自身 origin，没有写死域名 | 保持同源；若未来有后台子域，建立显式 allowlist |
| CSP | 页面没有 `_headers` CSP；API 响应 CSP 为 `default-src 'none'` | 根据实际本站资源设计最小 allowlist；不得为迁移而放宽到 `*` |
| 邮件模板 | 仓库中未发现 | 未来投稿确认邮件统一使用正式域 |

## 建议的长期路由结构（仅设计）

| 路由 | 用途 |
|---|---|
| `/` | 协会首页 |
| `/about` | 协会介绍 |
| `/history` | 发展历程 |
| `/activities` | 学术、人才、公益与会员活动 |
| `/network` | 中德会员及合作网络 |
| `/membership` | 入会申请 |
| `/news` | 协会新闻 |
| `/forum` | 年度论坛总入口 |
| `/forum/2026` | 2026 青年学术论坛 |
| `/forum/2027` | 后续年度路由占位规则；未有真实内容时返回 404 或指向 `/forum`，不得创建虚假会议页 |
| `/admin` | 管理后台；正式上线前必须通过身份验证并做应用内授权 |

旧路径兼容设计：

- `/forum-2026/` → `/forum/2026/`，301。
- `/forum-2026/register/` → 最终确定的投稿路径，例如 `/forum/2026/submit/`，301；目标名称为 **NEEDS HUMAN CONFIRMATION**。
- 保留 query string；上线前逐项检查旧书签和二维码。

## 实施前门槛

以下条件未满足前不应绑定正式域名：

1. **NEEDS HUMAN CONFIRMATION**：人工选定并购买 `SELECTED_DOMAIN`。
2. **NEEDS HUMAN CONFIRMATION**：确认哪一提交版本进入 `main` / Production。
3. 生产环境配置与预览环境对齐，并通过无真实个人数据的测试。
4. 决定投稿功能是否在正式域启用；R2 未完成前不得暗示文件已上传。
5. 准备 canonical、robots、sitemap、OG、structured data 的待发布变更并审核真实信息。
6. 确认管理员身份提供商与最小权限名单。
7. 建立发布前备份、回滚负责人和变更窗口。

## 自定义域名接入步骤（授权后执行）

### 1. 准备生产版本

1. 审核预览版本。
2. 经人工授权后，把确认版本发布为 Pages Production。
3. 记录发布前后的提交版本和 Cloudflare 部署版本，不在公开报告中记录账户或资源 ID。
4. 在底层 `pages.dev` 生产地址完成冒烟测试。

### 2. 添加裸域

Cloudflare Dashboard 路径：

1. **Workers & Pages**。
2. 选择 Pages 项目 `scdsg-homepage`。
3. **Custom domains**。
4. **Set up a domain**。
5. 输入 `SELECTED_DOMAIN` 并继续。
6. 等待域名状态为 Active，确认 DNS 记录和证书均正常。

### 3. 添加 `www`

重复上述流程，添加 `www.SELECTED_DOMAIN`。不要只手工创建 CNAME 而跳过 Pages 的 Custom domains 关联步骤。

### 4. 设定唯一 canonical

所有正式页面的 canonical 使用：

```text
https://SELECTED_DOMAIN/对应路径
```

裸域保留内容，`www` 永远 301 到裸域并保留路径和 query string。

### 5. 建立 301 重定向

域名级重定向优先使用 Cloudflare Redirect Rules 或 Bulk Redirects；Pages `_redirects` 不支持域名级匹配。

目标规则：

```text
https://www.SELECTED_DOMAIN/*                         → https://SELECTED_DOMAIN/:splat
https://scdsg-homepage.pages.dev/*                   → https://SELECTED_DOMAIN/:splat
https://agent-forum-2026-congress-re.scdsg-homepage.pages.dev/* → https://SELECTED_DOMAIN/:splat
https://PROTECTIVE_DOMAIN/*                          → https://SELECTED_DOMAIN/:splat
https://www.PROTECTIVE_DOMAIN/*                      → https://SELECTED_DOMAIN/:splat
```

规则要求：

- 状态码 301；
- 保留 path；
- 保留 query string；
- 不建立反向规则；
- 不把散列预览部署统一重定向，以免破坏后续预览 QA；具体预览访问策略为 **NEEDS HUMAN CONFIRMATION**。

当前预览别名已有 Cloudflare `x-robots-tag: noindex`。正式迁移后仍应实施 301，而不是只依靠 noindex。

### 6. 更新搜索与安全相关 URL

同一次受控发布中更新：

- canonical URL；
- `sitemap.xml`；
- `robots.txt`；
- Open Graph URL；
- structured data；
- RSS/feed URL（未来存在时）；
- API CORS allowlist（未来跨域时）；
- CSP allowlist；
- 邮件模板中的网站地址（未来存在时）。

不改变现有视觉、正文和交互。

## Pages 底层地址策略

- 保留 `scdsg-homepage.pages.dev` 作为部署底层地址和应急验证入口。
- 正常状态下，访问该生产地址应 301 到主域名。
- 不删除 Pages 项目或历史部署。
- 预览部署保持 `noindex`，并根据管理员需求决定是否用 Cloudflare Access 限制。
- sitemap、canonical 和所有公开分享链接只使用正式裸域。

## 回滚方案

绑定失败时按以下顺序回滚，避免删除项目或 DNS：

1. 暂停/禁用新建的 301 Redirect Rule 或 Bulk Redirect List。
2. 验证 `https://scdsg-homepage.pages.dev/` 仍直接可访问。
3. 如果页面版本有问题，使用 Cloudflare Pages 的 Production rollback 回到已记录的上一个健康部署；这是生产变更，必须人工授权。
4. 保留 Custom domains 和 DNS 记录等待排障，不立即删除。
5. 若仅 `www` 失败，保持裸域正常，不回滚整个站点。
6. 检查 CAA、DNSSEC、证书状态和域名是否在同一 Cloudflare 账户。
7. 故障解除后重新启用重定向并复测。

## DNS、SSL 与重定向验证

以下为授权实施后的只读验证命令：

```bash
dig +short SELECTED_DOMAIN A
dig +short SELECTED_DOMAIN AAAA
dig +short www.SELECTED_DOMAIN CNAME
dig +trace SELECTED_DOMAIN

curl -I https://SELECTED_DOMAIN/
curl -I https://www.SELECTED_DOMAIN/test-path?source=verify
curl -I https://scdsg-homepage.pages.dev/test-path?source=verify
curl -I https://agent-forum-2026-congress-re.scdsg-homepage.pages.dev/test-path?source=verify

openssl s_client -connect SELECTED_DOMAIN:443 -servername SELECTED_DOMAIN </dev/null
openssl s_client -connect www.SELECTED_DOMAIN:443 -servername www.SELECTED_DOMAIN </dev/null
```

验收标准：

- 主域 HTTPS 返回 200；
- `www`、Pages 生产地址、指定预览别名和保护域均只跳转一次，返回 301；
- `Location` 指向裸域且路径/query 不丢失；
- 证书包含裸域与 `www` 对应主机名，证书链可信且未过期；
- 页面源码 canonical、OG、structured data 与实际 URL 一致；
- `robots.txt` 返回 `text/plain`，不是 HTML fallback；
- `sitemap.xml` 返回有效 XML，所有 URL 均为正式裸域；
- 不出现 mixed content、重定向循环或跨域 API 错误。

DNS TTL 只能影响缓存刷新速度；不同递归解析器传播时间不同。SSL 状态必须在 Cloudflare 显示 Active 后再对外宣布迁移完成。

## 可追溯资料

- [Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [将 pages.dev 重定向至自定义域](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/)
- [Cloudflare Pages Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)
- [Cloudflare URL Redirects](https://developers.cloudflare.com/rules/url-forwarding/)

