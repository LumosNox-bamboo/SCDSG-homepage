# SCDSG 长期数据与文件存储架构

状态：**设计文档；未创建或修改生产数据库、R2、权限或部署**

审计日期：2026-07-26

## 目标架构

```text
Cloudflare Pages
  └─ 协会公开网站与管理后台前端
       │
       ▼
Pages Functions / Cloudflare Workers
  ├─ 表单验证、速率限制、权限校验
  ├─ 投稿/报名/会员 API
  ├─ 私有上传与受控下载
  ├─ GDPR 导出/删除工作流
  └─ 审计事件
       │
       ├──────────► Cloudflare D1
       │             结构化记录、文件元数据、同意与审计
       │
       └──────────► Cloudflare R2
                     私有简历、图片、附件与加密备份
```

文件内容不得存入 D1。D1 只保存对象键和元数据。

## 当前状态与差距

| 项目 | 当前状态 | 差距 |
|---|---|---|
| Pages | 静态主站、论坛和投稿页 | 长期路由尚未重构 |
| Function | `/api/submit-abstract` 可接收文字投稿 | 只有投稿创建；无查询、审核、导出、删除、幂等或管理员权限 |
| D1 | Preview 绑定 `REGISTRATIONS_DB`；Production 无绑定 | 当前 schema 混合早期报名与投稿用途，缺少长期主体、同意版本、审核日志、删除请求等结构 |
| R2 | 无绑定 | 文件上传、私有访问、生命周期与删除尚未实现 |
| 文件输入 | CV 与 Figure 均 disabled | 当前投稿并不完整 |
| 管理后台 | 不存在 | `/admin` 上线前必须先有 Cloudflare Access 和应用内 RBAC |
| 隐私与保留 | 只有一个必选 checkbox 和时间 | 法律文本、处理目的、保留期限、导出/删除流程均待负责人确认 |

仓库已有的 D1 迁移：

- `registrations`：早期普通报名字段。
- `abstract_submissions`：姓名、邮箱、机构、职业阶段、题目、方向、摘要、关键词及文件占位元数据。

本方案不假设现有记录数量，也不读取或展示任何个人数据。

## 数据域必须分离

| 数据域 | 目的 | 典型数据 | 访问范围 |
|---|---|---|---|
| 协会会员数据 | 入会申请、会员状态与会员服务 | 申请人资料、资格状态、有效期、同意 | 会员管理员；财务/理事仅见职责所需字段 |
| 普通活动报名 | 单次活动组织与通知 | 活动、参与人、出席方式、报名状态 | 活动管理员，仅限对应活动 |
| 年度会议投稿 | 摘要征集、评审、通知 | 年度、题目、摘要、关键词、作者、文件、审核状态 | 会议管理员、分配到该投稿的评审人 |
| 管理员账号与权限 | 管理访问与责任追踪 | 外部身份 subject、角色、启停状态 | 超级管理员最小集合 |
| 文件元数据 | 将 D1 记录与 R2 对象关联 | 对象键、文件名、MIME、大小、用途、状态 | API 和获授权管理员 |
| 审核操作记录 | 可追溯审核与权限行为 | 谁、何时、对哪个记录、执行何动作 | 审计角色；不可修改 |
| 用户同意记录 | 证明用户同意具体文本与目的 | 文本版本、目的、时间、撤回时间 | 隐私负责人及必要管理员 |
| 数据删除请求 | GDPR/内部删除流程 | 请求人、范围、核验、状态、完成时间 | 隐私负责人 |

不同数据域不要复用一张“大表”，也不要因为同一邮箱就自动合并会员、活动和投稿身份。跨域关联必须有明确目的和授权。

## 建议的 D1 逻辑模型

下列是下一阶段 schema 设计输入，不是已创建的表。

### 核心主体

