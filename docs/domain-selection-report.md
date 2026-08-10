# SCDSG 长期官网域名选择报告

状态：**仅供人工决策，未执行注册或购买**

审计日期：2026-07-26  
实时查询窗口：2026-07-26 12:34–12:40 CEST（Europe/Berlin）  
查询方法：Cloudflare Registrar API `domain-check` 只读端点。该端点直接查询注册局，返回实时可注册性、当前注册/续费价格和 standard/premium 等级；本次没有调用注册端点。  
价格口径：USD/年，不含可能适用的税费；最终结算币种、税费和付款主体为 **NEEDS HUMAN CONFIRMATION**。

> 域名状态变化很快。下表只代表上述查询窗口；人工决定购买时必须在 Cloudflare Dashboard 再检查一次。

## 结论

推荐长期主域名：`scdsgassociation.com`

推荐保护域名组合：

1. `scdsgnetwork.com`
2. `scdsgermany.com`

推荐理由：

- `scdsgassociation.com` 保留协会既有简称，并明确表达“协会”，最不容易被理解为一次性会议、商业医疗机构或泛中德官方组织。
- `scdsgnetwork.com` 适合协会长期扩展会员与合作网络，可作为防御性注册后 301 跳转至主域名。
- `scdsgermany.com` 强化德国地域属性，但连写存在被读作 “SCDS Germany” 的可能，因此更适合作保护域名而非首选主域名。
- `scdsg.org` 当前不可注册，而且已有 “Sickle Cell Disease Support Group of Ghana” 使用该域名和同一简称，存在明显全球品牌混淆风险。
- 含 `China Germany Medical` 或 `Sino-German Medical` 的候选容易与已经存在的中德医学组织混淆，也可能被误解为代表整个中德医学界。

## Cloudflare Registrar 实时结果

