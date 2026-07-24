const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
  const status = document.getElementById('form-status');
  const submitButton = registrationForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector('span:first-child');

  const getLanguage = () => document.documentElement.lang === 'de' ? 'de' : 'zh';

  const setStatus = (type, message) => {
    status.className = `form-status ${type}`;
    status.textContent = message;
  };

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const language = getLanguage();

    if (!registrationForm.reportValidity()) {
      setStatus(
        'error',
        language === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus.' : '请完整填写所有必填项目。'
      );
      return;
    }

    const data = Object.fromEntries(new FormData(registrationForm).entries());
    data.consent = data.consent === 'true';
    data.locale = language;

    submitButton.disabled = true;
    submitLabel.textContent = language === 'de'
      ? submitLabel.dataset.loadingDe
      : submitLabel.dataset.loadingZh;
    setStatus('loading', language === 'de' ? 'Registrierung wird gespeichert…' : '正在保存报名信息…');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || (language === 'de' ? 'Registrierung fehlgeschlagen.' : '提交失败，请稍后重试。'));
      }

      registrationForm.reset();
      setStatus(
        'success',
        language === 'de'
          ? `Vielen Dank. Ihre Registrierungsnummer lautet ${result.registrationId}.`
          : `报名信息已保存。您的报名编号是 ${result.registrationId}，请妥善保存。`
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
