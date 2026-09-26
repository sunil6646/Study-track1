// ==============================================
// DATA & STATE MODULE
// ==============================================
const STORAGE_KEY = 'studymaster_classic_v1';

const DEFAULT_SUBJECTS = [
  { id: 'subj_vocab', name: 'English Vocab', name_pa: 'ਅੰਗਰੇਜ਼ੀ ਸ਼ਬਦਾਵਲੀ (Vocab)' },
  { id: 'subj_grammar', name: 'English Grammar', name_pa: 'ਅੰਗਰੇਜ਼ੀ ਵਿਆਕਰਨ (Grammar)' },
  { id: 'subj_punjabi', name: 'Punjabi', name_pa: 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ' },
  { id: 'subj_maths', name: 'Maths', name_pa: 'ਗਣਿਤ (Maths)' },
  { id: 'subj_reasoning', name: 'Reasoning', name_pa: 'ਰੀਜ਼ਨਿੰਗ (Reasoning)' },
  { id: 'subj_computer', name: 'Computer', name_pa: 'ਕੰਪਿਊਟਰ (Computer)' },
  { id: 'subj_gk_gs', name: 'GK / GS', name_pa: 'ਜਨਰਲ ਨਾਲੇਜ (GK / GS)' },
  { id: 'subj_ca', name: 'Current Affairs', name_pa: 'ਮੌਜੂਦਾ ਮਾਮਲੇ (Current Affairs)' }
];

const DEFAULT_PLAYLISTS = [];

const MOTIVATIONAL_QUOTES = [
  "Consistency transforms regular effort into extraordinary victory.",
  "Small daily improvements over time lead to stunning exam results.",
  "Your future self will thank you for the focus you dedicate today.",
  "ਸਫ਼ਲਤਾ ਦੀ ਇੱਕੋ ਚਾਬੀ ਹੈ: ਰੋਜ਼ਾਨਾ ਅਭਿਆਸ ਅਤੇ ਅਣਥੱਕ ਮਿਹਨਤ।",
  "One subject at a time, finish strong today!",
  "Discipline is choosing between what you want now and what you want most."
];

const I18N = {
  en: {
    checklist: "Checklist",
    timer: "Timer",
    analytics: "Stats",
    notes: "Notes",
    subGoal: "Daily Checklist · Check items as you complete each class",
    statTotal: "Total",
    statDone: "Completed",
    statLeft: "Pending",
    statTime: "Time Logged",
    progressTitle: "Daily Study Completion",
    filterAll: "All",
    filterPending: "Pending",
    filterDone: "Done",
    markAll: "All Done",
    resetAll: "Reset",
    studyReading: "Study",
    shortBreak: "Short Break",
    longBreak: "Long Break",
    editDurations: "Edit Durations (Minutes):",
    studyMin: "Study (Min)",
    shortMin: "Short Break",
    longMin: "Long Break",
    assignSubj: "Log Study Time to Subject:",
    startFocus: "Start Focus",
    celebTitle: "All Classes Completed Today!",
    celebSub: "Remarkable dedication! You've tackled every single study subject scheduled for today. Keep this winning momentum!",
    analyticsTitle: "Last 7 Days Consistency",
    analyticsSub: "Checklist items completed each day",
    notebookHeading: "Study Notebook"
  },
  pa: {
    checklist: "ਚੈੱਕਲਿਸਟ",
    timer: "ਟਾਈਮਰ",
    analytics: "ਅੰਕੜੇ",
    notes: "ਨੋਟਸ",
    subGoal: "ਰੋਜ਼ਾਨਾ ਚੈੱਕਲਿਸਟ · ਹਰ ਕਲਾਸ ਪੂਰੀ ਹੋਣ 'ਤੇ ਟਿੱਕ ਕਰੋ",
    statTotal: "ਕੁੱਲ",
    statDone: "ਮੁਕੰਮਲ",
    statLeft: "ਬਾਕੀ",
    statTime: "ਪੜ੍ਹਾਈ ਸਮਾਂ",
    progressTitle: "ਰੋਜ਼ਾਨਾ ਪੜ੍ਹਾਈ ਪ੍ਰਗਤੀ",
    filterAll: "ਸਾਰੇ",
    filterPending: "ਬਾਕੀ",
    filterDone: "ਮੁਕੰਮਲ",
    markAll: "ਸਾਰੇ ਪੂਰੇ",
    resetAll: "ਰੀਸੈੱਟ",
    studyReading: "ਪੜ੍ਹਾਈ",
    shortBreak: "ਛੋਟੀ ਬ੍ਰੇਕ",
    longBreak: "ਵੱਡੀ ਬ੍ਰੇਕ",
    editDurations: "ਸਮਾਂ ਬਦਲੋ (ਮਿੰਟਾਂ 'ਚ):",
    studyMin: "ਪੜ੍ਹਾਈ (ਮਿੰਟ)",
    shortMin: "ਛੋਟੀ ਬ੍ਰੇਕ",
    longMin: "ਵੱਡੀ ਬ੍ਰੇਕ",
    assignSubj: "ਵਿਸ਼ੇ ਲਈ ਸਮਾਂ ਲੌਗ ਕਰੋ:",
    startFocus: "ਸ਼ੁਰੂ ਕਰੋ",
    celebTitle: "ਅੱਜ ਦੇ ਸਾਰੇ ਵਿਸ਼ੇ ਪੂਰੇ ਹੋ ਗਏ!",
    celebSub: "ਸ਼ਾਨਦਾਰ ਮਿਹਨਤ! ਤੁਸੀਂ ਅੱਜ ਲਈ ਨਿਰਧਾਰਿਤ ਹਰ ਕਲਾਸ ਮੁਕੰਮਲ ਕਰ ਲਈ ਹੈ।",
    analyticsTitle: "ਪਿਛਲੇ 7 ਦਿਨਾਂ ਦੇ ਅੰਕੜੇ",
    analyticsSub: "ਰੋਜ਼ਾਨਾ ਪੂਰੇ ਕੀਤੇ ਵਿਸ਼ੇ",
    notebookHeading: "ਸਟੱਡੀ ਨੋਟਬੁੱਕ"
  }
};

let state = {
  lang: 'en',
  theme: 'slate',
  subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
  records: {},      // date -> { [subjectId]: boolean }
  timeSpent: {},    // date -> { [subjectId]: minutes }
  notes: {},        // date -> { [subjectId]: string }
  notebook: [],     // array of notes
  playlists: [],    // array of in-app study playlists & video items
  aiTests: [],      // array of past AI tests
  lastDate: '',
  targetHours: 6,
  timerConfig: {
    studyMins: 25,
    shortMins: 5,
    longMins: 15
  },
  dateMode: 'auto', // 'auto' | 'manual'
  manualDate: ''
};

const AVAILABLE_THEMES = [
  { id: 'slate', name: 'Midnight Slate', icon: '🌌', bg: '#020617', text: 'Classic Dark', color: '#10b981', desc: 'Dark Slate & Emerald' },
  { id: 'emerald', name: 'Emerald Forest', icon: '🌲', bg: '#031c14', text: 'Deep Forest', color: '#34d399', desc: 'Forest Green & Mint' },
  { id: 'indigo', name: 'Cyber Indigo', icon: '⚡', bg: '#030816', text: 'Neon Ocean', color: '#38bdf8', desc: 'Midnight Blue & Cyan' },
  { id: 'purple', name: 'Royal Amethyst', icon: '🔮', bg: '#10061e', text: 'Deep Violet', color: '#c084fc', desc: 'Royal Purple & Lavender' },
  { id: 'sunset', name: 'Sunset Amber', icon: '🌅', bg: '#190e06', text: 'Warm Gold', color: '#f59e0b', desc: 'Warm Amber & Gold' },
  { id: 'light', name: 'Crisp Minimal', icon: '☀️', bg: '#f8fafc', text: 'Light Clean', color: '#059669', desc: 'Clean White & Slate' }
];

function applyTheme(themeId) {
  if (!themeId) themeId = state.theme || 'slate';
  state.theme = themeId;
  document.body.setAttribute('data-theme', themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  if (typeof updateThemeAndLangUI === 'function') {
    updateThemeAndLangUI();
  }
}

window.setAppLanguage = function (lang) {
  if (lang !== 'en' && lang !== 'pa') return;
  state.lang = lang;
  saveState();
  if (typeof updateI18nLabels === 'function') updateI18nLabels();
  if (typeof renderChecklist === 'function') renderChecklist();
  if (typeof populateTimerSubjectsSelect === 'function') populateTimerSubjectsSelect();
  if (typeof renderSubjectNotes === 'function') renderSubjectNotes();
  if (typeof updateAiKeyStatusBadge === 'function') updateAiKeyStatusBadge();
  if (typeof populateAiSubjectSelect === 'function') populateAiSubjectSelect();
  if (typeof renderPastAiTests === 'function') renderPastAiTests();
  if (typeof renderLecturesHub === 'function') renderLecturesHub();
  if (typeof updateThemeAndLangUI === 'function') updateThemeAndLangUI();
  showToast(lang === 'pa' ? 'ਭਾਸ਼ਾ ਬਦਲੀ ਗਈ: ਪੰਜਾਬੀ 🇮🇳' : 'Language set to English 🇬🇧');
};

window.setAppTheme = function (themeId) {
  applyTheme(themeId);
  saveState();
  const themeObj = AVAILABLE_THEMES.find(t => t.id === themeId);
  showToast(`${themeObj ? themeObj.icon : '🎨'} Theme: ${themeObj ? themeObj.name : themeId}`);
};

function updateThemeAndLangUI() {
  const currentLang = state.lang || 'en';
  const currentTheme = state.theme || 'slate';

  // Update language buttons in drawer
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    const l = btn.getAttribute('data-lang-btn');
    if (l === currentLang) {
      btn.className = "btn-lang-choice py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40";
    } else {
      btn.className = "btn-lang-choice py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition flex items-center justify-center gap-1.5";
    }
  });

  const langLbl = document.getElementById('drawer-lang-label');
  if (langLbl) langLbl.textContent = currentLang === 'pa' ? 'ਪੰਜਾਬੀ (ਭਾਰਤ)' : 'English (UK/US)';

  const thLbl = document.getElementById('drawer-theme-label');
  const activeTh = AVAILABLE_THEMES.find(t => t.id === currentTheme) || AVAILABLE_THEMES[0];
  if (thLbl) thLbl.textContent = `${activeTh.icon} ${activeTh.name}`;

  // Update theme swatches in drawer
  const drawerSwatches = document.getElementById('drawer-theme-swatches');
  if (drawerSwatches && !drawerSwatches.hasChildNodes()) {
    AVAILABLE_THEMES.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `p-2 rounded-xl text-left border transition flex flex-col items-center justify-center gap-1 text-[10px] ${
        t.id === currentTheme ? 'border-emerald-400 ring-2 ring-emerald-500/30 font-bold' : 'border-slate-800 hover:border-slate-700 font-medium'
      }`;
      b.style.backgroundColor = t.bg;
      b.innerHTML = `
        <span class="text-base">${t.icon}</span>
        <span class="text-[10px] truncate max-w-full" style="color: ${t.id === 'light' ? '#0f172a' : '#f8fafc'}">${t.name.split(' ')[0]}</span>
      `;
      b.addEventListener('click', () => window.setAppTheme(t.id));
      drawerSwatches.appendChild(b);
    });
  } else if (drawerSwatches) {
    Array.from(drawerSwatches.children).forEach((child, idx) => {
      const t = AVAILABLE_THEMES[idx];
      if (t) {
        if (t.id === currentTheme) {
          child.className = `p-2 rounded-xl text-left border transition flex flex-col items-center justify-center gap-1 text-[10px] border-emerald-400 ring-2 ring-emerald-500/40 font-bold shadow-lg`;
        } else {
          child.className = `p-2 rounded-xl text-left border transition flex flex-col items-center justify-center gap-1 text-[10px] border-slate-800 hover:border-slate-700 font-medium opacity-80`;
        }
      }
    });
  }

  // Update theme cards in Settings panel if container exists
  const settingsThemeGrid = document.getElementById('settings-theme-cards');
  if (settingsThemeGrid) {
    settingsThemeGrid.innerHTML = '';
    AVAILABLE_THEMES.forEach(t => {
      const isSel = (t.id === currentTheme);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
        isSel
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg'
          : 'border-slate-800 hover:border-slate-700 opacity-90'
      }`;
      card.style.backgroundColor = t.bg;
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">${t.icon}</span>
          <div>
            <h5 class="text-xs font-bold" style="color: ${t.id === 'light' ? '#0f172a' : '#ffffff'}">${t.name}</h5>
            <p class="text-[10px]" style="color: ${t.id === 'light' ? '#64748b' : '#94a3b8'}">${t.desc}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-full" style="background-color: ${t.color}"></span>
          ${isSel ? '<span class="text-xs font-black text-emerald-400">✓ Active</span>' : '<span class="text-[11px] text-slate-500 font-semibold">Select</span>'}
        </div>
      `;
      card.addEventListener('click', () => window.setAppTheme(t.id));
      settingsThemeGrid.appendChild(card);
    });
  }
}

