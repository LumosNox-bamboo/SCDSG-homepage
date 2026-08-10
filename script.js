const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const languageButton = document.querySelector('.language-switch');
const timeline = document.querySelector('.timeline');

let language = 'zh';

function setLanguage(nextLanguage) {
  language = nextLanguage;
  root.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-zh][data-en]').forEach((element) => {
    element.textContent = element.dataset[language];
  });

  if (document.body.classList.contains('nav-open')) {
    const menuLabel = menuButton.querySelector('.sr-only');
    menuLabel.textContent = menuLabel.dataset[`${language}Close`];
  }

  if (languageButton) {
    const labels = languageButton.querySelectorAll('span:not([aria-hidden])');
    labels[0].classList.toggle('active', language === 'zh');
    labels[1].classList.toggle('active', language === 'en');
  }

  if (document.body.dataset.titleZh && document.body.dataset.titleEn) {
    document.title = language === 'zh' ? document.body.dataset.titleZh : document.body.dataset.titleEn;
  }

  const activeNode = document.querySelector('.city-chip.active');
  if (activeNode) updateNetwork(activeNode.dataset.node);
}

if (languageButton) {
  languageButton.addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh'));
}

if (menuButton) {
  menuButton.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    const label = menuButton.querySelector('.sr-only');
    label.textContent = isOpen ? label.dataset[`${language}Close`] : label.dataset[language];
  });
}

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.querySelector('.sr-only').textContent = menuButton.querySelector('.sr-only').dataset[language];
    }
  });
});

if (header) {
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => {
  element.classList.add('reveal-pending');
  revealObserver.observe(element);
});

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const end = Number(element.dataset.count);
    const duration = 1100;
    const started = performance.now();

    function tick(now) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(end * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    countObserver.unobserve(element);
  });
}, { threshold: 0.7 });

document.querySelectorAll('[data-count]').forEach((element) => countObserver.observe(element));

const timelinePrev = document.querySelector('.timeline-prev');
const timelineNext = document.querySelector('.timeline-next');
if (timeline && timelinePrev && timelineNext) {
  timelinePrev.addEventListener('click', () => timeline.scrollBy({ left: -310, behavior: 'smooth' }));
  timelineNext.addEventListener('click', () => timeline.scrollBy({ left: 310, behavior: 'smooth' }));
}

document.querySelectorAll('[data-filter-group] button').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.closest('[data-filter-group]');
    const targetSelector = group.dataset.filterGroup;
    group.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const category = button.dataset.filter;

    document.querySelectorAll(targetSelector).forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

