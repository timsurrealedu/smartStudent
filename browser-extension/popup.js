document.addEventListener('DOMContentLoaded', () => {
  const elCourses = document.getElementById('stat-courses');
  const elAssignments = document.getElementById('stat-assignments');
  const elGrades = document.getElementById('stat-grades');
  const elLastSync = document.getElementById('last-sync');
  const elStatusDot = document.getElementById('status-dot');
  const elStatusText = document.getElementById('status-text');
  const btnSync = document.getElementById('btn-sync');
  const inputBackend = document.getElementById('backend-url');
  const inputToken = document.getElementById('api-token');
  const elSaveStatus = document.getElementById('save-status');

  function formatDate(isoString) {
    if (!isoString) return 'Never';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function loadStats() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[SmartStudent Popup]', chrome.runtime.lastError);
        setStatus('error', 'Service unavailable');
        return;
      }

      if (response) {
        elCourses.textContent = response.stats?.courses ?? 0;
        elAssignments.textContent = response.stats?.assignments ?? 0;
        elGrades.textContent = response.stats?.grades ?? 0;
        elLastSync.textContent = formatDate(response.lastSyncTime);
        inputBackend.value = response.backendUrl || 'http://localhost:3001/api';
        inputToken.value = response.apiToken || '';

        if (response.lastSyncTime) {
          const minsAgo = (Date.now() - new Date(response.lastSyncTime).getTime()) / 60000;
          if (minsAgo < 60) {
            setStatus('ok', `Synced ${Math.round(minsAgo)} min ago`);
          } else {
            setStatus('ok', 'Synced earlier');
          }
        } else {
          setStatus('neutral', 'Not synced yet');
        }
      }
    });
  }

  function setStatus(state, text) {
    elStatusText.textContent = text;
    elStatusDot.className = 'dot';
    if (state === 'ok') elStatusDot.classList.add('green');
    if (state === 'error') elStatusDot.classList.add('red');
  }

  btnSync.addEventListener('click', () => {
    btnSync.disabled = true;
    btnSync.textContent = 'Syncing...';
    setStatus('neutral', 'Syncing...');

    chrome.runtime.sendMessage({ type: 'MANUAL_SYNC_FROM_POPUP' }, (response) => {
      btnSync.disabled = false;
      btnSync.textContent = 'Sync Now';

      if (chrome.runtime.lastError) {
        setStatus('error', 'Sync failed');
        return;
      }

      if (!response?.success) {
        setStatus('error', response?.error || 'Sync failed');
        return;
      }

      setTimeout(() => {
        loadStats();
      }, 800);
    });
  });

  let saveTimeout = null;
  function autoSave() {
    elSaveStatus.textContent = 'Saving...';
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const url = inputBackend.value.trim();
      const token = inputToken.value.trim();
      chrome.runtime.sendMessage(
        { type: 'SAVE_CONFIG', url, token },
        (response) => {
          if (response && response.success) {
            elSaveStatus.textContent = 'Saved';
          } else {
            elSaveStatus.textContent = 'Save failed';
          }
        }
      );
    }, 600);
  }

  inputBackend.addEventListener('input', autoSave);
  inputToken.addEventListener('input', autoSave);

  // Initial load
  loadStats();
});
