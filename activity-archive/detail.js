const records = {
  founding: {
    date: '2016年07月26日 15:38', category: '协会发展', location: '德国',
    title: '旅德华人医师学者协会注册大会胜利召开',
    summary: '协会完成正式注册与组织建设，为长期会员服务、学术活动和中德合作建立制度基础。',
    image: '../assets/images/activity-records/founding.jpg',
    source: '../SCDSG_articles/旅德华人医师学者协会注册大会胜利召开/index.html'
  },
  'forum-2016': {
    date: '2016年09月11日 23:33', category: '年度论坛', location: '大连',
    title: '旅德华人医师学者协会第一届国内高峰论坛研讨会顺利召开',
    summary: '协会首届国内高峰论坛连接在德会员、归国学者及国内合作伙伴，开启常态化国内学术交流。',
    image: '../assets/images/activity-records/forum-2016.jpg',
    source: '../SCDSG_articles/旅德华人医师学者协会第一届国内高峰论坛研讨会顺利召开/index.html'
  },
  'consulate-health': {
    date: '2017年06月28日 10:27', category: '医学科普', location: '法兰克福',
    title: '旅德华人医师学者协会在中国驻法兰克福总领事馆举办医学科普讲座',
    summary: '协会发挥医学专业优势，面向公众开展健康知识传播与医学科普。',
    image: '../assets/images/activity-records/consulate-health.jpg',
    source: '../SCDSG_articles/旅德华人医师学者协会在中国驻法兰克福总领事馆举办医学科普讲座/index.html'
  },
  'nct-run': {
    date: '2017年07月14日 09:51', category: '公益行动', location: '海德堡',
    title: '#NCT Lauf# 旅德华人医师学者协会公益跑专题报道',
    summary: '协会成员参加 NCT 公益跑，以行动支持癌症研究与健康倡导。',
    image: '../assets/images/activity-records/nct-run.jpg',
    source: '../SCDSG_articles/_NCT_Lauf__旅德华人医师学者协会公益跑专题报道/index.html'
  },
  'student-exchange-2017': {
    date: '2017年11月21日 16:00', category: '会员交流', location: '海德堡',
    title: 'SCDSG新老生交流会成功举办',
    summary: '新成员与协会前辈交流德国学习、科研和生活经验，建立同行支持网络。',
    image: '../assets/images/activity-records/student-exchange-2017.jpg',
    source: '../SCDSG_articles/SCDSG新老生交流会成功举办/index.html'
  },
  'hiv-lecture': {
    date: '2018年05月09日 19:31', category: '学术讲座', location: '德国',
    title: 'HIV组装过程研究及其对AIDS治疗的意义：HIV entry and exit 学术交流会总结',
    summary: '专题交流聚焦 HIV 进入、组装与释放过程及其对 AIDS 治疗研究的意义。',
    image: '../assets/images/activity-records/hiv-lecture.jpg',
    source: '../SCDSG_articles/HIV组装过程研究及其对AIDS治疗的意义_HIV_entry_and_exit_学术交流会总结/index.html'
  },
  'dna-lecture': {
    date: '2018年06月05日 21:58', category: '学术讲座', location: '德国',
    title: 'DNA微阵列基因表达数据分析——龙一族5月学术讲座总结',
    summary: '讲座围绕 DNA 微阵列与基因表达数据分析方法，分享科研实践与数据解读经验。',
    image: '../assets/images/activity-records/dna-lecture.jpg',
    source: '../SCDSG_articles/DNA微阵列基因表达数据分析__龙一族5月学术讲座总结/index.html'
  },
  'forum-2018': {
    date: '2018年11月14日 23:46', category: '年度论坛', location: '厦门',
    title: '旅德华人医师学者协会第二届国内学术研讨会（中国厦门）成功举办',
    summary: '第二届国内学术研讨会在厦门举行，继续推进中德医学与生命科学领域交流。',
    image: '../assets/images/activity-records/forum-2018.jpg',
    source: '../SCDSG_articles/旅德华人医师学者协会第二届国内学术研讨会（中国厦门）成功举办/index.html'
  },
  'single-cell': {
    date: '2019年09月07日 12:31', category: '学术讲座', location: '德国',
    title: '单细胞转录组测序——龙一族7月学术讲座总结',
    summary: '专题讲座介绍单细胞转录组测序的研究方法、分析思路与应用场景。',
    image: '../assets/images/activity-records/single-cell.jpg',
    source: '../SCDSG_articles/单细胞转录组测序__龙一族7月学术讲座总结/index.html'
  },
  'wuhan-aid': {
    date: '2020年01月25日 15:29', category: '公益行动', location: '武汉',
    title: '驰援武汉，龙一族在行动',
    summary: '面对突发公共卫生事件，协会会员组织支援行动与医疗物资相关工作。',
    image: '../assets/images/activity-records/wuhan-aid.jpg',
    source: '../SCDSG_articles/驰援武汉_龙一族在行动/index.html'
  },
  'wuhan-report': {
    date: '2020年03月30日 17:22', category: '公益行动', location: '武汉',
    title: '募捐公示：龙一族驰援武汉募捐项目阶段性公示（更新）',
    summary: '协会公布驰援武汉募捐项目的阶段性进展与执行记录。',
    image: '../assets/images/activity-records/wuhan-report.jpg',
    source: '../SCDSG_articles/募捐公示_龙一族驰援武汉募捐项目阶段性公示（更新）/index.html'
  },
  'forum-2023': {
    date: '2023年07月27日 03:18', category: '年度论坛', location: '温州',
    title: '闪耀！旅德华人医师学者协会第三届国内研讨会圆满落幕！',
    summary: '第三届国内研讨会在温州举行，连接海德堡与国内医学、生命科学合作网络。',
    image: '../assets/images/activity-records/forum-2023-collage.png',
    source: '../SCDSG_articles/闪耀_旅德华人医师学者协会第三届国内研讨会圆满落幕_/index.html'
  },
  'license-2024': {
    date: '2024年12月03日 09:00', category: '职业发展', location: '德国',
    title: '德国执业医师资格考试备考及德国从医经验分享交流会圆满结束',
    summary: '交流会梳理德国执业医师资格考试准备与临床工作经验，为青年医生提供职业参考。',
    image: '../assets/images/activity-records/license-2024.jpg',
    source: '../SCDSG_articles/德国执业医师资格考试备考及德国从医经验分享交流会圆满结束/index.html'
  },
  'hike-2025': {
    date: '2025年04月17日 14:00', category: '会员交流', location: '海德堡',
    title: '寻找春天｜海德堡哲学家小径徒步活动成功举办！',
    summary: '协会成员在哲学家小径开展春季徒步，在专业交流之外加强会员联系。',
    image: '../assets/images/activity-records/hike-2025.jpg',
    source: '../SCDSG_articles/寻找春天___海德堡哲学家小径徒步活动成功举办_/index.html'
  },
  'forum-2025': {
    date: '2025年09月02日 15:35', category: '年度论坛', location: '上海',
    title: '「十三载同心・筑梦再前行」第四届旅德华人医师学者协会学术研讨会暨2025海德堡龙一族学术交流会在沪圆满举行',
    summary: '第四届国内学术研讨会在上海举行，汇聚中德医学与生命科学研究者开展专题交流。',
    image: '../assets/images/activity-records/forum-2025.jpg',
    source: '../SCDSG_articles/_十三载同心_筑梦再前行_第四届旅德华人医师学者协会学术研讨会暨2025海德堡龙一族学术交流会在沪圆满举行/index.html'
  },
  'newcomer-2025': {
    date: '2025年12月02日 18:47', category: '会员交流', location: '海德堡',
    title: '【活动回顾】旅德华人医师学者协会2025新人交流会圆满落幕！刘海坤教授、孔波教授受聘协会顾问！',
    summary: '新人交流会帮助新成员了解协会、认识同行，并记录协会顾问聘任。',
    image: '../assets/images/activity-records/newcomer-2025.jpg',
    source: '../SCDSG_articles/_活动回顾_旅德华人医师学者协会2025新人交流会圆满落幕_刘海坤教授_孔波教授受聘协会顾问_/index.html'
  },
  'bioinformatics-radiotherapy': {
    date: '2025年12月19日 09:00', category: '学术讲座', location: '海德堡',
    title: '[活动回顾]当生信大神“遇见”放疗之钻，DKFZ 高被引学者顾祖光 & 质子重离子专家赵静芳重磅讲座圆满落幕！',
    summary: '跨学科讲座连接生物信息学与质子重离子放疗研究，呈现科研与临床转化对话。',
    image: '../assets/images/activity-records/bioinformatics-radiotherapy.jpg',
    source: '../SCDSG_articles/_活动回顾_当生信大神_遇见_放疗之钻_DKFZ_高被引学者顾祖光___质子重离子专家赵静芳重磅讲座圆满落幕_/index.html'
  },
  'heart-syndrome': {
    date: '2026年05月06日 08:00', category: '学术讲座', location: '海德堡',
    title: '【学术讲座回顾】周小波高级研究员解析心碎综合征发病机制',
    summary: '专题讲座聚焦心碎综合征发病机制、研究进展及其临床意义。',
    image: '../assets/images/activity-records/heart-syndrome.jpg',
    source: '../SCDSG_articles/_学术讲座回顾_周小波高级研究员解析心碎综合征发病机制/index.html'
  }
};

const requestedId = new URLSearchParams(location.search).get('id');
const record = records[requestedId];
const detail = document.getElementById('detail');

if (!record) {
  document.title = '活动未找到 | SCDSG';
  detail.innerHTML = '<div class="detail-meta">SCDSG · 活动档案</div><h1>未找到该活动记录</h1><p class="detail-lead">请返回活动列表选择其他记录。</p>';
} else {
  document.title = `${record.title} | SCDSG`;
  detail.innerHTML = `<div class="detail-meta">${record.category} · ${record.date} · ${record.location}</div><h1>${record.title}</h1><p class="detail-lead">${record.summary}</p><img class="detail-hero" src="${record.image}" alt="${record.title}"><a class="detail-source" href="${record.source}">查看完整活动报道 ↗</a>`;
}