| 优先级 | 候选域名 | 实时状态 | 首年价格 | 标准续费 | Premium | Cloudflare Registrar | 品牌清晰度 | 拼写难度 | 长期协会适配 | 中欧用户适配 | 潜在混淆风险 | 推荐等级 |
|---:|---|---|---:|---:|---|---|---|---|---|---|---|---|
| 1 | `scdsgassociation.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 高：简称 + 协会属性 | 中：单词较长 | 高 | 高 | 与既有 `SCDSG` 同简称组织仍可能发生搜索混淆 | A |
| 2 | `scdsgnetwork.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中高：强调网络 | 低 | 高 | 高 | “network” 不完全等同于协会法律身份 | A- |
| 3 | `scdsg.org` | **不可注册**：`domain_unavailable` | 不适用 | 不适用 | API 未返回 premium | 当前不能注册 | 表面很高 | 低 | 不适用 | 不适用 | **高**：已有加纳镰状细胞病支持组织使用 | 排除 |
| 4 | `scdsgermany.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中：德国属性明确 | 中 | 中高 | 高 | 可能被拆读为 “SCDS Germany” | B+ |
| 5 | `scdsg-med.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中 | 中高：含连字符 | 中高 | 中高 | 口述时容易漏掉连字符；`med` 含义较泛 | B |
| 6 | `chinagermanymed.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中：领域可理解 | 中 | 中 | 中高 | 高：像泛行业平台或官方中德医学组织 | C |
| 7 | `sinogermanmed.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中 | 中 | 中 | 中高 | **高**：与既有 Sino-German Medical Association 表述接近 | C |
| 8 | `sinogermanscholars.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中：学者属性明确但医学弱化 | 高：较长 | 中 | 中 | 与泛中德学术组织/项目概念接近 | C |
| 9 | `heidelbergmedscholars.com` | 可注册 | USD 10.46/年 | USD 10.46/年 | 否，standard | 支持，API 可注册 | 中 | 高：很长 | 低至中 | 中 | 可能暗示与海德堡市、大学或医院存在官方隶属关系；地域过窄 | D |

## 最推荐的三个域名

### 1. `scdsgassociation.com`

最适合长期协会主站。虽然长度略高，但含义明确，能容纳协会介绍、活动、会员、新闻、合作网络和历届论坛。

### 2. `scdsgnetwork.com`

短于首选，国际用户易理解，适合长期人才与合作网络定位。缺点是不能单独说明组织是正式协会。

### 3. `scdsgermany.com`

地域识别度强，适合作保护域名。缺点是字符边界不清晰，品牌朗读和搜索可能出现歧义。

## 明确排除

- `scdsg.com`：按任务要求排除；不购买、不查询卖价、不联系卖方。
- `scdsg.org`：当前不可注册，且已有同简称医学公益组织，排除。
- 任何含 `2026`、`2027` 或其他年份的主域名。
- 多个连字符、明显过长、容易拼错或暗示与其他机构有官方隶属关系的域名。

## 初步品牌与同名冲突筛查

这不是德国、欧盟、中国或国际商标数据库中的正式法律检索。正式购买及启用前，协会负责人应确认英文正式名称、注册主体名称和法律文本。

| 风险点 | 证据 | 判断 |
|---|---|---|
| `SCDSG` 同简称与 `.org` 域名 | `scdsg.org` 由 Sickle Cell Disease Support Group of Ghana 使用 | 所有保留 SCDSG 的域名在全球搜索中都有一定简称混淆，但首选域名加入 `association` 可降低风险 |
| Sino-German Medical Association | 已有 1984 年成立的中德医学相关组织使用这一英文表述，公开会议资料同时出现 CDGM/DCGM | `sinogermanmed.com`、`chinagermanymed.com` 易被理解为该组织或泛中德官方医学平台，风险高 |
| Heidelberg 地域/机构联想 | 候选包含城市名和 `med scholars` | 可能暗示海德堡大学、医院或当地官方学术组织的隶属关系；协会本身是全德网络，定位也过窄 |
| `SCDSG Germany` 字符边界 | `scdsgermany` 可被拆为 `SCDS Germany` 或 `SCDSG Germany` | 可用于保护注册，主域名清晰度弱于 `scdsgassociation.com` |

## 人工最终检查清单

在购买前，由协会负责人完成：

- **NEEDS HUMAN CONFIRMATION**：协会对外使用的正式英文全称、德文全称与注册主体名称。
- **NEEDS HUMAN CONFIRMATION**：欧盟 EUIPO、德国 DPMA 及必要时中国商标数据库的相同或近似名称检索。
- **NEEDS HUMAN CONFIRMATION**：域名注册人、付款主体、发票信息、联系人邮箱和自动续费负责人。
- **NEEDS HUMAN CONFIRMATION**：Cloudflare Dashboard 最终结算价格、税费、币种和续费设置。
- 再次运行 Registrar 实时查询，确认域名仍可注册且仍为 standard。
- 确认不需要购买任何年份域名或独立会议主域名。

## Cloudflare Dashboard 人工购买路径

以下步骤仅供人工操作，本次未执行：

1. 登录 Cloudflare Dashboard。
2. 进入 **Domain Registration / Registrar**（不同控制台版本也可能显示为 **Domains > Register Domains**）。
3. 选择 **Register a domain**。
4. 输入人工选定的域名，并重新核对：
   - Available；
   - 首年价格；
   - Renewal price；
   - Standard 或 Premium；
   - 支持注册的年限；
   - 税费与最终金额。
5. 检查并填写真实注册联系人；不要把临时个人邮箱作为长期唯一管理入口。
6. 人工确认自动续费、付款方式与发票主体。
7. 只在协会授权人明确批准后点击最终付费按钮。
8. 购买保护域名时，不为其建立独立网站；后续仅配置至主域名的 301 重定向。

## 可追溯资料

- [Cloudflare Registrar API 指南](https://developers.cloudflare.com/registrar/registrar-api/)
- [Cloudflare Registrar API 参考](https://developers.cloudflare.com/api/resources/registrar/)
- [Cloudflare 注册新域名操作说明](https://developers.cloudflare.com/registrar/get-started/register-domain/)
- [SCDSG — Sickle Cell Disease Support Group of Ghana](https://scdsg.org/)
- [中德医学组织会议资料（含 DCGM/CDGM 介绍）](https://www.ukr.de/fileadmin/UKR/veranstaltungen/Kongressteam/Dateien/DCGM_Konferenzbroschuere_240329_A5_DE-EN_07102024.pdf)

