(function (root) {
  'use strict';

  const COURSE_CODE = /\b[A-Z]{2,6}\d{3,8}\b/;
  const DATE = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/;
  const TIME = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;
  const DAY = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|minggu|senin|selasa|rabu|kamis|jumat|jum'at|sabtu)\b/i;
  const ASSIGNMENT = /assignment|tugas|deadline|due|quiz|exam|uts|uas|project|submission|homework/i;
  const GRADE = /score|grade|nilai|mark|points?|weight|final|mid/i;
  const ANNOUNCEMENT = /announcement|pengumuman|news|notice|info/i;
  const UI_NOISE = /latest forum posts?|unread posts?|no discussion forums?|academic calendar|being a student is easy|william crawford|dashboard|my progress|your progress|add course/i;
  const PERSON_NAME = /^[A-Z][A-Z .'-]{5,}$/;

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function keyOf(obj, re) {
    return Object.keys(obj || {}).find(k => re.test(k));
  }

  function valueOf(obj, re) {
    const key = keyOf(obj, re);
    return key ? text(obj[key]) : '';
  }

  function valueByKeys(obj, keys) {
    const entries = Object.entries(obj || {});
    for (const wanted of keys) {
      const item = entries.find(([key]) => key.toLowerCase() === wanted.toLowerCase());
      if (item) return text(item[1]);
    }
    return '';
  }

  function hasKey(obj, keys) {
    const wanted = new Set(keys.map(k => k.toLowerCase()));
    return Object.keys(obj || {}).some(k => wanted.has(k.toLowerCase()));
  }

  function num(value) {
    const n = Number(String(value ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(n) ? n : null;
  }

  function cleanCourseName(blob, code) {
    return text(blob)
      .replace(code || '', ' ')
      .replace(/(odd|even)\s*semester/ig, ' ')
      .replace(/all\s*sessions?/ig, ' ')
      .replace(/all\s*active\s*class\s*this\s*period/ig, ' ')
      .replace(/upcoming|outdated|no upcoming class|nothing in your to do list|have a good day/ig, ' ')
      .replace(/\b(lecture|lec|lab|class|course|subject|session|period)\b/ig, ' ')
      .replace(/["{}[\]:,]/g, ' ')
      .replace(/^[\W_]+|[\W_]+$/g, '')
      .trim();
  }

  function isNoiseCourse(name) {
    return !name ||
      name.length < 2 ||
      UI_NOISE.test(name) ||
      PERSON_NAME.test(name) ||
      /^text\b/i.test(name) ||
      /no upcoming|nothing in your|have a good day|active class|upcomingoutdated/i.test(name);
  }

  function isNoiseTitle(title) {
    return !title ||
      title.length < 4 ||
      title.length > 180 ||
      /^[{[]/.test(title) ||
      UI_NOISE.test(title) ||
      /pengumuman|announcement/i.test(title) ||
      /^text\b/i.test(title);
  }

  function pushUnique(list, item, key) {
    const id = key(item);
    if (!id || list.some(x => key(x) === id)) return;
    list.push(item);
  }

  function walk(value, visit, depth = 0, seen = new WeakSet()) {
    if (!value || depth > 8) return;
    if (typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach(v => walk(v, visit, depth + 1, seen));
      return;
    }
    visit(value);
    Object.values(value).forEach(v => walk(v, visit, depth + 1, seen));
  }

  function parseJson(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!/^[{[]/.test(trimmed)) return null;
    try { return JSON.parse(trimmed); } catch { return null; }
  }

  function jsonSources() {
    const sources = [];
    document.querySelectorAll('script[type*="json"], script#__NEXT_DATA__').forEach(script => {
      const parsed = parseJson(script.textContent || '');
      if (parsed) sources.push(parsed);
    });
    ['localStorage', 'sessionStorage'].forEach(storeName => {
      try {
        const store = window[storeName];
        for (let i = 0; i < store.length; i++) {
          const parsed = parseJson(store.getItem(store.key(i)));
          if (parsed) sources.push(parsed);
        }
      } catch {}
    });
    ['__NEXT_DATA__', '__NUXT__', '__APOLLO_STATE__', '__INITIAL_STATE__', '__REDUX_STATE__'].forEach(name => {
      if (window[name]) sources.push(window[name]);
    });
    return sources;
  }

  function inferCourse(obj, blob, out) {
    const code = valueOf(obj, /^(course|subject|class|catalog).*code$|^(kode|code)$/i) || blob.match(COURSE_CODE)?.[0] || '';
    if (!code) return;
    const rawName = (valueByKeys(obj, [
      'courseName', 'courseTitle', 'subjectName', 'subjectTitle', 'className',
      'classTitle', 'courseDesc', 'subjectDesc', 'crseDescr', 'descr'
    ]) || '')
      .replace(COURSE_CODE, '')
      .replace(/^(course|class|subject)\s*[:\-]/i, '')
      .trim();
    if (!rawName) return;
    const name = rawName;
    if (!isNoiseCourse(name)) {
      pushUnique(out.courses, { code, name: name || code }, c => c.code || c.name.toLowerCase());
    }
  }

  function inferAssignment(obj, blob, out) {
    if (!ASSIGNMENT.test(blob)) return;
    if (hasKey(obj, ['iamType', 'iamTypeDesc', 'score', 'scoreDate', 'gradingScore'])) return;
    if (ANNOUNCEMENT.test(blob) && !/assignment|tugas|deadline|due|submission/i.test(blob)) return;
    const title = valueByKeys(obj, [
      'assignmentTitle', 'assignmentName', 'taskTitle', 'taskName', 'activityTitle',
      'assessmentTitle', 'title', 'judul'
    ]) || blob.slice(0, 140);
    const dueDate = valueByKeys(obj, [
      'dueDate', 'deadline', 'endDate', 'submitDate', 'submissionDate', 'tanggal'
    ]) || blob.match(DATE)?.[0] || null;
    const courseCode = valueOf(obj, /course.*code|subject.*code|class.*code|kode/i) || blob.match(COURSE_CODE)?.[0] || '';
    if (!courseCode && !dueDate) return;
    if (isNoiseTitle(title)) return;
    const type = /quiz/i.test(blob) ? 'QUIZ' : /exam|uts|uas/i.test(blob) ? 'EXAM' : 'ASSIGNMENT';
    pushUnique(out.assignments, { title, dueDate, courseCode, type, description: blob.slice(0, 500) }, a => `${a.courseCode}|${a.title}|${a.dueDate || ''}`.toLowerCase());
  }

  function inferGrade(obj, blob, out) {
    if (!GRADE.test(blob) && !hasKey(obj, ['iamType', 'iamTypeDesc', 'weight'])) return;
    if (hasKey(obj, ['gradingScore'])) return;
    const explicitScore = valueByKeys(obj, ['score', 'grade', 'nilai', 'mark', 'achievedScore', 'point', 'points']);
    const score = explicitScore && !/^n\/?a$/i.test(explicitScore) ? num(explicitScore) : null;
    const slash = blob.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    const resolvedScore = score ?? (slash ? num(slash[1]) : null);
    if (resolvedScore !== null && (resolvedScore < 0 || resolvedScore > 100)) return;
    const maxScore = num(valueByKeys(obj, ['maxScore', 'totalScore', 'scoreMax', 'outOf'])) ?? (slash ? num(slash[2]) : 100);
    const courseCode = valueOf(obj, /course.*code|subject.*code|class.*code|kode/i) || blob.match(COURSE_CODE)?.[0] || '';
    const itemName = (valueByKeys(obj, ['iamTypeDesc', 'component', 'assessment', 'assessmentTitle', 'title', 'category', 'iamType', 'type']) || blob.slice(0, 80))
      .replace(/^(theory|lab)\s*:\s*/i, '')
      .trim();
    if (isNoiseTitle(itemName)) return;
    const weight = num(valueByKeys(obj, ['weight', 'bobot', 'percentage'])) ?? 10;
    if (!courseCode && resolvedScore === null) return;
    pushUnique(out.grades, { courseCode, itemName, category: 'General', score: resolvedScore, maxScore: maxScore || 100, weight }, g => `${g.courseCode}|${g.itemName}|${g.score}/${g.maxScore}`.toLowerCase());
  }

  function inferSchedule(obj, blob, out) {
    const day = valueOf(obj, /day|hari/i) || blob.match(DAY)?.[0] || '';
    const times = [...blob.matchAll(TIME)].map(m => `${m[1].padStart(2, '0')}:${m[2]}`);
    const startTime = valueOf(obj, /start.*time|time.*start|jam.*mulai/i) || times[0] || '';
    const endTime = valueOf(obj, /end.*time|time.*end|jam.*selesai/i) || times[1] || '';
    if (!day || !startTime) return;
    const courseCode = valueOf(obj, /course.*code|subject.*code|class.*code|kode/i) || blob.match(COURSE_CODE)?.[0] || '';
    const location = valueOf(obj, /room|location|venue|classroom|ruang|lokasi/i);
    pushUnique(out.schedules, { courseCode, day, startTime, endTime, location }, s => `${s.courseCode}|${s.day}|${s.startTime}|${s.endTime}`.toLowerCase());
  }

  function inferAnnouncement(obj, blob, out) {
    if (!ANNOUNCEMENT.test(blob)) return;
    const title = valueOf(obj, /title|subject|name|judul/i) || blob.slice(0, 120);
    const content = valueOf(obj, /content|message|body|description|desc|isi/i) || blob;
    const courseCode = valueOf(obj, /course.*code|subject.*code|class.*code|kode/i) || blob.match(COURSE_CODE)?.[0] || '';
    pushUnique(out.announcements, { title, content: content.slice(0, 1000), courseCode }, a => `${a.courseCode}|${a.title}`.toLowerCase());
  }

  function scanObject(obj, out) {
    const blob = text(JSON.stringify(obj));
    if (blob.length < 4 || blob.length > 5000) return;
    inferCourse(obj, blob, out);
    inferAssignment(obj, blob, out);
    inferGrade(obj, blob, out);
    inferSchedule(obj, blob, out);
    inferAnnouncement(obj, blob, out);
  }

  function scanDom(out) {
    document.querySelectorAll('tr, li, article, section, [role="row"], .card, [class*="card"], [class*="item"], [class*="course"], [class*="class"]').forEach(el => {
      const blob = text(el.innerText || el.textContent || '');
      if (blob.length < 4 || blob.length > 1200) return;
      const obj = { text: blob };
      scanObject(obj, out);
    });

    const lines = (document.body.innerText || '')
      .split(/\n+/)
      .map(text)
      .filter(line => line.length >= 4 && line.length <= 300);
    for (let i = 0; i < lines.length; i++) {
      scanObject({ text: lines.slice(i, i + 4).join(' ') }, out);
    }
  }

  root.SmartStudentBinusMayaExtractor = function scrapeBinusMayaPage(apiResponses = [], options = {}) {
    const out = { courses: [], assignments: [], grades: [], schedules: [], announcements: [] };
    (apiResponses || []).forEach(response => walk(response.json, obj => scanObject(obj, out)));
    jsonSources().forEach(source => walk(source, obj => scanObject(obj, out)));
    if (options.fallbackDom !== false && out.courses.length + out.assignments.length + out.grades.length + out.schedules.length + out.announcements.length === 0) {
      scanDom(out);
    }
    return {
      url: location.href,
      title: document.title,
      scrapedAt: new Date().toISOString(),
      ...out,
      debug: {
        apiResponses: apiResponses.length,
        apiUrls: apiResponses.map(r => r.url).slice(-30),
        jsonSources: jsonSources().length,
        resourceUrls: performance.getEntriesByType('resource').map(r => r.name).filter(u => /api|course|class|schedule|assignment|grade|score|announcement|calendar/i.test(u)).slice(0, 50)
      }
    };
  };
})(window);