const networkContent = {
  heidelberg: {
    title: '海德堡 Heidelberg',
    titleEn: 'Heidelberg',
    zh: '海德堡是协会发源地，也是德国会员最集中的地区。',
    en: 'Birthplace of the association and a central hub of its German member network.'
  },
  berlin: {
    title: '柏林 Berlin',
    titleEn: 'Berlin',
    zh: '连接德国北部高校、研究机构与华人学者。',
    en: 'Connects universities, research institutes and Chinese scholars in northern Germany.'
  },
  hamburg: {
    title: '汉堡 Hamburg',
    titleEn: 'Hamburg',
    zh: '连接德国北部大学医院、生命科学研究机构与临床科研人才。',
    en: 'Connects university hospitals, life-science institutes and clinical researchers in northern Germany.'
  },
  hannover: {
    title: '汉诺威 Hannover',
    titleEn: 'Hanover',
    zh: '覆盖医学高校、临床研究和生物医学工程领域的专业连接。',
    en: 'A professional hub for academic medicine, clinical research and biomedical engineering.'
  },
  cologne: {
    title: '科隆 Köln',
    titleEn: 'Cologne',
    zh: '连接北威州高校、大学医院与生物医药产业网络。',
    en: 'Connects universities, university hospitals and biomedical networks in North Rhine-Westphalia.'
  },
  frankfurt: {
    title: '法兰克福 Frankfurt',
    titleEn: 'Frankfurt',
    zh: '协会正式注册地，也是中德机构联络和跨境交流的重要门户。',
    en: 'The association’s place of registration and an important gateway for Sino-German institutional exchange.'
  },
  stuttgart: {
    title: '斯图加特 Stuttgart',
    titleEn: 'Stuttgart',
    zh: '连接巴登-符腾堡州医学、工程与产业转化资源。',
    en: 'Connects medicine, engineering and translational resources across Baden-Württemberg.'
  },
  freiburg: {
    title: '弗赖堡 Freiburg',
    titleEn: 'Freiburg',
    zh: '延伸至德国西南部大学医学和生命科学研究网络。',
    en: 'Extends the network across academic medicine and life-science research in south-western Germany.'
  },
  munich: {
    title: '慕尼黑 München',
    titleEn: 'Munich',
    zh: '汇聚大学医院、科研院所和生物技术产业的重要南部节点。',
    en: 'A major southern hub for university medicine, research institutes and biotechnology.'
  },
  beijing: {
    title: '北京 Beijing',
    titleEn: 'Beijing',
    zh: '连接国家级医学科研机构、医院与高校合作伙伴。',
    en: 'Connects national medical research institutes, hospitals and university partners.'
  },
  shanghai: {
    title: '上海 Shanghai',
    titleEn: 'Shanghai',
    zh: '协会华东网络和第四届国内论坛的重要节点。',
    en: 'A central hub in eastern China and host city of the fourth SCDSG forum in China.'
  },
  nanjing: {
    title: '南京 Nanjing',
    titleEn: 'Nanjing',
    zh: '连接江苏高校、医院及生物医药科研合作。',
    en: 'Connects universities, hospitals and biomedical research collaboration across Jiangsu.'
  },
  hangzhou: {
    title: '杭州 Hangzhou',
    titleEn: 'Hangzhou',
    zh: '华东地区生命科学、数字医疗和人才交流节点。',
    en: 'An eastern China hub for the life sciences, digital medicine and professional exchange.'
  },
  wenzhou: {
    title: '温州 Wenzhou',
    titleEn: 'Wenzhou',
    zh: '第三届国内学术研讨会举办地，与温州医科大学系统保持联系。',
    en: 'Host city of the third SCDSG forum in China, with links to Wenzhou Medical University.'
  },
  wuhan: {
    title: '武汉 Wuhan',
    titleEn: 'Wuhan',
    zh: '华中地区医学高校、医院与归国会员的重要联系节点。',
    en: 'An important central-China hub connecting academic medicine, hospitals and returned members.'
  },
  xian: {
    title: '西安 Xi’an',
    titleEn: 'Xi’an',
    zh: '连接西北地区临床医学、高校与生命科学人才。',
    en: 'Connects clinical medicine, universities and life-science professionals in north-western China.'
  },
  chengdu: {
    title: '成都 Chengdu',
    titleEn: 'Chengdu',
    zh: '西南地区医学科研、医院与产业合作节点。',
    en: 'A south-western hub for medical research, hospitals and industry collaboration.'
  },
  guangzhou: {
    title: '广州 Guangzhou',
    titleEn: 'Guangzhou',
    zh: '连接华南高校、附属医院和生物医药合作伙伴。',
    en: 'Connects universities, affiliated hospitals and biomedical partners in southern China.'
  },
  xiamen: {
    title: '厦门 Xiamen',
    titleEn: 'Xiamen',
    zh: '第二届国内年会暨学术研讨会举办地。',
    en: 'Host city of the second SCDSG annual meeting and academic symposium in China.'
  },
  dalian: {
    title: '大连 Dalian',
    titleEn: 'Dalian',
    zh: '2016 年第一届国内高峰论坛研讨会举办地。',
    en: 'Host city of the first SCDSG forum in China in 2016.'
  },
  qingdao: {
    title: '青岛 Qingdao',
    titleEn: 'Qingdao',
    zh: '连接山东地区大学医院、临床研究与会员网络。',
    en: 'Connects university hospitals, clinical research and member networks across Shandong.'
  }
};

document.querySelectorAll('.city-chip, .map-point').forEach((control) => {
  const label = control.classList.contains('map-point') ? control.querySelector('.map-label') : control;
  const content = networkContent[control.dataset.node];
  if (!label || !content) return;
  label.dataset.zh = label.textContent;
  label.dataset.en = content.titleEn;
});

function updateNetwork(node) {
  const content = networkContent[node];
  if (!content) return;
  document.getElementById('network-title').textContent = language === 'zh' ? content.title : content.titleEn;
  const description = document.getElementById('network-description');
  description.textContent = content[language];
  description.dataset.zh = content.zh;
  description.dataset.en = content.en;
}

function selectNetworkNode(node) {
  document.querySelectorAll('.city-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.node === node));
  document.querySelectorAll('.map-point').forEach((point) => point.classList.toggle('active', point.dataset.node === node));
  updateNetwork(node);
}

document.querySelectorAll('.city-chip, .map-point').forEach((button) => {
  button.addEventListener('click', () => selectNetworkNode(button.dataset.node));
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = document.querySelector('.hero');
  const orbit = document.querySelector('.hero-orbit');
  if (hero && orbit) {
    hero.addEventListener('pointermove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 12;
      orbit.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }
}
