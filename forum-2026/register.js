const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
  const status = document.getElementById('form-status');
  const submitButton = registrationForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector('span:first-child');
  const abstractField = registrationForm.elements.abstractText;
  const cvField = registrationForm.elements.cvFile;
  const figureField = registrationForm.elements.figureFile;
  const abstractCounter = document.getElementById('abstract-counter');
  const maxCvBytes = 10 * 1024 * 1024;
  const maxFigureBytes = 20 * 1024 * 1024;

  const getLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'zh';
  const countWords = (value) => value.trim() ? value.trim().split(/\s+/u).length : 0;

  const setStatus = (type, message) => {
    status.className = `form-status ${type}`;
    status.textContent = message;
  };

  const updateAbstractCounter = () => {
    const words = countWords(abstractField.value);
    const language = getLanguage();
    abstractCounter.textContent = language === 'en'
      ? `${words} / 300 Words`
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
        language === 'en' ? 'Please complete all required fields.' : '请完整填写所有必填项目。'
      );
      return;
    }

    if (abstractWords > 300) {
      setStatus(
        'error',
        language === 'en' ? 'The abstract must not exceed 300 words.' : '英文摘要不得超过 300 词。'
      );
      abstractField.focus();
      return;
    }

    if (cvField.files[0]?.size > maxCvBytes) {
      setStatus(
        'error',
        language === 'en' ? 'The CV must not exceed 10 MB.' : '个人简历不能超过 10 MB。'
      );
      cvField.focus();
      return;
    }

    if (figureField.files[0]?.size > maxFigureBytes) {
      setStatus(
        'error',
        language === 'en' ? 'The supplementary figure must not exceed 20 MB.' : '补充图表不能超过 20 MB。'
      );
      figureField.focus();
      return;
    }

    const data = new FormData(registrationForm);
    data.set('locale', language);

    submitButton.disabled = true;
    submitLabel.textContent = language === 'en'
      ? submitLabel.dataset.loadingEn
      : submitLabel.dataset.loadingZh;
    setStatus('loading', language === 'en' ? 'Uploading files and saving your submission…' : '正在上传文件并保存投稿…');

    try {
      const response = await fetch('/api/submit-abstract', {
        method: 'POST',
        body: data
      });
      const result = await response.json().catch(() => ({
        message: language === 'en'
          ? 'The server response could not be read. Please try again.'
          : '无法读取服务器响应，请稍后重试。'
      }));

      if (!response.ok) {
        throw new Error(result.message || (language === 'en' ? 'Submission failed. Please try again.' : '提交失败，请稍后重试。'));
      }

      registrationForm.reset();
      updateAbstractCounter();
      setStatus(
        'success',
        language === 'en'
          ? `Your abstract and files have been saved. Submission number: ${result.submissionId}.`
          : `投稿及文件已保存。您的投稿编号是 ${result.submissionId}，请妥善保存。`
      );
    } catch (error) {
      setStatus('error', error.message);
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = language === 'en'
        ? submitLabel.dataset.submitEn
        : submitLabel.dataset.submitZh;
    }
  });
}
