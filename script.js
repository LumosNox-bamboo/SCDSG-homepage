const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const languageButton = document.querySelector('.language-switch');
const timeline = document.querySelector('.timeline');

let language = 'zh';

function setLanguage(nextLanguage) {
  language = nextLanguage;
  root.lang = language === 'zh' ? 'zh-CN' : 'de';
  document.querySelectorAll('[data-zh][data-de]').forEach((element) => {
    element.textContent = element.dataset[language];
  });

  if (document.body.classList.contains('nav-open')) {
    const menuLabel = menuButton.querySelector('.sr-only');
    menuLabel.textContent = menuLabel.dataset[`${language}Close`];
  }

  if (languageButton) {
    const labels = languageButton.querySelectorAll('span:not([aria-hidden])');
    labels[0].classList.toggle('active', language === 'zh');
    labels[1].classList.toggle('active', language === 'de');
  }

  if (document.body.dataset.titleZh && document.body.dataset.titleDe) {
    document.title = language === 'zh' ? document.body.dataset.titleZh : document.body.dataset.titleDe;
  }

  const activeNode = document.querySelector('.city-chip.active');
  if (activeNode) updateNetwork(activeNode.dataset.node);
}

if (languageButton) {
  languageButton.addEventListener('click', () => setLanguage(language === 'zh' ? 'de' : 'zh'));
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

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

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
    titleDe: 'Heidelberg',
    zh: '协会发源地，也是德国部会员最集中的地区。',
    de: 'Ursprungsort der Gemeinschaft und Schwerpunkt des deutschen Netzwerks.'
  },
  berlin: {
    title: '柏林 Berlin',
    titleDe: 'Berlin',
    zh: '连接德国北部高校、研究机构与华人学者。',
    de: 'Verbindet Hochschulen, Forschungsinstitute und chinesische Forschende in Norddeutschland.'
  },
  hamburg: {
    title: '汉堡 Hamburg',
    titleDe: 'Hamburg',
    zh: '连接德国北部大学医院、生命科学研究机构与临床科研人才。',
    de: 'Verbindet Universitätsmedizin, Life-Science-Institute und klinische Forschung in Norddeutschland.'
  },
  hannover: {
    title: '汉诺威 Hannover',
    titleDe: 'Hannover',
    zh: '覆盖医学高校、临床研究和生物医学工程领域的专业连接。',
    de: 'Ein Knoten für Hochschulmedizin, klinische Forschung und biomedizinische Technik.'
  },
  cologne: {
    title: '科隆 Köln',
    titleDe: 'Köln',
    zh: '连接北威州高校、大学医院与生物医药产业网络。',
    de: 'Verbindet Hochschulen, Universitätskliniken und die Biomedizin in Nordrhein-Westfalen.'
  },
  frankfurt: {
    title: '法兰克福 Frankfurt',
    titleDe: 'Frankfurt',
    zh: '协会正式注册地，也是中德机构联络和跨境交流的重要门户。',
    de: 'Registrierungsort der SCDSG und wichtiges Tor für deutsch-chinesische institutionelle Kontakte.'
  },
  stuttgart: {
    title: '斯图加特 Stuttgart',
    titleDe: 'Stuttgart',
    zh: '连接巴登-符腾堡州医学、工程与产业转化资源。',
    de: 'Verbindet Medizin, Ingenieurwissenschaften und Translation in Baden-Württemberg.'
  },
  freiburg: {
    title: '弗赖堡 Freiburg',
    titleDe: 'Freiburg',
    zh: '延伸至德国西南部大学医学和生命科学研究网络。',
    de: 'Erweitert das Netzwerk in die Universitätsmedizin und Lebenswissenschaften Südwestdeutschlands.'
  },
  munich: {
    title: '慕尼黑 München',
    titleDe: 'München',
    zh: '汇聚大学医院、科研院所和生物技术产业的重要南部节点。',
    de: 'Ein süddeutscher Knoten für Universitätsmedizin, Forschung und Biotechnologie.'
  },
  beijing: {
    title: '北京 Beijing',
    titleDe: 'Beijing',
    zh: '连接国家级医学科研机构、医院与高校合作伙伴。',
    de: 'Verbindet nationale medizinische Forschungsinstitute, Kliniken und Hochschulpartner.'
  },
  shanghai: {
    title: '上海 Shanghai',
    titleDe: 'Shanghai',
    zh: '协会华东网络和第四届国内论坛的重要节点。',
    de: 'Zentraler Knoten des Ostchina-Netzwerks und Standort des vierten China-Forums.'
  },
  nanjing: {
    title: '南京 Nanjing',
    titleDe: 'Nanjing',
    zh: '连接江苏高校、医院及生物医药科研合作。',
    de: 'Verbindet Hochschulen, Kliniken und biomedizinische Kooperationen in Jiangsu.'
  },
  hangzhou: {
    title: '杭州 Hangzhou',
    titleDe: 'Hangzhou',
    zh: '华东地区生命科学、数字医疗和人才交流节点。',
    de: 'Ein Knoten für Life Sciences, digitale Medizin und Talentaustausch in Ostchina.'
  },
  wenzhou: {
    title: '温州 Wenzhou',
    titleDe: 'Wenzhou',
    zh: '第三届国内学术研讨会举办地，与温州医科大学系统保持联系。',
    de: 'Ort des dritten China-Forums mit Verbindungen zur Wenzhou Medical University.'
  },
  wuhan: {
    title: '武汉 Wuhan',
    titleDe: 'Wuhan',
    zh: '华中地区医学高校、医院与归国会员的重要联系节点。',
    de: 'Wichtiger Knoten für Hochschulmedizin, Kliniken und Rückkehrende in Zentralchina.'
  },
  xian: {
    title: '西安 Xi’an',
    titleDe: 'Xi’an',
    zh: '连接西北地区临床医学、高校与生命科学人才。',
    de: 'Verbindet klinische Medizin, Hochschulen und Life-Science-Talente in Nordwestchina.'
  },
  chengdu: {
    title: '成都 Chengdu',
    titleDe: 'Chengdu',
    zh: '西南地区医学科研、医院与产业合作节点。',
    de: 'Südwestchinesischer Knoten für medizinische Forschung, Kliniken und Industriekooperation.'
  },
  guangzhou: {
    title: '广州 Guangzhou',
    titleDe: 'Guangzhou',
    zh: '连接华南高校、附属医院和生物医药合作伙伴。',
    de: 'Verbindet Hochschulen, Universitätskliniken und Biomedizin-Partner in Südchina.'
  },
  xiamen: {
    title: '厦门 Xiamen',
    titleDe: 'Xiamen',
    zh: '第二届国内年会暨学术研讨会举办地。',
    de: 'Austragungsort des zweiten China-Jahrestreffens und Fachforums.'
  },
  dalian: {
    title: '大连 Dalian',
    titleDe: 'Dalian',
    zh: '2016 年第一届国内高峰论坛研讨会举办地。',
    de: 'Austragungsort des ersten SCDSG-Forums in China im Jahr 2016.'
  },
  qingdao: {
    title: '青岛 Qingdao',
    titleDe: 'Qingdao',
    zh: '连接山东地区大学医院、临床研究与会员网络。',
    de: 'Verbindet Universitätskliniken, klinische Forschung und Mitglieder in Shandong.'
  }
};

function updateNetwork(node) {
  const content = networkContent[node];
  if (!content) return;
  document.getElementById('network-title').textContent = language === 'zh' ? content.title : content.titleDe;
  const description = document.getElementById('network-description');
  description.textContent = content[language];
  description.dataset.zh = content.zh;
  description.dataset.de = content.de;
}

document.querySelectorAll('.city-chip').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.city-chip').forEach((node) => node.classList.remove('active'));
    document.querySelectorAll('.map-point').forEach((point) => point.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`.map-point[data-node="${button.dataset.node}"]`)?.classList.add('active');
    updateNetwork(button.dataset.node);
  });
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