const SUBJECT_ICONS = {
  subj_vocab: '🔤',
  subj_grammar: '📖',
  subj_punjabi: '☬',
  subj_maths: '📐',
  subj_reasoning: '🧩',
  subj_computer: '💻',
  subj_gk_gs: '🌍',
  subj_ca: '📰'
};

function getSubjectIcon(subj) {
  if (!subj) return '📚';
  if (SUBJECT_ICONS[subj.id]) return SUBJECT_ICONS[subj.id];
  const n = (subj.name || '').toLowerCase();
  if (n.includes('vocab')) return '🔤';
  if (n.includes('grammar') || n.includes('english')) return '📖';
  if (n.includes('punjabi')) return '☬';
  if (n.includes('math')) return '📐';
  if (n.includes('reason')) return '🧩';
  if (n.includes('comp') || n.includes('code') || n.includes('tech')) return '💻';
  if (n.includes('gk') || n.includes('gs') || n.includes('science')) return '🌍';
  if (n.includes('affair') || n.includes('news')) return '📰';
  return '📚';
}

function getSubjectName(subj) {
  if (state.lang === 'pa' && subj.name_pa) {
    return subj.name_pa;
  }
  return subj.name;
}

let audioCtx = null;
function playTone(type) {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'check') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  } catch (e) {}
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = 70;
  const particles = [];
  const colors = ['#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#a855f7'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }
  let start = performance.now();
  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rotation += p.rotSpeed;
      if (now - start > 1800) p.opacity -= 0.02;
      if (p.opacity > 0 && p.y < canvas.height + 40) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    });
    if (alive && now - start < 3500) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

