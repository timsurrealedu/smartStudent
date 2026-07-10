(function () {
  'use strict';

  if (window.__smartStudentNetworkSniffer) return;
  window.__smartStudentNetworkSniffer = true;

  const INTERESTING = /api|course|class|schedule|assignment|assessment|grade|score|announcement|calendar|session|forum|todo/i;
  const MAX_BODY_LENGTH = 250000;

  function isSameOrigin(url) {
    try {
      return new URL(url, location.href).origin === location.origin;
    } catch {
      return false;
    }
  }

  function shouldCapture(url, contentType, body) {
    if (!isSameOrigin(url)) return false;
    if (INTERESTING.test(url)) return true;
    if (/json/i.test(contentType || '')) return true;
    return /^[\s]*[{[]/.test(body || '');
  }

  function emit(record) {
    window.postMessage({ source: 'SMARTSTUDENT_LMS_RESPONSE', record }, location.origin);
  }

  function capture(url, status, contentType, body) {
    if (!body || body.length > MAX_BODY_LENGTH || !shouldCapture(url, contentType, body)) return;
    let json = null;
    try { json = JSON.parse(body); } catch {}
    if (!json) return;
    emit({
      url: new URL(url, location.href).toString(),
      status,
      capturedAt: new Date().toISOString(),
      json
    });
  }

  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function smartStudentFetch(input, init) {
      const response = await originalFetch.apply(this, arguments);
      const url = typeof input === 'string' ? input : input?.url;
      if (url) {
        response.clone().text()
          .then(body => capture(url, response.status, response.headers.get('content-type') || '', body))
          .catch(() => {});
      }
      return response;
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    window.XMLHttpRequest = function SmartStudentXHR() {
      const xhr = new OriginalXHR();
      let url = '';
      const open = xhr.open;
      xhr.open = function smartStudentOpen(method, requestUrl) {
        url = requestUrl;
        return open.apply(xhr, arguments);
      };
      xhr.addEventListener('load', () => {
        try {
          const type = xhr.getResponseHeader('content-type') || '';
          if (typeof xhr.responseText === 'string') capture(url, xhr.status, type, xhr.responseText);
        } catch {}
      });
      return xhr;
    };
  }

  window.postMessage({ source: 'SMARTSTUDENT_LMS_SNIFFER_READY' }, location.origin);
})();
