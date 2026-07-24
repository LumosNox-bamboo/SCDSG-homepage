const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
  const status = document.getElementById('form-status');
  const submitButton = registrationForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector('span:first-child');
  const abstractField = registrationForm.elements.abstractText;
  const abstractCounter = document.getElementById('abstract-counter');

  const getLanguage = () => document.documentElement.lang === 'de' ? 'de' : 'zh';
  const countWords = (value) => value.trim() ? value.trim().split(/\s+/u).length : 0;

  const setStatus = (type, message) => {
    status.className = `form-status ${type}`;
    status.textContent = message;
  };

  const updateAbstractCounter = () => {
    const words = countWords(abstractField.value);
    const language = getLanguage();
    abstractCounter.textContent = language === 'de'
      ? `${words} / 300 Wörter`
      : `${words} / 300 词`;
    abstractCounter.classList.toggle('limit-exceeded', words > 300);
  };

  abstractField.addEventListener('input', updateAbstractCounter);
  document.querySelector('.language-switch')?.addEventListener('click', updateAbstractCounter);

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const language = getLanguage();
    const abstractWords = countWords(abstractField.value);

    if (!registrationForm.reportValidity()) {
      setStatus(
        'error',
        language === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus.' : '请完整填写所有必填项目。'
      );
      return;
    }

    if (abstractWords > 300) {
      setStatus(
        'error',
        language === 'de' ? 'Das Abstract darf maximal 300 Wörter enthalten.' : '英文摘要不得超过 300 词。'
      );
      abstractField.focus();
      return;
    }

    const data = new FormData(registrationForm);
    data.set('locale', language);

    submitButton.disabled = true;
    submitLabel.textContent = language === 'de'
      ? submitLabel.dataset.loadingDe
      : submitLabel.dataset.loadingZh;
    setStatus('loading', language === 'de' ? 'Dateien und Abstract werden gespeichert…' : '正在上传文件并保存投稿…');

    try {
      const response = await fetch('/api/submit-abstract', {
        method: 'POST',
        body: data
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || (language === 'de' ? 'Einreichung fehlgeschlagen.' : '提交失败，请稍后重试。'));
      }

      registrationForm.reset();
      updateAbstractCounter();
      setStatus(
        'success',
        language === 'de'
          ? `Ihr Abstract wurde gespeichert. Einreichungsnummer: ${result.submissionId}. Lebenslauf und Abbildung werden später ergänzt.`
          : `投稿文字信息已保存。您的投稿编号是 ${result.submissionId}。简历和图片将在文件功能开放后补交。`
      );
    } catch (error) {
      setStatus('error', error.message);
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = language === 'de'
        ? submitLabel.dataset.submitDe
        : submitLabel.dataset.submitZh;
    }
  });
}
