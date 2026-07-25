const KEYS = ['supabaseUrl', 'supabaseKey', 'storeId', 'storeName', 'messageTemplate', 'pollInterval'];

function showStatus(msg, type) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  setTimeout(() => { el.className = 'status-msg'; }, 4000);
}

// Load saved config into form
chrome.storage.local.get(KEYS, (result) => {
  if (result.supabaseUrl)      document.getElementById('supabaseUrl').value = result.supabaseUrl;
  if (result.supabaseKey)      document.getElementById('supabaseKey').value = result.supabaseKey;
  if (result.storeId)          document.getElementById('storeId').value = result.storeId;
  if (result.storeName)        document.getElementById('storeName').value = result.storeName;
  if (result.messageTemplate)  document.getElementById('messageTemplate').value = result.messageTemplate;
  if (result.pollInterval)     document.getElementById('pollInterval').value = result.pollInterval;
});

// Save
document.getElementById('saveBtn').addEventListener('click', () => {
  const data = {
    supabaseUrl:     document.getElementById('supabaseUrl').value.trim().replace(/\/$/, ''),
    supabaseKey:     document.getElementById('supabaseKey').value.trim(),
    storeId:         document.getElementById('storeId').value.trim(),
    storeName:       document.getElementById('storeName').value.trim(),
    messageTemplate: document.getElementById('messageTemplate').value.trim(),
    pollInterval:    parseInt(document.getElementById('pollInterval').value, 10)
  };

  if (!data.supabaseUrl || !data.supabaseKey || !data.storeId) {
    showStatus('Please fill in Supabase URL, Key, and Store ID.', 'error');
    return;
  }

  chrome.storage.local.set(data, () => {
    showStatus('Settings saved! Polling will restart automatically.', 'success');
  });
});

// Send test SMS via Google Voice
document.getElementById('sendTestBtn').addEventListener('click', async () => {
  const phone = document.getElementById('testPhone').value.trim();
  const template = document.getElementById('messageTemplate').value.trim() ||
    'Hi there, this is a test message from KitchenUnity Lead SMS! If you received this, the extension is working correctly.';
  const storeName = document.getElementById('storeName').value.trim() || 'our store';

  function showTestStatus(msg, type) {
    const el = document.getElementById('testStatusMsg');
    el.textContent = msg;
    el.className = `status-msg ${type}`;
    setTimeout(() => { el.className = 'status-msg'; }, 6000);
  }

  if (!phone) {
    showTestStatus('Enter a phone number first.', 'error');
    return;
  }

  // Find the Google Voice tab
  chrome.tabs.query({ url: 'https://voice.google.com/*' }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      showTestStatus('No Google Voice tab found. Open voice.google.com first.', 'error');
      return;
    }

    const message = template
      .replace(/\{name\}/gi, 'Test')
      .replace(/\{store\}/gi, storeName);

    showTestStatus('Sending...', '');

    chrome.tabs.sendMessage(tabs[0].id, { action: 'sendTestSMS', phone, message }, (response) => {
      if (chrome.runtime.lastError) {
        showTestStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      if (response && response.success) {
        showTestStatus('Test text sent! Check your phone.', 'success');
      } else {
        showTestStatus('Failed: ' + (response ? response.error : 'Unknown error'), 'error');
      }
    });
  });
});

// Test connection
document.getElementById('testBtn').addEventListener('click', async () => {
  const url = document.getElementById('supabaseUrl').value.trim().replace(/\/$/, '');
  const key = document.getElementById('supabaseKey').value.trim();
  const storeId = document.getElementById('storeId').value.trim();

  if (!url || !key || !storeId) {
    showStatus('Fill in all fields first.', 'error');
    return;
  }

  showStatus('Testing...', '');

  try {
    const resp = await fetch(
      `${url}/rest/v1/leads?store_id=eq.${storeId}&limit=1&select=id`,
      {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      showStatus(`Connected! Found ${data.length} lead(s) to verify access.`, 'success');
    } else {
      const err = await resp.text();
      showStatus(`Connection failed (${resp.status}): ${err}`, 'error');
    }
  } catch (e) {
    showStatus(`Error: ${e.message}`, 'error');
  }
});
