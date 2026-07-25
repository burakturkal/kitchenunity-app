// KitchenUnity Lead SMS - Content Script
// Runs on voice.google.com, polls Supabase for new leads, auto-texts via GV

const POLL_INTERVAL_DEFAULT = 30000; // 30 seconds
let pollingTimer = null;
let isCurrentlySending = false;

// ─── Shadow DOM traversal ────────────────────────────────────────────────────
// Google Voice uses Polymer Web Components with deep shadow roots.
// Standard querySelector won't find elements inside shadow DOM.

function deepQuery(root, selector) {
  if (!root) return null;
  const el = root.querySelector(selector);
  if (el) return el;
  const all = root.querySelectorAll('*');
  for (const host of all) {
    if (host.shadowRoot) {
      const found = deepQuery(host.shadowRoot, selector);
      if (found) return found;
    }
  }
  return null;
}

function deepQueryAll(root, selector) {
  const results = [];
  if (!root) return results;
  const direct = root.querySelectorAll(selector);
  results.push(...direct);
  const all = root.querySelectorAll('*');
  for (const host of all) {
    if (host.shadowRoot) {
      results.push(...deepQueryAll(host.shadowRoot, selector));
    }
  }
  return results;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateInput(element, value) {
  // React/Angular controlled inputs need native value setter + events
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  );
  if (nativeInputValueSetter) {
    nativeInputValueSetter.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function simulateTextareaInput(element, value) {
  const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  );
  if (nativeTextareaSetter) {
    nativeTextareaSetter.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function pressEnter(element) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
}

// ─── Config loading ───────────────────────────────────────────────────────────

async function getConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(
      ['supabaseUrl', 'supabaseKey', 'storeId', 'messageTemplate', 'storeName', 'pollInterval'],
      resolve
    );
  });
}

async function getSentLeadIds() {
  return new Promise(resolve => {
    chrome.storage.local.get(['sentLeadIds'], result => {
      resolve(result.sentLeadIds || []);
    });
  });
}

async function markLeadAsSent(leadId, leadName) {
  const sentLeadIds = await getSentLeadIds();
  sentLeadIds.push(leadId);

  // Keep only last 500 IDs to avoid unbounded storage growth
  const trimmed = sentLeadIds.slice(-500);

  const lastSent = { id: leadId, name: leadName, time: new Date().toISOString() };
  const today = new Date().toDateString();

  return new Promise(resolve => {
    chrome.storage.local.get(['textsSentToday', 'textsSentDate'], result => {
      const isToday = result.textsSentDate === today;
      const count = isToday ? (result.textsSentToday || 0) + 1 : 1;
      chrome.storage.local.set({
        sentLeadIds: trimmed,
        lastSentLead: lastSent,
        textsSentToday: count,
        textsSentDate: today
      }, resolve);
    });
  });
}

// ─── Supabase polling ─────────────────────────────────────────────────────────