function showToast(msg) {
  const wrap = document.getElementById('toast-container');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold shadow-xl transition-all duration-300 transform translate-y-2 opacity-0';
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
  });
  setTimeout(() => {
    el.classList.add('opacity-0');
    setTimeout(() => el.remove(), 300);
  }, 2000);
}

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getActiveDate() {
  if (state.dateMode === 'manual' && state.manualDate) {
    return state.manualDate;
  }
  return getTodayString();
}

function saveState() {
  try {
    const raw = JSON.stringify(state);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {}
    if (window.AndroidBridge && typeof window.AndroidBridge.saveData === 'function') {
      try {
        window.AndroidBridge.saveData(STORAGE_KEY, raw);
      } catch (e) {}
    }
  } catch (e) {
    console.error('saveState error:', e);
  }
}

function applyParsedState(p) {
  if (!p || typeof p !== 'object') return false;
  let changed = false;
  if (Array.isArray(p.subjects) && p.subjects.length) { state.subjects = p.subjects; changed = true; }
  if (p.records && typeof p.records === 'object') { state.records = p.records; changed = true; }
  if (p.timeSpent && typeof p.timeSpent === 'object') { state.timeSpent = p.timeSpent; changed = true; }
  if (p.notes && typeof p.notes === 'object') { state.notes = p.notes; changed = true; }
  if (Array.isArray(p.notebook)) { state.notebook = p.notebook; changed = true; }
  if (Array.isArray(p.playlists)) {
    state.playlists = p.playlists.filter(pl => pl && pl.id && !pl.id.startsWith('pl_sample_'));
    changed = true;
  }
  if (Array.isArray(p.aiTests)) { state.aiTests = p.aiTests; changed = true; }
  if (p.targetHours) { state.targetHours = p.targetHours; changed = true; }
  if (p.timerConfig) { state.timerConfig = Object.assign({}, state.timerConfig, p.timerConfig); changed = true; }
  if (p.lang) { state.lang = p.lang; changed = true; }
  if (p.theme) { state.theme = p.theme; changed = true; }
  if (p.lastDate) { state.lastDate = p.lastDate; changed = true; }
  if (p.dateMode) { state.dateMode = p.dateMode; changed = true; }
  if (p.manualDate) { state.manualDate = p.manualDate; changed = true; }
  if (changed) { applyTheme(state.theme); }
  return changed;
}

