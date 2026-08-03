const state = {
  submissions: [],
  filtered: [],
  selected: new Set(),
  exporting: false,
  deleting: false
};

const list = document.querySelector('#submission-list');
const count = document.querySelector('#submission-count');
const selectedCount = document.querySelector('#selected-count');
const identity = document.querySelector('#admin-identity');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const selectAll = document.querySelector('#select-all');
const exportButton = document.querySelector('#export');
const deleteButton = document.querySelector('#delete-selected');

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
  const busy = state.exporting || state.deleting;
  selectedCount.textContent = state.selected.size;
  exportButton.disabled = !state.selected.size || busy;
  exportButton.textContent = state.exporting ? '正在准备…' : '下载所选 ZIP';
  deleteButton.disabled = !state.selected.size || busy;
  deleteButton.textContent = state.deleting ? '正在删除…' : '删除所选';
  selectAll.disabled = busy || !state.filtered.length;
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

const EMAIL_STATUS_LABELS = {
  sent: '已发出',
  failed: '发送失败',
  unavailable: '发信服务不可用',
  pending: '正在发送',
  not_provided: '未填写',
  legacy_unknown: '历史记录未追踪'
};

function confirmationCell(submission) {
  const td = document.createElement('td');
  const primaryStatus = submission.confirmation_email_1_status || 'legacy_unknown';
  const secondaryStatus = submission.confirmation_email_2_status || 'not_provided';
  const badge = document.createElement('strong');
  const anySent = Number(submission.confirmation_any_sent) === 1;
  const completedWithoutSuccess = ['failed', 'unavailable'].includes(primaryStatus) &&
    ['failed', 'unavailable', 'not_provided'].includes(secondaryStatus);
  const legacyRecord = primaryStatus === 'legacy_unknown';

  badge.className = `delivery-badge ${anySent ? 'sent' : completedWithoutSuccess ? 'failed' : 'pending'}`;
  badge.textContent = anySent
    ? '✓ 至少一个已发出'
    : completedWithoutSuccess
      ? '需人工联系'
      : legacyRecord
        ? '历史记录'
        : '待确认';
  td.append(badge);

  const addresses = [
    ['邮箱 1', submission.email, primaryStatus, submission.confirmation_email_1_channel],
    ['邮箱 2', submission.email_secondary, secondaryStatus, submission.confirmation_email_2_channel]
  ];
  for (const [label, address, deliveryStatus, channel] of addresses) {
    const small = document.createElement('small');
    const detail = EMAIL_STATUS_LABELS[deliveryStatus] || deliveryStatus;
    small.textContent = `${label}：${address || '—'} · ${detail}${channel ? ` · ${channel}` : ''}`;
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
    td.colSpan = 7;
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
      confirmationCell(submission),
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
        submission.email,
        submission.email_secondary,
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

deleteButton.addEventListener('click', async () => {
  const submissionCodes = [...state.selected];
  const confirmed = window.confirm(
    `确定删除所选 ${submissionCodes.length} 份投稿吗？\n\n它们将从管理列表和批量导出中隐藏，私有附件暂时保留以便误删恢复。`
  );
  if (!confirmed) return;

  state.deleting = true;
  updateControls();
  setStatus(`正在删除 ${submissionCodes.length} 份投稿…`);
  try {
    const response = await fetch('/admin/api/delete', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ submissionCodes })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '删除失败。');

    const deleted = new Set(result.deletedSubmissionCodes || []);
    state.submissions = state.submissions.filter(
      (submission) => !deleted.has(submission.submission_code)
    );
    state.selected.clear();
    count.textContent = state.submissions.length;
    filter();
    setStatus(`已删除 ${deleted.size} 份投稿；附件已私有保留以便误删恢复。`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '删除失败。', true);
  } finally {
    state.deleting = false;
    updateControls();
  }
});

loadSubmissions();
