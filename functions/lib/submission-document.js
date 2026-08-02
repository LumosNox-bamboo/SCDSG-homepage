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

const TRACKS = {
  molecular: '分子、细胞与系统生物学',
  immunology: '免疫、感染与炎症研究',
  clinical: '临床医学与患者导向研究',
  translational: '转化医学与精准诊疗',
  pharma: '药物发现与生物技术',
  bioinformatics: '生物信息学、医学人工智能与数字健康',
  other: '其他医学与生命科学方向'
};

const CAREER_STAGES = {
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

  const document = new Document({
    creator: 'SCDSG',
    title: `${submission.submission_code} 投稿信息`,
    description: '2026 青年学术论坛投稿归档',
    styles: {
      default: {
        document: {
          run: {
            font: 'Noto Sans CJK SC',
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
            font: 'Noto Sans CJK SC',
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
            font: 'Noto Sans CJK SC',
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
        metadataLine('电子邮箱', submission.email),
        metadataLine('单位', submission.institution),
        metadataLine('职业阶段', value(CAREER_STAGES, submission.career_stage)),
        metadataLine('投稿题目', submission.contribution_title),
        metadataLine('研究方向', value(TRACKS, submission.research_area)),
        metadataLine('展示意向', value(PRESENTATIONS, submission.presentation_preference)),
        metadataLine('关键词', submission.keywords),
        metadataLine('当前状态', submission.status),
        sectionHeading('摘要'),
        new Paragraph({
          spacing: { after: 180, line: 300 },
          children: [new TextRun(submission.abstract_text || '—')]
        }),
        sectionHeading('附件记录'),
        ...fileLines,
        sectionHeading('同意记录'),
        metadataLine('同意时间', submission.consented_at)
      ]
    }]
  });

  return Packer.toBuffer(document);
}

export { CAREER_STAGES, PRESENTATIONS, TRACKS };
