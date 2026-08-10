# SCDSG 投稿确认邮件：Gmail 备用通道配置

## 目标

投稿确认邮件默认由 Cloudflare Email Sending 从 `forum@scdsg-med.com` 发出。若 Cloudflare 拒绝或无法投递，`scdsg-confirmation-email` Worker 自动改用协会 Gmail `scdsg.heidelberg@gmail.com` 发送同一封确认邮件。

备用通道只传输收件邮箱、投稿编号和确认邮件正文，不传输研究摘要、简历或补充图表。

## 1. 在 Google Cloud 创建 OAuth 客户端

1. 使用协会 Gmail 登录 [Google Cloud Console](https://console.cloud.google.com/)。
2. 新建或选择协会专用项目。
3. 在 **APIs & Services → Library** 启用 **Gmail API**。
4. 配置 **OAuth consent screen**，将协会 Gmail 设为授权用户。长期运行时不要将应用长期停留在仅供短期测试的状态。
5. 在 **Credentials → Create credentials → OAuth client ID** 创建 **Web application** 客户端。
6. 添加授权回调地址：`https://developers.google.com/oauthplayground`
7. 保存 `Client ID` 与 `Client secret`，不要将其提交到 GitHub 或发送到聊天中。

## 2. 生成仅含发信权限的 Refresh Token

1. 打开 [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)。
2. 打开设置，勾选 **Use your own OAuth credentials**，填入上一步的 Client ID 与 Client secret。
3. 选择权限：`https://www.googleapis.com/auth/gmail.send`
4. 点击 **Authorize APIs**，使用协会 Gmail 授权。
5. 点击 **Exchange authorization code for tokens**。
6. 保存返回的 `Refresh token`。不要保存或复制短期 `Access token`。

## 3. 将三个值安全写入 Cloudflare Worker

在项目根目录依次运行：

```bash
npx wrangler secret put GMAIL_CLIENT_ID --config workers/confirmation-email/wrangler.jsonc
npx wrangler secret put GMAIL_CLIENT_SECRET --config workers/confirmation-email/wrangler.jsonc
npx wrangler secret put GMAIL_REFRESH_TOKEN --config workers/confirmation-email/wrangler.jsonc
```

每条命令出现提示后，在终端中粘贴对应值。输入内容不会写入仓库。

可只检查 Secret 名称是否存在：

```bash
npx wrangler secret list --config workers/confirmation-email/wrangler.jsonc
```

## 4. 上线与验证

Worker 代码部署命令：

```bash
npx wrangler deploy --config workers/confirmation-email/wrangler.jsonc
```

上线后使用已有海德堡邮箱进行一次明确标注的复测。预期日志：

- Cloudflare 成功：`channel: cloudflare`
- Cloudflare 失败、Gmail 成功：`channel: gmail_fallback`
- 两个通道均失败：HTTP 502，并仅记录两个错误代码

## 安全要求

- 三个 OAuth 值只存储为 Cloudflare Secrets。
- 不将 `client_secret.json`、Refresh Token、Access Token 写入仓库、文档、日志或聊天。
- OAuth 权限只申请 `gmail.send`，不申请读取、删除或管理邮箱的权限。
- 若协会 Gmail 密码或管理员发生变更，应检查 OAuth 授权是否仍然有效。
- 不在错误日志中记录收件地址、令牌、摘要或附件内容。

## 官方文档

- [Gmail API：发送邮件](https://developers.google.com/gmail/api/guides/sending)
- [Google OAuth 2.0 Web Server Flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
