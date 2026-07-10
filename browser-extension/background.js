chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    backendUrl: 'http://localhost:3001/api',
    apiToken: '',
    lastSyncTime: null,
    lastSyncStats: { courses: 0, assignments: 0, grades: 0, schedules: 0, announcements: 0 },
    syncedAssignmentHashes: []
  });

  // Create alarm for auto-sync every 30 minutes
  chrome.alarms.create('autoSync', { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoSync') {
    triggerAutoSync();
  }
});

const BINUS_URLS = [
  'https://lms.binus.ac.id/*',
  'https://binusmaya.binus.ac.id/*'
];

function normalizeBackendUrl(value) {
  const raw = (value || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

async function triggerAutoSync() {
  try {
    const tabs = await chrome.tabs.query({ url: BINUS_URLS });
    if (tabs.length === 0) return; // No BinusMaya tab open

    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'MANUAL_SYNC' });
      } catch (e) {
        // Tab may not have content script injected
        console.log('[SmartStudent] Could not message tab', tab.id, e.message);
      }
    }
  } catch (err) {
    console.error('[SmartStudent] Auto-sync error:', err);
  }
}

function emptyPayload() {
  return {
    url: 'binusmaya-deep-sync',
    title: 'BinusMaya Deep Sync',
    scrapedAt: new Date().toISOString(),
    courses: [],
    assignments: [],
    grades: [],
    schedules: [],
    announcements: []
  };
}

function addUnique(list, items, keyFn) {
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || list.some(existing => keyFn(existing) === key)) continue;
    list.push(item);
  }
}

function mergePayload(target, source) {
  addUnique(target.courses, source.courses, c => (c.code || c.name || '').toLowerCase());
  addUnique(target.assignments, source.assignments, a => `${a.courseCode || a.courseName || ''}|${a.title || ''}|${a.dueDate || ''}`.toLowerCase());
  addUnique(target.grades, source.grades, g => `${g.courseCode || g.courseName || ''}|${g.itemName || g.component || ''}|${g.score ?? ''}/${g.maxScore ?? ''}`.toLowerCase());
  addUnique(target.schedules, source.schedules, s => `${s.courseCode || s.courseName || ''}|${s.day ?? s.dayOfWeek ?? ''}|${s.startTime || ''}|${s.endTime || ''}`.toLowerCase());
  addUnique(target.announcements, source.announcements, a => `${a.courseCode || a.courseName || ''}|${a.title || ''}`.toLowerCase());
}

function countPayloadItems(payload) {
  return (
    (payload.courses?.length || 0) +
    (payload.assignments?.length || 0) +
    (payload.grades?.length || 0) +
    (payload.schedules?.length || 0) +
    (payload.announcements?.length || 0)
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTabComplete(tabId) {
  for (let i = 0; i < 40; i++) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      await delay(1500);
      return;
    }
    await delay(500);
  }
}

async function scrapeTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'MANUAL_SCRAPE_ONLY' });
    return response?.data || null;
  } catch (err) {
    console.log('[SmartStudent] Could not scrape tab', tabId, err.message);
    return null;
  }
}

async function collectLinksFromTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'COLLECT_SYNC_LINKS' });
    return response?.links || [];
  } catch (err) {
    console.log('[SmartStudent] Could not collect links', tabId, err.message);
    return [];
  }
}

async function getDiagnosticsFromTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_DIAGNOSTICS' });
    return response?.diagnostics || null;
  } catch (err) {
    console.log('[SmartStudent] Could not collect diagnostics', tabId, err.message);
    return null;
  }
}