| 表 | 作用 | 关键字段示例 |
|---|---|---|
| `people` | 最小化的主体标识 | `id`, `display_name`, `email_normalized`, `created_at`, `deleted_at` |
| `membership_applications` | 入会申请，不等同于已成为会员 | `id`, `person_id`, `application_status`, `submitted_at`, `reviewed_at` |
| `memberships` | 经批准后的会员状态 | `id`, `person_id`, `status`, `started_at`, `ended_at` |
| `activities` | 活动真实记录 | `id`, `slug`, `category`, `starts_at`, `status` |
| `activity_registrations` | 普通活动报名 | `id`, `activity_id`, `person_id`, `status`, `submitted_at` |
| `forum_editions` | 年度论坛容器 | `id`, `year`, `status` |
| `forum_submissions` | 年度会议投稿 | `id`, `forum_edition_id`, `submitter_id`, `code`, `title`, `research_area`, `abstract_text`, `keywords`, `status`, `submitted_at` |
| `submission_authors` | 投稿作者及顺序 | `submission_id`, `person_id` 或最小作者快照、`author_order`, `is_presenter` |

### 文件、同意与管理

| 表 | 作用 | 必备字段 |
|---|---|---|
| `files` | R2 文件元数据 | `id`, `object_key`, `original_file_name`, `mime_type`, `file_extension`, `size_bytes`, `uploaded_at`, `owner_person_id`, `purpose`, `review_status`, `checksum`, `deleted_at` |
| `file_links` | 文件与业务对象关联 | `file_id`, `entity_type`, `entity_id`, `relation_type` |
| `consent_text_versions` | 不可变的同意文本版本 | `id`, `purpose_code`, `locale`, `version`, `text_hash`, `effective_at` |
| `consent_records` | 用户对某目的的证据 | `id`, `person_id`, `text_version_id`, `business_entity_type`, `business_entity_id`, `consented_at`, `withdrawn_at` |
| `admin_identities` | 外部身份与应用角色映射 | `id`, `identity_provider`, `external_subject`, `status`；不存本地密码 |
| `admin_role_assignments` | 最小权限 | `admin_identity_id`, `role`, `scope_type`, `scope_id`, `expires_at` |
| `audit_events` | 追加式审计 | `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `result`, `occurred_at`, `request_correlation_id` |
| `data_subject_requests` | 导出、更正和删除请求 | `id`, `request_type`, `requester_person_id`, `verification_status`, `scope`, `status`, `received_at`, `completed_at` |
| `retention_policies` | 可审计的保留规则版本 | `id`, `data_category`, `trigger_event`, `retention_period`, `policy_version` |

设计要求：

- 业务主键使用不可预测 ID；人类可见的投稿编号与内部 ID 分离。
- 邮箱规范化用于查重，但不作为公开 ID。
- 所有时间使用 UTC ISO-8601。
- 敏感正文不复制到 audit event、错误日志或分析系统。
- 软删除只用于业务工作流；保留期结束后仍须执行真正删除。
- 评审人只能读取分配给自己的投稿及必要字段。
- 超级管理员不能成为日常操作的默认角色。

## R2 文件策略

### Bucket

- 单独创建默认私有 bucket；名称不含个人信息。
- 禁用 Public Development URL。
- 不添加公开 `files` 子域。
- 不允许列出 bucket。
- 管理端也不得直接获得长期 R2 凭据。

### 对象键

使用服务端生成的不可预测键，例如：

```text
private/{purpose}/{year}/{random-128-bit-id}
```

不得使用：

```text
{email}/{original-file-name}
{full-name}-cv.pdf
public/files/...
```

原始文件名只保存在 D1 元数据中。随机对象键防止猜测，也避免同名覆盖。

### 文件元数据

D1 `files` 至少保存：

- R2 object key；
- 原始文件名；
- 声明 MIME；
- 服务端确认 MIME；
- 扩展名；
- 字节大小；
- checksum；
- 上传时间；
- 上传者；
- 业务用途；
- 所属记录；
- 上传/校验/审核状态；
- 删除时间。

不在 D1 保存二进制、base64 或 Data URL。

### 上传流程

1. 用户先创建业务草稿，获得短时 upload session。
2. Worker 校验身份/业务权限、用途、允许扩展名和声明大小。
3. 服务端生成随机对象键，绝不采信客户端对象键。
4. 对小文件可通过受控 Worker 上传；采用 presigned URL 时仅允许指定 key、方法和很短有效期。
5. 上传进入 `quarantine` / `pending_validation` 状态。
6. 服务端读取对象元数据或必要字节，双重校验：
   - 扩展名；
   - MIME；
   - magic bytes；
   - 实际大小；
   - checksum。
7. 校验通过后写入 D1 `files` 并关联业务记录；失败则删除对象并返回明确原因。
8. 提交最终稿时检查必需文件是否存在且状态有效。

允许类型和大小：

- CV 初始候选：PDF。
- Figure 初始候选：JPEG、PNG、WebP。
- 每类最大大小、PDF 页数、图像像素与是否接受含脚本/附件的 PDF 为 **NEEDS HUMAN CONFIRMATION**。
- 前端 `accept` 只改善选择体验，不能代替服务端校验。
- 病毒/恶意文档扫描方案为 **NEEDS HUMAN CONFIRMATION**；未扫描文件不得自动向所有管理员开放。

### 下载流程

优先使用受控下载 Worker：

1. 管理员经 Cloudflare Access 登录。
2. Worker 验证 Access JWT。
3. 应用查询 D1 角色、scope 与目标记录。
4. Worker 读取指定 R2 key 并流式返回。
5. 响应使用安全的 `Content-Disposition`、`nosniff` 和合适缓存策略。
6. 写入不含敏感正文的下载审计事件。

如使用 presigned GET URL：

- 有效期应很短；
- 只签一个对象和一种方法；
- 不在日志、邮件或前端持久存储完整 URL；
- URL 泄露时到期前可访问，因此高度敏感材料仍优先走 Worker。

## API 与权限边界

### 公开 API

- 会员申请、普通报名、年度投稿分开路由。
- 服务端 schema 校验、请求体大小限制和速率限制。
- 使用 idempotency key 防止弱网重复提交。
- 不使用 Google reCAPTCHA。
- CAPTCHA/Turnstile 如增加，只是分层防护之一，并提供可恢复失败路径。
- 响应不确认某邮箱是否已经存在，避免账户枚举。

### 管理 API

- `/admin` 和 `/api/admin/*` 必须由 Cloudflare Access 保护。
- Worker 必须验证 Access JWT；不能只相信前端页面被挡住。
- 再做应用内 RBAC：
  - `membership_reviewer`
  - `activity_manager`
  - `forum_reviewer`
  - `forum_admin`
  - `privacy_officer`
  - `audit_reader`
  - 极少量 `system_admin`
- 支持按论坛年度、活动或数据域限制 scope。
- 高风险操作（批量导出、删除、权限修改）需要重新确认并完整审计。

管理员身份建议由组织控制的 IdP 管理，D1 不保存管理员密码。账号名单、MFA 要求和离职撤权时限为 **NEEDS HUMAN CONFIRMATION**。

## GDPR 与隐私控制

协会需要先确定其 Controller、共同 Controller 或其他角色；Cloudflare 等服务的 Processor/传输安排需要负责人和法律文本确认。本方案不是法律意见。

### 数据最小化与目的限制

- 会员申请只收审核所必需数据。
- 活动报名不默认要求完整简历或摘要。
- 年度投稿不自动成为入会申请。
- 管理员看不到与职责无关的数据域。
- 不把投稿数据自动用于营销、会员招募或公开展示。

### 透明与同意

正式处理会员或投稿数据前必须提供经协会负责人确认的隐私声明，至少说明：

- Controller 身份和联系渠道；
- 每类数据处理目的与法律依据；
- 必填/选填；
- 接收方；
- 跨境处理；
- 保存期限；
- 访问、更正、导出、撤回和删除方式；
- 申诉渠道；
- 自动化决策（如有）。

同意记录必须关联准确文本版本、语言、目的和时间。不能只保存 `consented_at` 而不知道用户同意了哪一版文本。

### 保存期限

最终期限必须写入协会批准的 retention schedule，为 **NEEDS HUMAN CONFIRMATION**。可供法律审核的初始建议：

| 数据 | 触发点 | 建议起点，非最终政策 |
|---|---|---|
| 未批准的会员申请 | 最终决定/申诉期结束 | 6–12 个月后删除 |
| 有效会员核心记录 | 会员关系结束 | 仅保留法定义务所需最小记录，其余按政策删除 |
| 普通活动报名 | 活动结束 | 3–12 个月，除非财税或事故处理需要更久 |
| 未获选论坛投稿 | 评审/申诉结束 | 6–12 个月后删除文件及非必要正文 |
| 获选投稿 | 论坛及出版流程结束 | 根据出版许可和明确目的确定；私人 CV 不因获选而永久保存 |
| 审计日志 | 事件发生 | 12–24 个月的最小化日志，法律审核后确定 |
| 删除请求证据 | 请求完成 | 保留证明履行义务所需的最小记录 |
| D1/R2 备份 | 备份创建 | 生命周期应与已公布政策一致；从在线系统删除后，备份在有限周期内到期 |

D1 Time Travel 的实际窗口与 Cloudflare 套餐有关。删除流程应记录“在线数据删除时间”和“备份到期时间”，不得承诺无法立即实现的备份逐项擦除。

### 数据导出与删除

导出：

- 核验请求人身份；
- 按数据域汇总其结构化数据和文件；
- 生成私有、短时下载；
- 导出完成后删除临时包；
- 不把他人的评审意见或个人数据错误导出。

删除：

1. 核验身份与范围。
2. 冻结非必要处理。
3. 找出会员、活动、投稿、consent 和文件关联。
4. 删除对应 R2 对象。
5. 删除/匿名化 D1 业务数据。
6. 保留法律允许的最小履约证据。
7. 记录完成时间及备份自然到期窗口。
8. 向请求人确认，不在通知中回传敏感内容。

### 泄露响应

上线前建立：

- 内部事件联系人和升级渠道；
- 封禁账号、撤销签名 URL、停用 API 与轮换凭据流程；
- 受影响数据、主体、时间线与措施记录；
- GDPR 监管机构与用户通知判断流程；
- 恢复及事后复盘；
- 禁止在事故工单和普通聊天中粘贴摘要、CV 或完整数据库导出。

通知时限和法律义务必须由负责人/DPO 或法律顾问按事件判断。

## 日志要求

可以记录：

- correlation ID；
- 投稿编号；
-事件类型；
- 状态码；
- 研究方向等已评估为非敏感的有限枚举；
- 管理员 subject 的内部映射 ID；
- 发生时间。

不得记录：

- 姓名；
- 邮箱；
- 机构自由文本；
- 摘要正文；
- 关键词自由文本；
- CV/图片内容；
- presigned URL；
- Cookie、Authorization、Access JWT；
- API Token、Account ID、数据库 ID 或 R2 凭据。

日志保存期、访问角色及告警规则为 **NEEDS HUMAN CONFIRMATION**。

## 备份、恢复与删除一致性

- D1 使用 Time Travel 做短期恢复；执行恢复是覆盖性操作，必须审批。
- 需要更长期备份时，可导出到独立私有 R2 backup prefix/bucket，并设置生命周期。
- 备份应加密、限制访问、记录导出和恢复审计。
- 备份文件不能通过公有 URL 提供。
- 每年至少演练一次“恢复到隔离环境”，不得直接用生产数据做普通开发测试。
- 删除请求与备份保留之间的关系必须在隐私声明和内部 SOP 中说明。

## 下一阶段任务

1. **NEEDS HUMAN CONFIRMATION**：批准隐私声明、处理目的、法律依据、保留期限和数据责任人。
2. 设计新的 D1 migration；先在独立开发/预览数据库验证，不直接修改生产。
3. 制作现有两张表到长期模型的迁移和回滚方案；仅统计 schema，不导出个人数据到报告。
4. 启用 R2 后创建私有测试 bucket，保持 Public Development URL disabled。
5. 实现 upload session、对象随机键、大小/类型/magic-byte 校验和失败清理。
6. 实现受控下载 Worker及审计。
7. 建立 Cloudflare Access，并在应用层实现 RBAC/scope。
8. 实现同意文本版本、导出、更正、删除和保留期清理工作流。
9. 增加速率限制、幂等和明确重试机制。
10. 使用虚假测试数据完成中国三网与欧洲上传/下载测试。
11. 完成安全评审和数据泄露响应演练后，才允许收集真实会员与投稿材料。

## 可追溯资料

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare D1 数据安全](https://developers.cloudflare.com/d1/reference/data-security/)
- [Cloudflare D1 Time Travel 与备份](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 Public Buckets 与关闭公开访问](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare Access Web Applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/)
- [Cloudflare Access Policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
- [European Commission 欧盟数据保护法律框架](https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en)
- [EDPB Guidelines 9/2022：Personal Data Breach Notification](https://www.edpb.europa.eu/documents/guideline/guidelines-92022-on-personal-data-breach-notification-under-gdpr_en)
