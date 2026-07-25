document.getElementById('optionsLink').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.local.get(
  ['supabaseUrl', 'supabaseKey', 'storeId', 'lastCheckedAt', 'lastSentLead', 'textsSentToday', 'textsSentDate'],
  (result) => {
    const body = document.getElementById('body');
    const isConfigured = result.supabaseUrl && result.supabaseKey && result.storeId;

    if (!isConfigured) {
      body.innerHTML = `
        <div class="status-row inactive">
          <div class="dot red"></div>
          Not configured
        </div>
        <p class="not-configured">
          Click "Open Settings" below to enter your Supabase connection details.
        </p>
      `;
      return;
    }

    const today = new Date().toDateString();
    const sentToday = result.textsSentDate === today ? (result.textsSentToday || 0) : 0;

    const lastCheck = result.lastCheckedAt
      ? new Date(result.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Not yet';

    let lastSentHtml = `<div class="last-sent">
      <div class="last-sent-label">Last text sent</div>
      <div class="last-sent-name" style="color:#9ca3af">None yet this session</div>
    </div>`;

    if (result.lastSentLead) {
      const t = new Date(result.lastSentLead.time);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lastSentHtml = `<div class="last-sent">
        <div class="last-sent-label">Last text sent</div>
        <div class="last-sent-name">${result.lastSentLead.name}</div>
        <div class="last-sent-time">${timeStr}</div>
      </div>`;
    }

    body.innerHTML = `
      <div class="status-row active">
        <div class="dot green"></div>
        Active — polling every 30s
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="stat-num">${sentToday}</div>
          <div class="stat-label">Texts today</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="font-size:13px;padding-top:4px;">${lastCheck}</div>
          <div class="stat-label">Last checked</div>
        </div>
      </div>

      ${lastSentHtml}
    `;
  }
);