function loadState() {
  try {
    let raw = null;
    if (window.AndroidBridge && typeof window.AndroidBridge.loadData === 'function') {
      try {
        raw = window.AndroidBridge.loadData(STORAGE_KEY);
      } catch (e) {}
    }
    if (!raw) {
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    if (raw) {
      const p = JSON.parse(raw);
      applyParsedState(p);
    }
  } catch (e) {
    console.error('loadState error:', e);
  }
  applyTheme(state.theme || 'slate');
  if (!Array.isArray(state.playlists)) {
    state.playlists = [];
  }
  // User requested no recommended playlists - only user's added playlists
  state.playlists = state.playlists.filter(p => p && p.id && !p.id.startsWith('pl_sample_'));
  const today = getTodayString();
  if (!state.records[today]) state.records[today] = {};
  if (!state.timeSpent[today]) state.timeSpent[today] = {};
  if (!state.notes[today]) state.notes[today] = {};
  if (!state.manualDate) state.manualDate = today;
  if (state.lastDate !== today) {
    state.lastDate = today;
    saveState();
  }
}

window.syncFromNativeStorage = function () {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.loadData === 'function') {
      const raw = window.AndroidBridge.loadData(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (applyParsedState(p)) {
          const today = getTodayString();
          if (!state.records[today]) state.records[today] = {};
          if (!state.timeSpent[today]) state.timeSpent[today] = {};
          if (!state.notes[today]) state.notes[today] = {};
          if (!state.manualDate) state.manualDate = today;
          if (typeof renderChecklist === 'function') renderChecklist();
          if (typeof computeStreak === 'function') computeStreak();
          if (typeof renderSubjectNotes === 'function') renderSubjectNotes();
          if (typeof renderLecturesHub === 'function') renderLecturesHub();
          if (typeof renderPastAiTests === 'function') renderPastAiTests();
          if (typeof renderAnalytics === 'function') renderAnalytics();
        }
      }
    }
  } catch (e) {}
};

window.addEventListener('beforeunload', () => saveState());
window.addEventListener('pagehide', () => saveState());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveState();
});
