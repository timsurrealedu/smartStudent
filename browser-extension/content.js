(function () {
  'use strict';

  if (window.__smartStudentInjected) return;
  window.__smartStudentInjected = true;

  function showFloatingNotification(message, type = 'info') {
    const existing = document.getElementById('smartstudent-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'smartstudent-toast';
    toast.innerText = message;
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 999999;
      padding: 12px 18px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      background: ${type === 'error' ? '#dc2626' : '#16a34a'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function scrapePage() {
    if (!window.SmartStudentBinusMayaExtractor) {
      return { url: location.href, title: document.title, scrapedAt: new Date().toISOString(), courses: [], assignments: [], grades: [], schedules: [], announcements: [] };
    }
    return window.SmartStudentBinusMayaExtractor();
  }

  function collectSyncLinks() {
    const include = /course|class|schedule|assignment|task|grade|score|announcement|calendar|assessment|session|learning/i;
    const exclude = /logout|signout|delete|remove|drop|cancel|payment|print|download|mailto:/i;
    const links = new Set([location.href]);

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const label = `${anchor.href} ${anchor.textContent || ''}`;
      if (!include.test(label) || exclude.test(label)) return;
      try {
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin) return;
        url.hash = '';
        links.add(url.toString());
      } catch {}
    });

    const resourceUrls = window.SmartStudentBinusMayaExtractor?.().debug?.resourceUrls || [];
    resourceUrls.forEach((href) => {
      try {
        const url = new URL(href, location.href);
        if (url.origin === location.origin) links.add(url.toString());
      } catch {}
    });

    return [...links].slice(0, 40);
  }

  function sendToBackground() {
    const data = scrapePage();
    const totalItems = countItems(data);

    if (totalItems === 0) {
      console.log('[SmartStudent] No data found on this page.', data.debug);
      return;
    }

    chrome.runtime.sendMessage({ type: 'BINUSMAYA_DATA', payload: data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[SmartStudent] Send message failed:', chrome.runtime.lastError.message);
        showFloatingNotification('SmartStudent sync failed', 'error');
        return;
      }

      if (response && response.success) {
        showFloatingNotification(
          `SmartStudent synced: ${data.courses.length} courses, ${data.assignments.length} assignments, ${data.grades.length} grades`
        );
      } else {
        showFloatingNotification(`SmartStudent: ${response?.error || 'Sync failed'}`, 'error');
      }
    });
  }

  function countItems(data) {
    return (
      data.courses.length +
      data.assignments.length +
      data.grades.length +
      data.schedules.length +
      data.announcements.length
    );
  }

  let debounceTimer = null;
  function debouncedSync(delayMs = 2000) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sendToBackground, delayMs);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debouncedSync(1500);
  } else {
    window.addEventListener('DOMContentLoaded', () => debouncedSync(1500));
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'MANUAL_SYNC') {
      const data = scrapePage();
      if (countItems(data) === 0) {
        sendResponse({ success: false, error: 'No BinusMaya data found on this page.', data });
        return true;
      }
      sendResponse({ success: true, data });
      chrome.runtime.sendMessage({ type: 'BINUSMAYA_DATA', payload: data });
      return true;
    }

    if (request.type === 'MANUAL_SCRAPE_ONLY') {
      sendResponse({ success: true, data: scrapePage() });
      return true;
    }

    if (request.type === 'COLLECT_SYNC_LINKS') {
      sendResponse({ success: true, links: collectSyncLinks() });
      return true;
    }
  });

  const observer = new MutationObserver(() => debouncedSync(3000));
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[SmartStudent] Content script loaded on BinusMaya.');
})();
