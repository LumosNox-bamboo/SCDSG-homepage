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

  const activeNode = document.querySelector('.map-node.active');
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
  europe: {
    title: '欧洲 Europe',
    titleDe: 'Europa',
    zh: '会员与合作伙伴分布于英国、法国、荷兰等多个国家。',
    de: 'Mitglieder und Partner sind unter anderem in Großbritannien, Frankreich und den Niederlanden aktiv.'
  },
  china: {
    title: '中国部 China',
    titleDe: 'China-Netzwerk',
    zh: '归国会员遍布医院、医学院与科研院所，并设有地区联络人。',
    de: 'Rückkehrende Mitglieder arbeiten in Kliniken, medizinischen Fakultäten und Forschungseinrichtungen.'
  },
  east: {
    title: '华东 Ostchina',
    titleDe: 'Ostchina',
    zh: '上海、浙江、江苏等地是国内论坛与人才交流的重要节点。',
    de: 'Shanghai, Zhejiang und Jiangsu sind zentrale Orte für Foren und Karriereaustausch.'
  },
  south: {
    title: '华南 Südchina',
    titleDe: 'Südchina',
    zh: '与广东、福建等地高校和附属医院保持人才与学术联系。',
    de: 'Enge Verbindungen zu Hochschulen und Universitätskliniken in Guangdong und Fujian.'
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

document.querySelectorAll('.map-node').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.map-node').forEach((node) => node.classList.remove('active'));
    button.classList.add('active');
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
