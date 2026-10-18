(() => {
  const form = document.getElementById('doctor-booking-form');
  const symptoms = document.getElementById('symptom-text');
  const summary = document.getElementById('symptom-summary');
  const button = document.getElementById('summarise-symptoms');
  const notice = document.getElementById('symptom-ai-notice');
  if (!button || !symptoms || !summary) return;
  button.addEventListener('click', async () => {
    const text = symptoms.value.trim();
    if (text.length < 10) {
      notice.textContent = 'Please describe the reason for the appointment in a little more detail first.';
      notice.classList.add('show');
      return;
    }
    button.disabled = true;
    button.textContent = 'Preparing summary…';
    notice.textContent = 'Creating a plain-language summary. This does not diagnose symptoms.';
    notice.classList.add('show');
    try {
      const response = await fetch('/api/appointments/symptom-summary', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({symptoms: text})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The summary is unavailable right now.');
      summary.value = data.summary || '';
      notice.textContent = data.disclaimer || 'AI-generated summary. Review and edit before submitting.';
    } catch (error) {
      notice.textContent = error.message || 'AI summary unavailable. You can still submit your own description.';
    } finally {
      button.disabled = false;
      button.textContent = 'Summarise with AI';
    }
  });
  form?.addEventListener('submit', event => {
    if (!symptoms.value.trim()) {
      event.preventDefault();
      symptoms.focus();
    }
  });
})();
