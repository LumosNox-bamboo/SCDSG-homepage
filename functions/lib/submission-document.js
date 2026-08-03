import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun
} from 'docx';

const DOCUMENT_FONT = {
  ascii: 'Arial',
  hAnsi: 'Arial',
  eastAsia: 'STSong'
};

const TRACKS = {
  basic: '基础医学',
  life_sciences: '生命科学',
  medical_ai: '医学人工智能',
  biomed_cross: '生物医药交叉学科',
  molecular: '分子、细胞与系统生物学',
  immunology: '免疫、感染与炎症研究',
  clinical: '临床医学',
  translational: '转化医学',
  pharma: '药学与化学',
  bioinformatics: '生物信息学、医学人工智能与数字健康',
  other: '其他医学与生命科学方向'
};

const CAREER_STAGES = {
  undergraduate: '本科生',
  masters: '硕士研究生',
  doctoral: '博士研究生',
  postdoc: '博士后',
  clinician: '临床医师',
  pi: '独立研究者 / PI',
  industry: '产业界研究者',
  other: '其他'
};

const PRESENTATIONS = {
  oral: '口头报告',
  poster: '壁报展示',
  either: '均可'
};

const DELIVERY_STATUSES = {
  sent: '已发出',
  failed: '发送失败',
  unavailable: '发信服务不可用',
  pending: '正在发送',
  not_provided: '未填写',
  legacy_unknown: '历史记录未追踪'
};

const CONSENTS = {
  'forum-2026-v1': {
    label: 'forum-2026-v1（原始投稿表）',
    items: [
      '协会保存和使用本次投稿信息',
      '用途：本次论坛的匿名学术评审、会务联络及学术展示'
    ]
  },
  'forum-2026-v2': {
    label: 'forum-2026-v2',
    items: [
      '接收与保存：姓名、电子邮箱、机构与职业信息、投稿题目、摘要、关键词、个人简历及可选补充图表',
      '学术处理：研究内容用于匿名学术评审，入选后用于会议安排及相应学术展示',
      '会务联络：姓名和电子邮箱用于投稿确认、评审结果及本次论坛相关通知'
    ]
  },
  'forum-2026-v3': {
    label: 'forum-2026-v3',
    items: [
      '同意协会为本次论坛的投稿评审及会务联络处理所提交的信息与材料'
    ]
  }
};

function value(map, key) {
  return map[key] || key || '—';
}

function metadataLine(label, content) {
  return new Paragraph({
    spacing: { after: 80, line: 300 },
    children: [
      new TextRun({ text: `${label}：`, bold: true, color: '155EA8' }),
      new TextRun({ text: content || '—', color: '10273C' })
    ]
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    children: [new TextRun(text)]
  });
}

export function consentDetails(version) {
  return CONSENTS[version] || CONSENTS['forum-2026-v1'];
}

export async function createSubmissionDocument(submission, files) {
  const createdAt = new Date(submission.created_at);
  const submittedAt = Number.isNaN(createdAt.getTime())
    ? submission.created_at
    : createdAt.toLocaleString('zh-CN', { timeZone: 'Europe/Berlin' });
  const fileLines = files.length
    ? files.map((file) => new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 80, line: 300 },
        children: [new TextRun(
          `${file.purpose === 'cv' ? '个人简历' : '补充图表'}：${file.original_file_name}（${file.size_bytes} bytes）`
        )]
      }))
    : [new Paragraph('无附件记录')];
  const consent = consentDetails(submission.consent_version);

  const document = new Document({
    creator: 'SCDSG',
    title: `${submission.submission_code} 投稿信息`,
    description: '2026 青年学术论坛投稿归档',
    styles: {
      default: {
        document: {
          run: {
            font: DOCUMENT_FONT,
            size: 22,
            color: '10273C'
          },
          paragraph: { spacing: { after: 120, line: 300 } }
        }
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: DOCUMENT_FONT,
            size: 46,
            bold: true,
            color: '0B3156'
          },
          paragraph: { spacing: { before: 0, after: 100 } }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: DOCUMENT_FONT,
            size: 32,
            bold: true,
            color: '155EA8'
          },
          paragraph: { spacing: { before: 360, after: 200 }, keepNext: true }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: 'SCDSG · 2026 青年学术论坛 · 投稿档案',
              size: 18,
              color: '496174'
            })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: '第 ', size: 18, color: '496174' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '496174' }),
              new TextRun({ text: ' 页', size: 18, color: '496174' })
            ]
          })]
        })
      },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: 'SCDSG FORUM 2026', bold: true, size: 20, color: '58C3CD' })]
        }),
        new Paragraph({
          style: 'Title',
          children: [new TextRun('投稿信息')]
        }),
        new Paragraph({
          spacing: { after: 320 },
          children: [new TextRun({ text: submission.submission_code, bold: true, size: 24, color: 'A9824B' })]
        }),
        sectionHeading('投稿与申请人'),
        metadataLine('投稿时间（德国时间）', submittedAt),
        metadataLine('姓名', submission.full_name),
        metadataLine('常用邮箱 1', submission.email),
        metadataLine('常用邮箱 2', submission.email_secondary),
        metadataLine('单位', submission.institution),
        metadataLine('职业阶段', value(CAREER_STAGES, submission.career_stage)),
        metadataLine('投稿题目', submission.contribution_title),
        metadataLine('研究方向', value(TRACKS, submission.research_area)),
        metadataLine('展示意向', value(PRESENTATIONS, submission.presentation_preference)),
        metadataLine('关键词', submission.keywords),
        metadataLine('当前状态', submission.status),
        sectionHeading('确认邮件'),
        metadataLine(
          '邮箱 1',
          `${value(DELIVERY_STATUSES, submission.confirmation_email_1_status)}${submission.confirmation_email_1_channel ? `（${submission.confirmation_email_1_channel}）` : ''}`
        ),
        metadataLine(
          '邮箱 2',
          `${value(DELIVERY_STATUSES, submission.confirmation_email_2_status)}${submission.confirmation_email_2_channel ? `（${submission.confirmation_email_2_channel}）` : ''}`
        ),
        metadataLine('至少一个已发出', Number(submission.confirmation_any_sent) === 1 ? '是' : '否'),
        sectionHeading('摘要'),
        new Paragraph({
          spacing: { after: 180, line: 300 },
          children: [new TextRun(submission.abstract_text || '—')]
        }),
        sectionHeading('附件记录'),
        ...fileLines,
        sectionHeading('同意记录'),
        metadataLine('同意版本', consent.label),
        ...consent.items.map((item) => new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80, line: 300 },
          children: [new TextRun(item)]
        })),
        metadataLine('同意时间', submission.consented_at)
      ]
    }]
  });

  return Packer.toBuffer(document);
}

export { CAREER_STAGES, PRESENTATIONS, TRACKS };