async function triggerDeepSync() {
  const openTabs = await chrome.tabs.query({ url: BINUS_URLS });
  if (openTabs.length === 0) {
    throw new Error('Open lms.binus.ac.id first, then click Sync Now.');
  }

  const payload = emptyPayload();
  const links = new Set();
  const openUrls = new Map();

  for (const tab of openTabs) {
    if (!tab.id || !tab.url) continue;
    openUrls.set(tab.url.split('#')[0], tab.id);
    const data = await scrapeTab(tab.id);
    if (data) mergePayload(payload, data);
    for (const link of await collectLinksFromTab(tab.id)) links.add(link.split('#')[0]);
  }

  const urls = [...links].slice(0, 40);
  const tempTabIds = [];
  try {
    for (const url of urls) {
      let tabId = openUrls.get(url);
      if (!tabId) {
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id;
        tempTabIds.push(tabId);
        await waitForTabComplete(tabId);
      }
      const data = await scrapeTab(tabId);
      if (data) mergePayload(payload, data);
    }
  } finally {
    for (const tabId of tempTabIds) {
      try { await chrome.tabs.remove(tabId); } catch {}
    }
  }

  if (countPayloadItems(payload) === 0) {
    throw new Error('No BinusMaya data found. Open a dashboard, course, assessment, or grade page and try again.');
  }

  return handleBinusmayaData(payload);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'BINUSMAYA_DATA') {
    handleBinusmayaData(request.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.type === 'MANUAL_SYNC_FROM_POPUP') {
    triggerDeepSync()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === 'GET_STATS') {
    chrome.storage.local.get(['lastSyncTime', 'lastSyncStats', 'backendUrl', 'apiToken'], (items) => {
      sendResponse({
        backendUrl: items.backendUrl || 'http://localhost:3001/api',
        apiToken: items.apiToken || '',
        lastSyncTime: items.lastSyncTime,
        stats: items.lastSyncStats || { courses: 0, assignments: 0, grades: 0, schedules: 0, announcements: 0 }
      });
    });
    return true;
  }

  if (request.type === 'GET_DIAGNOSTICS_FROM_POPUP') {
    chrome.tabs.query({ url: BINUS_URLS }, async (tabs) => {
      const diagnostics = [];
      for (const tab of tabs) {
        if (!tab.id) continue;
        const item = await getDiagnosticsFromTab(tab.id);
        if (item) diagnostics.push(item);
      }
      sendResponse({ success: true, diagnostics });
    });
    return true;
  }

  if (request.type === 'SAVE_CONFIG') {
    chrome.storage.local.set(
      { backendUrl: normalizeBackendUrl(request.url), apiToken: request.token },
      () => {
        sendResponse({ success: true });
      }
    );
    return true;
  }
});

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

async function handleBinusmayaData(payload) {
  const storage = await chrome.storage.local.get([
    'backendUrl',
    'apiToken',
    'syncedAssignmentHashes',
    'lastSyncStats'
  ]);

  const backendUrl = normalizeBackendUrl(storage.backendUrl);
  const apiToken = storage.apiToken || '';

  if (!apiToken) {
    return {
      success: false,
      error: 'No API token set. Open the extension popup and paste your SmartStudent token.',
      stats: { courses: 0, assignments: 0, grades: 0, schedules: 0, announcements: 0 }
    };
  }

  let syncedHashes = storage.syncedAssignmentHashes || [];
  const previousStats = storage.lastSyncStats || { courses: 0, assignments: 0, grades: 0, schedules: 0, announcements: 0 };

  // Deduplicate assignments
  const newAssignments = [];
  for (const a of payload.assignments || []) {
    const hash = hashString((a.title || '') + '|' + (a.courseCode || ''));
    if (!syncedHashes.includes(hash)) {
      syncedHashes.push(hash);
      newAssignments.push(a);
    }
  }

  // Prune hash list if it grows too large
  if (syncedHashes.length > 5000) {
    syncedHashes = syncedHashes.slice(-2000);
  }

  const enrichedPayload = {
    ...payload,
    assignments: newAssignments,
    meta: {
      newAssignmentCount: newAssignments.length,
      totalAssignmentCount: payload.assignments?.length || 0
    }
  };

  let apiSuccess = false;
  let apiError = null;

  try {
    const response = await fetch(`${backendUrl}/import/binusmaya-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(enrichedPayload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token. Check the extension popup and re-paste your token.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    apiSuccess = true;
  } catch (err) {
    apiError = err.message;
    console.error('[SmartStudent] Backend sync failed:', err);
  }

  const stats = {
    courses: payload.courses?.length || 0,
    assignments: payload.assignments?.length || 0,
    grades: payload.grades?.length || 0,
    schedules: payload.schedules?.length || 0,
    announcements: payload.announcements?.length || 0
  };

  if (apiSuccess) {
    await chrome.storage.local.set({
      lastSyncTime: new Date().toISOString(),
      lastSyncStats: stats,
      syncedAssignmentHashes: syncedHashes
    });
  }

  // Browser notification for new assignments
  if (newAssignments.length > 0 && apiSuccess) {
    const courseList = [...new Set(newAssignments.map((a) => a.courseCode).filter(Boolean))];
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'SmartStudent: New Assignments Detected',
      message: `${newAssignments.length} new assignment(s) found${courseList.length > 0 ? ' in ' + courseList.join(', ') : ''}. Synced to SmartStudent.`,
      priority: 1
    });
  }

  if (!apiSuccess) {
    return {
      success: false,
      error: `SmartStudent not reachable (${apiError})`,
      stats
    };
  }

  return {
    success: true,
    stats,
    newAssignments: newAssignments.length
  };
}