async function fetchNewLeads(config, since) {
  const url = new URL(`${config.supabaseUrl}/rest/v1/leads`);
  url.searchParams.set('store_id', `eq.${config.storeId}`);
  url.searchParams.set('created_at', `gt.${since}`);
  url.searchParams.set('phone', 'not.is.null');
  url.searchParams.set('order', 'created_at.asc');
  url.searchParams.set('select', 'id,name,phone,created_at');

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': config.supabaseKey,
      'Authorization': `Bearer ${config.supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

// ─── Google Voice automation ──────────────────────────────────────────────────

async function sendTextViaGoogleVoice(phone, message) {
  console.log(`[KU SMS] Attempting to send text to ${phone}`);

  // Step 1: Find and click the compose / new conversation button
  const composeSelectors = [
    '[aria-label="New conversation"]',
    '[aria-label="Start new conversation"]',
    '[aria-label="New message"]',
    'gv-icon-button[icon="create"]',
    '[data-e2eid="new-conversation-button"]',
    'md-fab',
    'paper-fab'
  ];

  let composeBtn = null;
  for (const sel of composeSelectors) {
    composeBtn = deepQuery(document, sel);
    if (composeBtn) break;
  }

  if (!composeBtn) {
    // Try finding any button/FAB in the left nav area
    const allButtons = deepQueryAll(document, 'button, gv-icon-button, paper-fab, md-fab');
    for (const btn of allButtons) {
      const label = btn.getAttribute('aria-label') || btn.textContent || '';
      if (/new|compose|create|message/i.test(label)) {
        composeBtn = btn;
        break;
      }
    }
  }

  if (!composeBtn) {
    throw new Error('Could not find compose button on Google Voice page');
  }

  composeBtn.click();
  await sleep(1000);

  // Step 2: Find the recipient / phone number input
  const recipientSelectors = [
    'input[aria-label*="phone" i]',
    'input[aria-label*="name" i]',
    'input[placeholder*="phone" i]',
    'input[placeholder*="name" i]',
    'gv-recipient-input input',
    '[data-e2eid="recipient-input"] input',
    'input[type="tel"]'
  ];

  let recipientInput = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    for (const sel of recipientSelectors) {
      recipientInput = deepQuery(document, sel);
      if (recipientInput && recipientInput.offsetParent !== null) break;
    }
    if (recipientInput) break;
    await sleep(300);
  }

  if (!recipientInput) {
    throw new Error('Could not find recipient input field');
  }

  recipientInput.focus();
  simulateInput(recipientInput, phone);
  await sleep(500);
  pressEnter(recipientInput);
  await sleep(800);

  // Step 3: Find the message input
  const messageSelectors = [
    'textarea[aria-label*="message" i]',
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="text" i]',
    '[contenteditable][aria-label*="message" i]',
    '[contenteditable][aria-label*="text" i]',
    'gv-message-input textarea',
    '[data-e2eid="message-input"] textarea',
    'textarea'
  ];

  let messageInput = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    for (const sel of messageSelectors) {
      const el = deepQuery(document, sel);
      if (el && el.offsetParent !== null) {
        messageInput = el;
        break;
      }
    }
    if (messageInput) break;
    await sleep(300);
  }

  if (!messageInput) {
    throw new Error('Could not find message input field');
  }

  messageInput.focus();

  if (messageInput.tagName === 'TEXTAREA') {
    simulateTextareaInput(messageInput, message);
  } else {
    // contenteditable div
    messageInput.textContent = message;
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  await sleep(400);
  pressEnter(messageInput);
  await sleep(600);

  console.log(`[KU SMS] Text sent to ${phone}`);
  return true;
}

// ─── Main poll function ───────────────────────────────────────────────────────

async function pollForNewLeads() {
  if (isCurrentlySending) return; // Don't overlap if previous send is still running

  const config = await getConfig();

  if (!config.supabaseUrl || !config.supabaseKey || !config.storeId) {
    console.log('[KU SMS] Not configured yet. Open extension options to set up.');
    return;
  }

  try {
    // Look back 5 minutes on first run, then use actual last-check time
    const stored = await new Promise(resolve =>
      chrome.storage.local.get(['lastCheckedAt'], resolve)
    );
    const since = stored.lastCheckedAt || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const leads = await fetchNewLeads(config, since);

    // Update last checked timestamp
    chrome.storage.local.set({ lastCheckedAt: new Date().toISOString() });

    if (!leads || leads.length === 0) return;

    const sentLeadIds = await getSentLeadIds();
    const newLeads = leads.filter(l => !sentLeadIds.includes(l.id));

    if (newLeads.length === 0) return;

    console.log(`[KU SMS] Found ${newLeads.length} new lead(s) to text`);
    isCurrentlySending = true;

    for (const lead of newLeads) {
      try {
        const firstName = (lead.name || '').split(' ')[0] || 'there';
        const storeName = config.storeName || 'our store';
        const template = config.messageTemplate ||
          'Hi {name}, thanks for your interest in {store}! We received your info and will be in touch shortly.';

        const message = template
          .replace(/\{name\}/gi, firstName)
          .replace(/\{store\}/gi, storeName);

        // Clean phone: strip everything except digits and leading +
        const phone = lead.phone.replace(/[^\d+]/g, '');

        await sendTextViaGoogleVoice(phone, message);
        await markLeadAsSent(lead.id, lead.name);

        // Small delay between multiple leads to avoid rapid-fire automation
        if (newLeads.length > 1) await sleep(2000);

      } catch (err) {
        console.error(`[KU SMS] Failed to text lead ${lead.id}:`, err.message);
        // Still mark as "attempted" to avoid infinite retry loops on broken leads
        // Comment out the line below if you want retries on failure
        await markLeadAsSent(lead.id, lead.name + ' (failed)');
      }
    }

    isCurrentlySending = false;

  } catch (err) {
    isCurrentlySending = false;
    console.error('[KU SMS] Poll error:', err.message);
  }
}

// ─── Start polling ────────────────────────────────────────────────────────────

async function startPolling() {
  const config = await getConfig();
  const interval = config.pollInterval || POLL_INTERVAL_DEFAULT;

  console.log(`[KU SMS] Extension active. Polling every ${interval / 1000}s for new leads.`);

  // Run once immediately
  pollForNewLeads();

  // Then on interval
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(pollForNewLeads, interval);
}

// Restart polling if config changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.pollInterval || changes.supabaseUrl || changes.storeId) {
    if (pollingTimer) clearInterval(pollingTimer);
    startPolling();
  }
});

// ─── Message listener (for test SMS from options page) ───────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'sendTestSMS') {
    sendTextViaGoogleVoice(message.phone, message.message)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }
});

startPolling();
