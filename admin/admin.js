const state = {
  submissions: [],
  filtered: [],
  selected: new Set(),
  exporting: false
};

const list = document.querySelector('#submission-list');
const count = document.querySelector('#submission-count');
const selectedCount = document.querySelector('#selected-count');
const identity = document.querySelector('#admin-identity');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const selectAll = document.querySelector('#select-all');
const exportButton = document.querySelector('#export');

function text(value) {
  return String(value ?? '');
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? text(value)
    : new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Berlin'
      }).format(date);
}

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function updateControls() {
  selectedCount.textContent = state.selected.size;
  exportButton.disabled = !state.selected.size || state.exporting;
  exportButton.textContent = state.exporting ? '正在准备…' : '下载所选 ZIP';
  selectAll.disabled = state.exporting || !state.filtered.length;
}

function cell(primary, secondary = '') {
  const td = document.createElement('td');
  const strong = document.createElement('strong');
  strong.textContent = primary;
  td.append(strong);
  if (secondary) {
    const small = document.createElement('small');
    small.textContent = secondary;
    td.append(small);
  }
  return td;
}

function render() {
  list.replaceChildren();
  if (!state.filtered.length) {
    const row = document.createElement('tr');
    row.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = state.submissions.length ? '没有符合搜索条件的投稿。' : '暂无投稿。';
    row.append(td);
    list.append(row);
    updateControls();
    return;
  }

  for (const submission of state.filtered) {
    const row = document.createElement('tr');
    const selectCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.selected.has(submission.submission_code);
    checkbox.setAttribute('aria-label', `选择 ${submission.submission_code}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) state.selected.add(submission.submission_code);
      else state.selected.delete(submission.submission_code);
      updateControls();
    });
    selectCell.append(checkbox);
    row.append(
      selectCell,
      cell(submission.submission_code, formatDate(submission.created_at)),
      cell(submission.full_name, submission.institution),
      cell(submission.contribution_title, submission.research_area),
      cell(submission.presentation_preference, submission.status),
      cell(`${submission.file_count} 个`, submission.figure_count ? '含补充图表' : '仅简历')
    );
    row.lastElementChild.classList.add('attachment-count');
    list.append(row);
  }
  updateControls();
}

function filter() {
  const query = search.value.trim().toLocaleLowerCase('zh-CN');
  state.filtered = query
    ? state.submissions.filter((submission) => [
        submission.submission_code,
        submission.full_name,
        submission.institution,
        submission.contribution_title,
        submission.research_area
      ].some((value) => text(value).toLocaleLowerCase('zh-CN').includes(query)))
    : [...state.submissions];
  render();
}

async function loadSubmissions() {
  setStatus('正在读取投稿记录…');
  try {
    const response = await fetch('/admin/api/submissions', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '读取失败。');
    state.submissions = result.submissions || [];
    state.filtered = [...state.submissions];
    count.textContent = state.submissions.length;
    identity.textContent = `当前管理员：${result.administrator}`;
    setStatus('');
    render();
  } catch (error) {
    count.textContent = '—';
    identity.textContent = '管理员验证或数据读取失败';
    setStatus(error instanceof Error ? error.message : '读取失败。', true);
    render();
  }
}

search.addEventListener('input', filter);
selectAll.addEventListener('click', () => {
  const visibleCodes = state.filtered.map((submission) => submission.submission_code);
  const allSelected = visibleCodes.every((code) => state.selected.has(code));
  for (const code of visibleCodes) {
    if (allSelected) state.selected.delete(code);
    else state.selected.add(code);
  }
  render();
});

exportButton.addEventListener('click', () => {
  state.exporting = true;
  updateControls();
  setStatus(`正在整理 ${state.selected.size} 份投稿，请保持页面打开…`);
  const form = document.createElement('form');
  const input = document.createElement('input');
  form.method = 'post';
  form.action = '/admin/api/export';
  form.target = 'download-frame';
  form.hidden = true;
  input.type = 'hidden';
  input.name = 'submissionCodes';
  input.value = JSON.stringify([...state.selected]);
  form.append(input);
  document.body.append(form);
  form.submit();
  form.remove();
  window.setTimeout(() => {
    state.exporting = false;
    updateControls();
    setStatus('下载请求已提交；浏览器将在文件准备完成后开始下载。');
  }, 1200);
});

loadSubmissions();
