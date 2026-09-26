// ==============================================
// AI VIDEO & TOPIC QUIZ GENERATOR MODULE
// ==============================================
let currentAiQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let quizTimerInterval = null;
let quizSecondsElapsed = 0;
let lastCompletedQuizRecord = null;
let lastCompletedQuizAnswers = null;
let detectedVideoId = null;
let detectedVideoTitle = '';
let detectedVideoChannel = '';
let selectedAiSubjectId = 'subj_maths';

const SUBJECT_TOPIC_PRESETS = {
  subj_maths: [
    { label: "📐 Percentage & Profit", topic: "Maths: Percentage & Profit Loss" },
    { label: "💰 SI & Compound Interest", topic: "Maths: Simple & Compound Interest" },
    { label: "⏱️ Time & Work", topic: "Maths: Time & Work Formulas" },
    { label: "🚂 Speed & Distance", topic: "Maths: Speed, Time & Train Problems" },
    { label: "⚖️ Ratio & Proportions", topic: "Maths: Ratio, Proportion & Mixtures" }
  ],
  subj_reasoning: [
    { label: "🧩 Syllogism & Venn", topic: "Reasoning: Syllogism & Venn Diagrams" },
    { label: "🔤 Coding & Decoding", topic: "Reasoning: Coding & Decoding Rules" },
    { label: "👨‍👩‍👧 Blood Relations", topic: "Reasoning: Blood Relations" },
    { label: "🧭 Direction Sense", topic: "Reasoning: Direction & Distance Test" },
    { label: "🔢 Number Series", topic: "Reasoning: Missing Number & Series" }
  ],
  subj_punjabi: [
    { label: "☬ ਪੰਜਾਬੀ ਵਿਆਕਰਨ", topic: "ਪੰਜਾਬੀ ਵਿਆਕਰਨ: ਨਾਂਵ, ਪੜਨਾਂਵ ਅਤੇ ਵਿਸ਼ੇਸ਼ਣ" },
    { label: "✍️ ਸ਼ੁੱਧ-ਅਸ਼ੁੱਧ ਸ਼ਬਦ", topic: "ਪੰਜਾਬੀ ਸ਼ਬਦ-ਜੋੜ ਅਤੇ ਸ਼ੁੱਧ-ਅਸ਼ੁੱਧ" },
    { label: "💬 ਅਖਾਣ ਤੇ ਮੁਹਾਵਰੇ", topic: "ਪੰਜਾਬੀ ਅਖਾਣ ਅਤੇ ਮੁਹਾਵਰੇ ਅਰਥ ਸਹਿਤ" },
    { label: "📜 ਗੁਰਮੁਖੀ ਲਿੱਪੀ ਨਿਯਮ", topic: "ਗੁਰਮੁਖੀ ਲਿੱਪੀ, ਧੁਨੀ ਬੋਧ ਅਤੇ ਵਰਣਮਾਲਾ" }
  ],
  subj_vocab: [
    { label: "🔤 50 Repeated Synonyms", topic: "English: 50 Most Repeated Synonyms" },
    { label: "🔄 Exam Antonyms", topic: "English: Most Repeated Antonyms" },
    { label: "💡 Idioms & Phrases", topic: "English: High-Yield Idioms & Phrases" },
    { label: "👤 One Word Substitution", topic: "English: One Word Substitutions" }
  ],
  subj_grammar: [
    { label: "📖 Prepositions Rules", topic: "English Grammar: Prepositions & Phrasal Verbs" },
    { label: "🤝 Subject-Verb Agreement", topic: "English Grammar: Subject-Verb Agreement" },
    { label: "🔄 Active & Passive Voice", topic: "English Grammar: Active & Passive Voice" },
    { label: "🗣️ Direct & Indirect Speech", topic: "English Grammar: Direct & Indirect Speech" }
  ],
  subj_computer: [
    { label: "📊 MS Office & Excel", topic: "Computer: MS Word, Excel & Shortcut Keys" },
    { label: "🌐 Internet & Security", topic: "Computer: Internet, Networking & Cyber Security" },
    { label: "💾 Hardware & Memory", topic: "Computer: CPU, RAM, ROM & Storage" },
    { label: "🖥️ OS & File Systems", topic: "Computer: Operating Systems & GUI Basics" }
  ],
  subj_gk_gs: [
    { label: "🏛️ Punjab History & Sikh Gurus", topic: "Punjab History: Sikh Gurus & Anglo-Sikh Wars" },
    { label: "📜 Indian Constitution", topic: "Polity: Fundamental Rights & Articles" },
    { label: "🌊 Rivers of Punjab", topic: "Punjab Geography: Rivers, Canals & Soils" },
    { label: "🇮🇳 Freedom Struggle", topic: "Indian Modern History: Freedom Struggle 1857-1947" }
  ],
  subj_ca: [
    { label: "📰 Important Govt Schemes", topic: "Current Affairs: Punjab & Central Schemes" },
    { label: "🏆 Sports, Medals & Awards", topic: "Current Affairs: Sports, Olympic & National Awards" },
    { label: "🌐 Summits & Appointments", topic: "Current Affairs: Global Summits & New Appointments" },
    { label: "📈 Union & State Budget", topic: "Current Affairs: Economic Survey & Key Budget Points" }
  ]
};

function initAiTestView() {
  populateAiSubjectSelect();
  updateAiKeyStatusBadge();
  renderPastAiTests();

  const ytInp = document.getElementById('input-yt-url');
  if (ytInp && !ytInp.value) {
    const subjects = (typeof state !== 'undefined' && Array.isArray(state.subjects) && state.subjects.length > 0)
      ? state.subjects
      : (typeof DEFAULT_SUBJECTS !== 'undefined' ? DEFAULT_SUBJECTS : []);
    const subj = subjects.find(s => s.id === selectedAiSubjectId) || subjects[0];
    if (subj) {
      ytInp.value = `${getSubjectName(subj)}: Key Exam Concepts & Drill`;
    }
  }
}

function selectAiSubject(subjId) {
  selectedAiSubjectId = subjId;
  const sel = document.getElementById('select-ai-subject');
  if (sel) sel.value = subjId;

  const subjects = (typeof state !== 'undefined' && Array.isArray(state.subjects) && state.subjects.length > 0)
    ? state.subjects
    : (typeof DEFAULT_SUBJECTS !== 'undefined' ? DEFAULT_SUBJECTS : []);
  const subj = subjects.find(s => s.id === subjId) || { name: 'General', id: subjId };

  const nameBadge = document.getElementById('ai-selected-subj-name');
  if (nameBadge) {
    nameBadge.textContent = `${getSubjectIcon(subj)} ${getSubjectName(subj)}`;
  }

  // Update Visual Cards Active Highlight
  const grid = document.getElementById('ai-subject-cards-grid');
  if (grid) {
    grid.querySelectorAll('.ai-subj-card-btn').forEach(btn => {
      const bId = btn.getAttribute('data-subj-id');
      const isSelected = (bId === subjId);
      if (isSelected) {
        btn.className = "ai-subj-card-btn tap-btn p-2.5 rounded-xl border border-emerald-400 bg-emerald-500/20 text-white font-bold ring-2 ring-emerald-500/40 shadow flex items-center gap-2 text-left transition";
        const chk = btn.querySelector('.ai-subj-check');
        if (chk) chk.classList.remove('hidden');
      } else {
        btn.className = "ai-subj-card-btn tap-btn p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 font-semibold flex items-center gap-2 text-left transition";
        const chk = btn.querySelector('.ai-subj-check');
        if (chk) chk.classList.add('hidden');
      }
    });
  }

  // Render quick chips for this subject
  renderSubjectTopicChips(subjId);

  // Update input placeholder / default topic if empty or user hasn't typed custom URL
  const ytInput = document.getElementById('input-yt-url');
  if (ytInput && (!ytInput.value || !ytInput.value.includes('http'))) {
    ytInput.placeholder = `e.g. ${getSubjectName(subj)} Important Topics or YouTube lecture link...`;
    ytInput.value = `${getSubjectName(subj)}: Key Exam Drill`;
  }
}

function renderSubjectTopicChips(subjId) {
  const container = document.getElementById('ai-topic-chips-container');
  if (!container) return;
  container.innerHTML = '';

  const presets = SUBJECT_TOPIC_PRESETS[subjId] || [
    { label: "🎯 Full Syllabus Drill", topic: "Comprehensive Subject Mock Exam" },
    { label: "⭐ Most Repeated Questions", topic: "High-Yield Most Repeated MCQs" },
    { label: "🔥 Hard / Advanced", topic: "Tricky Advanced Level Practice Drill" }
  ];

  presets.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-chip tap-btn text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition shadow-sm';
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      const ytInp = document.getElementById('input-yt-url');
      if (ytInp) {
        ytInp.value = p.topic;
        handleYouTubeUrlInput();
      }
      showToast(`Selected topic: ${p.label}`);
    });
    container.appendChild(btn);
  });
}

function populateAiSubjectSelect() {
  const sel = document.getElementById('select-ai-subject');
  const grid = document.getElementById('ai-subject-cards-grid');

  const subjects = (typeof state !== 'undefined' && Array.isArray(state.subjects) && state.subjects.length > 0)
    ? state.subjects
    : (typeof DEFAULT_SUBJECTS !== 'undefined' ? DEFAULT_SUBJECTS : []);

  if (subjects.length === 0) return;

  if (!subjects.some(s => s.id === selectedAiSubjectId)) {
    selectedAiSubjectId = subjects[0].id;
  }

  // 1. Populate Hidden/Fallback Select
  if (sel) {
    sel.innerHTML = '';
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${getSubjectIcon(s)} ${getSubjectName(s)}`;
      if (s.id === selectedAiSubjectId) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.value = selectedAiSubjectId;
  }

  // 2. Populate Visual Cards Grid
  if (grid) {
    grid.innerHTML = '';
    subjects.forEach(s => {
      const isSelected = (s.id === selectedAiSubjectId);
      const card = document.createElement('button');
      card.type = 'button';
      card.setAttribute('data-subj-id', s.id);
      card.className = `ai-subj-card-btn tap-btn p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
        isSelected
          ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold ring-2 ring-emerald-500/40 shadow'
          : 'border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 font-semibold'
      }`;
      card.innerHTML = `
        <span class="text-xl shrink-0">${getSubjectIcon(s)}</span>
        <div class="min-w-0 flex-1">
          <h4 class="text-xs font-bold leading-tight truncate text-white">${getSubjectName(s)}</h4>
          <p class="text-[10px] text-slate-400 truncate">${state.lang === 'pa' ? s.name : (s.name_pa || '')}</p>
        </div>
        <span class="ai-subj-check text-emerald-400 text-xs font-bold shrink-0 ${isSelected ? '' : 'hidden'}">✓</span>
      `;
      card.addEventListener('click', () => {
        selectAiSubject(s.id);
      });
      grid.appendChild(card);
    });
  }

  const selectedSubjObj = subjects.find(s => s.id === selectedAiSubjectId) || subjects[0];
  const nameBadge = document.getElementById('ai-selected-subj-name');
  if (nameBadge && selectedSubjObj) {
    nameBadge.textContent = `${getSubjectIcon(selectedSubjObj)} ${getSubjectName(selectedSubjObj)}`;
  }

  // Render topic chips for initial selection
  renderSubjectTopicChips(selectedAiSubjectId);
}

// Ensure subjects are populated immediately
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateAiSubjectSelect);
  } else {
    setTimeout(populateAiSubjectSelect, 0);
  }
}

function extractYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

async function handleYouTubeUrlInput() {
  const ytInput = document.getElementById('input-yt-url');
  const previewCard = document.getElementById('yt-preview-card');
  const previewThumb = document.getElementById('yt-preview-thumb');
  const previewTitle = document.getElementById('yt-preview-title');
  const previewChannel = document.getElementById('yt-preview-channel');
  if (!ytInput || !previewCard) return;

  const text = ytInput.value.trim();
  const vId = extractYouTubeVideoId(text);
  if (vId) {
    detectedVideoId = vId;
    previewCard.classList.remove('hidden');
    if (previewThumb) previewThumb.src = `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;
    if (previewTitle) previewTitle.textContent = "Fetching lecture title...";
    if (previewChannel) previewChannel.textContent = "YouTube Video";

    try {
      const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.title) {
          detectedVideoTitle = data.title;
          detectedVideoChannel = data.author_name || 'YouTube Educator';
          if (previewTitle) previewTitle.textContent = data.title;
          if (previewChannel) previewChannel.textContent = detectedVideoChannel;
          autoDetectSubjectFromText(data.title);
        }
      }
    } catch (e) {
      if (!detectedVideoTitle && previewTitle) {
        previewTitle.textContent = `YouTube Lecture (ID: ${vId})`;
      }
    }
  } else {
    detectedVideoId = null;
    detectedVideoTitle = '';
    detectedVideoChannel = '';
    previewCard.classList.add('hidden');
    if (text.length > 3) autoDetectSubjectFromText(text);
  }
}

function autoDetectSubjectFromText(text) {
  if (!text) return;
  const lower = text.toLowerCase();
  const sel = document.getElementById('select-ai-subject');
  if (!sel) return;

  if (lower.includes('math') || lower.includes('percentage') || lower.includes('profit') || lower.includes('ratio') || lower.includes('interest')) {
    const match = state.subjects.find(s => s.id === 'subj_maths' || s.name.toLowerCase().includes('math'));
    if (match) sel.value = match.id;
  } else if (lower.includes('reason') || lower.includes('syllogism') || lower.includes('coding') || lower.includes('puzzle') || lower.includes('series')) {
    const match = state.subjects.find(s => s.id === 'subj_reasoning' || s.name.toLowerCase().includes('reason'));
    if (match) sel.value = match.id;
  } else if (lower.includes('punjabi') || lower.includes('ਪੰਜਾਬੀ')) {
    const match = state.subjects.find(s => s.id === 'subj_punjabi' || s.name.toLowerCase().includes('punjabi'));
    if (match) sel.value = match.id;
  } else if (lower.includes('vocab') || lower.includes('english') || lower.includes('grammar') || lower.includes('synonym')) {
    const match = state.subjects.find(s => s.id === 'subj_vocab' || s.id === 'subj_grammar' || s.name.toLowerCase().includes('english'));
    if (match) sel.value = match.id;
  } else if (lower.includes('comp') || lower.includes('excel') || lower.includes('software')) {
    const match = state.subjects.find(s => s.id === 'subj_computer' || s.name.toLowerCase().includes('comp'));
    if (match) sel.value = match.id;
  } else if (lower.includes('current affair') || lower.includes('news')) {
    const match = state.subjects.find(s => s.id === 'subj_ca' || s.name.toLowerCase().includes('current'));
    if (match) sel.value = match.id;
  } else if (lower.includes('gk') || lower.includes('history') || lower.includes('polity') || lower.includes('patwari') || lower.includes('police')) {
    const match = state.subjects.find(s => s.id === 'subj_gk_gs' || s.name.toLowerCase().includes('gk'));
    if (match) sel.value = match.id;
  }
}

function getEffectiveGeminiApiKey() {
  if (window.AndroidBridge && typeof window.AndroidBridge.getGeminiApiKey === 'function') {
    try {
      const bridgeKey = window.AndroidBridge.getGeminiApiKey();
      if (bridgeKey && bridgeKey !== 'MY_GEMINI_API_KEY' && bridgeKey.length > 5) {
        return bridgeKey;
      }
    } catch (e) {}
  }
  if (window.AndroidBridge && typeof window.AndroidBridge.loadData === 'function') {
    try {
      const k = window.AndroidBridge.loadData('gemini_user_api_key');
      if (k && k.trim()) return k.trim();
    } catch (e) {}
  }
  return localStorage.getItem('gemini_user_api_key') || '';
}

function updateAiKeyStatusBadge() {
  const lbl = document.getElementById('lbl-ai-status');
  const badge = document.getElementById('ai-key-status-badge');
  const inpKey = document.getElementById('input-custom-gemini-key');
  let customKey = '';
  if (window.AndroidBridge && typeof window.AndroidBridge.loadData === 'function') {
    try { customKey = window.AndroidBridge.loadData('gemini_user_api_key') || ''; } catch (e) {}
  }
  if (!customKey) customKey = localStorage.getItem('gemini_user_api_key') || '';
  if (inpKey && customKey) inpKey.value = customKey;

  const effectiveKey = getEffectiveGeminiApiKey();
  if (lbl) {
    if (effectiveKey) {
      lbl.textContent = state.lang === 'pa' ? 'Gemini 3.5 Flash AI ਇੰਜਣ ਸਰਗਰਮ' : 'Gemini 3.5 Flash AI Engine Active';
      if (badge) badge.className = 'text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5';
    } else {
      lbl.textContent = state.lang === 'pa' ? 'ਪ੍ਰੀਖਿਆ ਸਿਲੇਬਸ AI ਸਰਗਰਮ (ਔਫਲਾਈਨ ਤਿਆਰ)' : 'Smart Exam Curriculum AI Active (Offline Ready)';
      if (badge) badge.className = 'text-[11px] text-indigo-400 font-medium flex items-center gap-1.5';
    }
  }
}

async function generateAiQuiz() {
  const ytInput = document.getElementById('input-yt-url');
  const subjSel = document.getElementById('select-ai-subject');
  const qCountSel = document.getElementById('select-ai-qcount');
  const diffSel = document.getElementById('select-ai-difficulty');
  const loadingCard = document.getElementById('ai-test-loading-card');
  const genBtn = document.getElementById('btn-generate-ai-test');

  const subjectId = selectedAiSubjectId || (subjSel ? subjSel.value : 'subj_maths');
  const subjObj = state.subjects.find(s => s.id === subjectId) || { name: 'General', id: subjectId };

  let topicOrUrl = ytInput ? ytInput.value.trim() : '';
  if (!topicOrUrl) {
    topicOrUrl = `${getSubjectName(subjObj)} Full Exam Drill`;
    if (ytInput) ytInput.value = topicOrUrl;
  }

  const qCount = parseInt(qCountSel ? qCountSel.value : 10) || 10;
  const difficulty = diffSel ? diffSel.value : 'Medium';

  if (loadingCard) loadingCard.classList.remove('hidden');
  if (genBtn) {
    genBtn.disabled = true;
    genBtn.classList.add('opacity-50', 'pointer-events-none');
  }

  const apiKey = getEffectiveGeminiApiKey();
  let quizData = null;

  const prompt = `You are an expert competitive exam question setter. Formulate ${qCount} multiple-choice questions (MCQs) for students studying: Topic/URL: "${topicOrUrl}", Subject: "${subjObj.name}", Difficulty Level: "${difficulty}". Each question must have exactly 4 options, a correct index (0-3), and a clear step-by-step explanation. Format output strictly as JSON without markdown backticks: {"topicTitle": "string", "questions": [{"id": 1, "question": "string", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "string"}]}`;

  try {
    // 1. Try Native Android Bridge if API key is present
    if (apiKey && window.AndroidBridge && typeof window.AndroidBridge.generateGeminiContent === 'function') {
      try {
        const resStr = window.AndroidBridge.generateGeminiContent(apiKey, prompt);
        if (resStr) {
          const parsedRes = JSON.parse(resStr);
          if (parsedRes && parsedRes.success && parsedRes.text) {
            let cleanText = parsedRes.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
            else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
            const qJson = JSON.parse(cleanText);
            if (qJson && Array.isArray(qJson.questions) && qJson.questions.length > 0) {
              quizData = qJson;
              showToast('✓ AI Test generated via Gemini! ⚡');
            }
          }
        }
      } catch (e) {
        console.warn('Native Gemini call error:', e);
      }
    }

    // 2. Client-side fetch fallback if native call didn't yield questions
    if (!quizData && apiKey) {
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.5-flash'];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
            })
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const resJson = await response.json();
            const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textContent) {
              let cleanText = textContent.trim();
              if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
              else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
              const parsed = JSON.parse(cleanText);
              if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                quizData = parsed;
                showToast(`✓ AI Test generated with ${model}! ⚡`);
                break;
              }
            }
          }
        } catch (e) {
          console.warn(`Gemini ${model} fetch error:`, e);
        }
      }
    }
  } catch (err) {
    console.error('Quiz generation outer error:', err);
  }

  // 3. Guaranteed immediate fallback to rich Syllabus Question Bank
  if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    quizData = generateCurriculumQuiz(topicOrUrl, subjObj, qCount, difficulty, detectedVideoTitle);
    showToast('✓ Test generated from Syllabus Question Bank! ⚡');
  }

  if (loadingCard) loadingCard.classList.add('hidden');
  if (genBtn) {
    genBtn.disabled = false;
    genBtn.classList.remove('opacity-50', 'pointer-events-none');
  }

  startQuizSession(quizData, subjObj);
}

function generateCurriculumQuiz(topic, subjObj, count, difficulty, videoTitle) {
  const title = videoTitle || (topic.length > 5 && !topic.includes('http') ? topic : `${subjObj.name} Exam Test`);
  const subjName = (subjObj.name || '').toLowerCase();
  let questionBank = [];

  if (subjName.includes('math') || topic.toLowerCase().includes('percentage')) {
    questionBank = [
      {
        q: "If the price of sugar increases by 25%, by what percentage must consumption be reduced so expenditure remains unchanged?",
        opts: ["20%", "25%", "16.66%", "15%"],
        c: 0,
        exp: "Formula: [r / (100 + r)] * 100% = [25 / 125] * 100 = 20%."
      },
      {
        q: "A shopkeeper sells an article at ₹840 making a profit of 20%. What was the cost price (CP)?",
        opts: ["₹700", "₹680", "₹720", "₹750"],
        c: 0,
        exp: "CP = (SP * 100) / (100 + Profit%) = (840 * 100) / 120 = ₹700."
      },
      {
        q: "Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, their ratio becomes 12 : 23. Find the smaller number.",
        opts: ["33", "27", "36", "45"],
        c: 0,
        exp: "(3x - 9) / (5x - 9) = 12 / 23 => 69x - 207 = 60x - 108 => 9x = 99 => x = 11. Smaller number = 3 * 11 = 33."
      },
      {
        q: "A can do a piece of work in 12 days and B in 18 days. Working together, in how many days will they finish?",
        opts: ["7.2 days", "8 days", "6.5 days", "9 days"],
        c: 0,
        exp: "Total work = LCM(12, 18) = 36 units. Efficiency = 3 + 2 = 5 units/day. Time = 36 / 5 = 7.2 days."
      },
      {
        q: "A train 180 meters long is running at 72 km/h. How much time will it take to cross a pole?",
        opts: ["9 seconds", "10 seconds", "8 seconds", "12 seconds"],
        c: 0,
        exp: "Speed = 72 * (5 / 18) = 20 m/s. Time = Distance / Speed = 180 / 20 = 9 seconds."
      }
    ];
  } else if (subjName.includes('punjabi')) {
    questionBank = [
      {
        q: "ਪੰਜਾਬੀ ਵਿਆਕਰਨ ਵਿੱਚ 'ਨਾਵ' (Noun) ਕਿੰਨੇ ਪ੍ਰਕਾਰ ਦੇ ਹੁੰਦੇ ਹਨ?",
        opts: ["5 ਪ੍ਰਕਾਰ", "4 ਪ੍ਰਕਾਰ", "6 ਪ੍ਰਕਾਰ", "3 ਪ੍ਰਕਾਰ"],
        c: 0,
        exp: "ਨਾਵ ਦੇ 5 ਭੇਦ ਹੁੰਦੇ ਹਨ: ਆਮ ਨਾਵ, ਖਾਸ ਨਾਵ, ਇਕੱਠ-ਵਾਚਕ, ਵਸਤੂ-ਵਾਚਕ ਅਤੇ ਭਾਵ-ਵਾਚਕ।"
      },
      {
        q: "ਗੁਰਮੁਖੀ ਲਿਪੀ ਵਿੱਚ ਮੂਲ ਅੱਖਰ ਕਿੰਨੇ ਸਨ?",
        opts: ["35 ਅੱਖਰ", "41 ਅੱਖਰ", "32 ਅੱਖਰ", "52 ਅੱਖਰ"],
        c: 0,
        exp: "ਗੁਰਮੁਖੀ ਲਿਪੀ ਵਿੱਚ ਮੂਲ 35 ਅੱਖਰ ਸਨ, ਜਿਸ ਕਰਕੇ ਇਸਨੂੰ 'ਪੈਂਤੀ ਅੱਖਰੀ' ਵੀ ਕਿਹਾ ਜਾਂਦਾ ਹੈ।"
      },
      {
        q: "'ਉਸਤਤ' ਸ਼ਬਦ ਦਾ ਸਹੀ ਵਿਰੋਧੀ ਸ਼ਬਦ ਕੀ ਹੋਵੇਗਾ?",
        opts: ["ਨਿੰਦਿਆ", "ਸ਼ੋਭਾ", "ਤਾਰੀਫ਼", "ਪ੍ਰਸੰਸਾ"],
        c: 0,
        exp: "'ਉਸਤਤ' ਦਾ ਅਰਥ ਤਾਰੀਫ਼ ਕਰਨਾ ਹੁੰਦਾ ਹੈ, ਇਸਦਾ ਉਲਟ ਭਾਵੀ ਸ਼ਬਦ 'ਨਿੰਦਿਆ' ਹੈ।"
      },
      {
        q: "ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਵਿੱਚ 'ਪੜਨਾਂਵ' (Pronoun) ਦੇ ਕਿੰਨੇ ਭੇਦ ਹਨ?",
        opts: ["6 ਭੇਦ", "5 ਭੇਦ", "7 ਭੇਦ", "4 ਭੇਦ"],
        c: 0,
        exp: "ਪੜਨਾਂਵ ਦੇ 6 ਭੇਦ ਹੁੰਦੇ ਹਨ: ਪੁਰਖ-ਵਾਚਕ, ਨਿਜ-ਵਾਚਕ, ਨਿਸ਼ਚੇ-ਵਾਚਕ, ਅਨਿਸ਼ਚੇ-ਵਾਚਕ, ਸੰਬੰਧ-ਵਾਚਕ ਅਤੇ ਪ੍ਰਸ਼ਨ-ਵਾਚਕ।"
      }
    ];
  } else if (subjName.includes('reason')) {
    questionBank = [
      {
        q: "In a certain code, 'TEACHER' is written as 'VGCEJGT'. How will 'STUDENT' be written?",
        opts: ["UVWFGPV", "UVWFFPU", "TUVEFOU", "UVWGHPW"],
        c: 0,
        exp: "Each letter is shifted by +2 (T+2=V, E+2=G). So STUDENT becomes UVWFGPV."
      },
      {
        q: "Complete the series: 4, 9, 25, 49, 121, ?",
        opts: ["169", "144", "196", "225"],
        c: 0,
        exp: "These are squares of consecutive primes: 2², 3², 5², 7², 11², next is 13² = 169."
      },
      {
        q: "Pointing to a photograph, a man said, 'She is the daughter of my grandfather's only son.' Who is she?",
        opts: ["Sister", "Mother", "Aunt", "Daughter"],
        c: 0,
        exp: "Grandfather's only son is the man's father. Father's daughter is his sister."
      }
    ];
  } else if (subjName.includes('vocab') || topic.toLowerCase().includes('synonym') || topic.toLowerCase().includes('antonym')) {
    questionBank = [
      {
        q: "Choose the exact SYNONYM of the word: 'METICULOUS'",
        opts: ["Thorough and careful", "Careless", "Quick", "Lazy"],
        c: 0,
        exp: "'Meticulous' means showing great attention to detail; very careful and precise."
      },
      {
        q: "What is the ANTONYM of 'CANDID'?",
        opts: ["Deceitful / Secretive", "Honest", "Frank", "Direct"],
        c: 0,
        exp: "'Candid' means truthful and straightforward. Its opposite is secretive, insincere, or deceitful."
      },
      {
        q: "Select the correct one-word substitution: 'A person who loves books and reading'",
        opts: ["Bibliophile", "Philatelist", "Polyglot", "Numismatist"],
        c: 0,
        exp: "A 'Bibliophile' is a lover or collector of books. Philatelist collects stamps; Numismatist collects coins."
      },
      {
        q: "What does the idiom 'Burn the midnight oil' mean?",
        opts: ["Work or study late into the night", "Waste expensive fuel", "Cause damage to property", "Feel angry"],
        c: 0,
        exp: "'Burn the midnight oil' is a common idiom meaning to work or study late into the night."
      }
    ];
  } else if (subjName.includes('grammar') || subjName.includes('english')) {
    questionBank = [
      {
        q: "Choose the correct preposition: 'The teacher congratulated Rahul _____ his grand success.'",
        opts: ["on", "for", "at", "about"],
        c: 0,
        exp: "The verb 'congratulate' takes the preposition 'on': Congratulate someone ON something."
      },
      {
        q: "Identify the correct sentence with proper subject-verb agreement:",
        opts: ["Neither of the two candidates is qualified.", "Neither of the two candidates are qualified.", "Neither of the candidates were qualified.", "Neither candidates is qualified."],
        c: 0,
        exp: "'Neither of' followed by a plural noun takes a singular verb ('is')."
      },
      {
        q: "Change into Passive Voice: 'The chef cooked a delicious dinner.'",
        opts: ["A delicious dinner was cooked by the chef.", "A delicious dinner is cooked by the chef.", "A delicious dinner had cooked by the chef.", "Dinner was cooking by the chef."],
        c: 0,
        exp: "Simple past passive: Object + was/were + V3 + by + Subject => 'A delicious dinner was cooked by the chef.'"
      }
    ];
  } else if (subjName.includes('computer') || topic.toLowerCase().includes('excel') || topic.toLowerCase().includes('software')) {
    questionBank = [
      {
        q: "In Microsoft Excel, which function key is used to edit the active cell?",
        opts: ["F2", "F4", "F7", "F12"],
        c: 0,
        exp: "Pressing F2 enters Edit mode for the active cell in MS Excel. F4 repeats the last action or toggles absolute reference."
      },
      {
        q: "Which protocol is primarily used for securely transferring web pages over the internet?",
        opts: ["HTTPS", "FTP", "SMTP", "Telnet"],
        c: 0,
        exp: "HTTPS (Hypertext Transfer Protocol Secure) encrypts communication over computer networks using TLS/SSL."
      },
      {
        q: "Which memory is volatile and loses its content when the computer is turned off?",
        opts: ["RAM (Random Access Memory)", "ROM (Read Only Memory)", "Hard Disk", "SSD"],
        c: 0,
        exp: "RAM is volatile memory; data is lost once power is cut off. ROM, HDD, and SSD are non-volatile."
      },
      {
        q: "What is the full form of PDF in computer terminology?",
        opts: ["Portable Document Format", "Public Data File", "Personal Document File", "Program Download Format"],
        c: 0,
        exp: "PDF stands for Portable Document Format, developed by Adobe in 1993."
      }
    ];
  } else if (subjName.includes('ca') || subjName.includes('affair') || topic.toLowerCase().includes('news')) {
    questionBank = [
      {
        q: "Who is the ex-officio Chairman of the Rajya Sabha in the Indian Parliament?",
        opts: ["Vice-President of India", "Prime Minister", "Speaker of Lok Sabha", "Chief Justice of India"],
        c: 0,
        exp: "According to Article 64 and Article 89 of the Indian Constitution, the Vice-President of India is the ex-officio Chairman of the Rajya Sabha."
      },
      {
        q: "Which organization releases the World Economic Outlook report?",
        opts: ["International Monetary Fund (IMF)", "World Bank", "World Economic Forum", "WTO"],
        c: 0,
        exp: "The World Economic Outlook (WEO) report is published semi-annually by the International Monetary Fund (IMF)."
      },
      {
        q: "In competitive exams, what does 'UPI' stand for in digital banking?",
        opts: ["Unified Payments Interface", "Universal Public Interface", "Unique Payment Integration", "United Postal Institute"],
        c: 0,
        exp: "UPI stands for Unified Payments Interface, developed by the National Payments Corporation of India (NPCI)."
      }
    ];
  } else {
    questionBank = [
      {
        q: "Which river of Punjab does NOT flow through the current Indian Punjab territory?",
        opts: ["Chenab", "Sutlej", "Beas", "Ravi"],
        c: 0,
        exp: "Sutlej, Beas, and Ravi flow through Indian Punjab. Chenab flows in Pakistani Punjab."
      },
      {
        q: "Who laid the foundation of Sri Harmandir Sahib (Golden Temple) in Amritsar?",
        opts: ["Hazrat Mian Mir Ji", "Guru Arjan Dev Ji", "Guru Ram Das Ji", "Bhai Gurdas Ji"],
        c: 0,
        exp: "Guru Arjan Dev Ji invited the Sufi saint Hazrat Mian Mir Ji of Lahore to lay the foundation in 1588."
      },
      {
        q: "Which Article of the Indian Constitution is called the 'Heart and Soul' by Dr. B.R. Ambedkar?",
        opts: ["Article 32 (Constitutional Remedies)", "Article 21 (Life)", "Article 14 (Equality)", "Article 19"],
        c: 0,
        exp: "Dr. B.R. Ambedkar termed Article 32 (Right to Constitutional Remedies via Writs) as Heart and Soul."
      }
    ];
  }

  const questions = [];
  for (let i = 0; i < count; i++) {
    const item = questionBank[i % questionBank.length];
    questions.push({
      id: i + 1,
      question: item.q,
      options: item.opts.slice(),
      correctIndex: item.c,
      explanation: item.exp
    });
  }
  return { topicTitle: title, questions: questions };
}

function startQuizSession(quizData, subjObj) {
  currentAiQuiz = {
    id: 'quiz_' + Date.now(),
    topic: quizData.topicTitle || 'Study Test',
    subjectId: subjObj.id,
    questions: quizData.questions || [],
    date: Date.now()
  };
  currentQuestionIndex = 0;
  userAnswers = {};
  quizSecondsElapsed = 0;

  document.getElementById('ai-test-setup-panel')?.classList.add('hidden');
  document.getElementById('ai-test-results-panel')?.classList.add('hidden');
  document.getElementById('ai-test-player-panel')?.classList.remove('hidden');

  if (quizTimerInterval) clearInterval(quizTimerInterval);
  quizTimerInterval = setInterval(() => {
    quizSecondsElapsed++;
    const m = String(Math.floor(quizSecondsElapsed / 60)).padStart(2, '0');
    const s = String(quizSecondsElapsed % 60).padStart(2, '0');
    const badge = document.getElementById('quiz-timer-badge');
    if (badge) badge.textContent = `⏱️ ${m}:${s}`;
  }, 1000);

  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (!currentAiQuiz || !currentAiQuiz.questions || !currentAiQuiz.questions.length) return;
  const q = currentAiQuiz.questions[currentQuestionIndex];
  if (!q) return;

  const totalQ = currentAiQuiz.questions.length;
  const subj = state.subjects.find(s => s.id === currentAiQuiz.subjectId) || { name: 'General', id: currentAiQuiz.subjectId };

  document.getElementById('quiz-subject-icon-badge').textContent = `${getSubjectIcon(subj)} ${getSubjectName(subj)}`;
  document.getElementById('quiz-player-topic-title').textContent = currentAiQuiz.topic;
  document.getElementById('quiz-question-counter').textContent = `${state.lang === 'pa' ? 'ਪ੍ਰਸ਼ਨ' : 'Question'} ${currentQuestionIndex + 1} of ${totalQ}`;
  document.getElementById('quiz-progress-bar').style.width = `${Math.round(((currentQuestionIndex + 1) / totalQ) * 100)}%`;
  document.getElementById('quiz-q-num-label').textContent = `${state.lang === 'pa' ? 'ਪ੍ਰਸ਼ਨ' : 'Question'} ${currentQuestionIndex + 1}`;
  document.getElementById('quiz-q-text').textContent = q.question;

  const optContainer = document.getElementById('quiz-options-container');
  if (optContainer) {
    optContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    const selectedIndex = userAnswers[currentQuestionIndex];

    q.options.forEach((optText, optIdx) => {
      const isSelected = (selectedIndex === optIdx);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-full p-3 sm:p-3.5 rounded-xl text-left text-xs sm:text-sm border transition flex items-center gap-3 ${
        isSelected
          ? 'bg-emerald-500/20 border-emerald-400 text-white font-semibold ring-2 ring-emerald-500/30 shadow-md'
          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
      }`;
      btn.innerHTML = `
        <span class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
          isSelected ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
        }">${letters[optIdx]}</span>
        <span class="flex-1 leading-relaxed">${escapeHtml(optText)}</span>
        ${isSelected ? '<span class="text-emerald-400 font-bold">✓</span>' : ''}
      `;
      btn.addEventListener('click', () => {
        userAnswers[currentQuestionIndex] = optIdx;
        renderQuizQuestion();
      });
      optContainer.appendChild(btn);
    });
  }

  const prevBtn = document.getElementById('btn-quiz-prev');
  const nextBtn = document.getElementById('btn-quiz-next');
  if (prevBtn) prevBtn.disabled = (currentQuestionIndex === 0);
  if (nextBtn) {
    if (currentQuestionIndex === totalQ - 1) {
      nextBtn.className = "tap-btn px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg";
      nextBtn.textContent = state.lang === 'pa' ? 'ਟੈਸਟ ਜਮ੍ਹਾਂ ਕਰੋ 🚀' : 'Submit Test 🚀';
    } else {
      nextBtn.className = "tap-btn px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow";
      nextBtn.textContent = state.lang === 'pa' ? 'ਅਗਲਾ ਪ੍ਰਸ਼ਨ →' : 'Next Question →';
    }
  }
}

function submitQuiz() {
  if (!currentAiQuiz || !currentAiQuiz.questions) return;
  const total = currentAiQuiz.questions.length;
  let answeredCount = 0;
  for (let i = 0; i < total; i++) {
    if (userAnswers[i] !== undefined) answeredCount++;
  }
  if (answeredCount < total) {
    const unans = total - answeredCount;
    const msg = state.lang === 'pa' ? `ਤੁਹਾਡੇ ${unans} ਪ੍ਰਸ਼ਨ ਅਜੇ ਬਾਕੀ ਹਨ। ਕੀ ਤੁਸੀਂ ਜਮ੍ਹਾਂ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?` : `You have ${unans} unanswered question(s). Submit now?`;
    if (!confirm(msg)) return;
  }

  if (quizTimerInterval) clearInterval(quizTimerInterval);
  let correct = 0;
  currentAiQuiz.questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIndex) correct++;
  });

  const pct = Math.round((correct / total) * 100);
  if (!state.aiTests) state.aiTests = [];
  const record = {
    id: currentAiQuiz.id,
    topic: currentAiQuiz.topic,
    subjectId: currentAiQuiz.subjectId,
    score: correct,
    total: total,
    pct: pct,
    timeTaken: quizSecondsElapsed,
    date: Date.now(),
    questions: currentAiQuiz.questions,
    userAnswers: Object.assign({}, userAnswers)
  };
  state.aiTests.unshift(record);
  saveState();

  lastCompletedQuizRecord = record;
  lastCompletedQuizAnswers = Object.assign({}, userAnswers);

  playTone('bell');
  launchConfetti();
  showQuizResults(record, userAnswers);
}

function showQuizResults(record, answers) {
  lastCompletedQuizRecord = record;
  lastCompletedQuizAnswers = answers;

  document.getElementById('ai-test-setup-panel')?.classList.add('hidden');
  document.getElementById('ai-test-player-panel')?.classList.add('hidden');
  document.getElementById('ai-test-results-panel')?.classList.remove('hidden');

  const m = String(Math.floor((record.timeTaken || 0) / 60)).padStart(2, '0');
  const s = String((record.timeTaken || 0) % 60).padStart(2, '0');

  document.getElementById('quiz-score-num').textContent = `${record.score} / ${record.total}`;
  document.getElementById('quiz-score-pct').textContent = `${record.pct}% Accuracy (${record.pct >= 70 ? 'Pass' : 'Practice More'})`;
  document.getElementById('quiz-count-correct').textContent = record.score;
  document.getElementById('quiz-count-incorrect').textContent = record.total - record.score;
  document.getElementById('quiz-time-taken').textContent = `${m}:${s}`;

  const headline = document.getElementById('quiz-result-headline');
  const sub = document.getElementById('quiz-result-sub');
  if (headline && sub) {
    if (record.pct >= 80) {
      headline.textContent = state.lang === 'pa' ? 'ਸ਼ਾਨਦਾਰ ਪ੍ਰਦਰਸ਼ਨ! 🏆' : 'Outstanding Performance! 🏆';
      sub.textContent = state.lang === 'pa' ? "ਤੁਹਾਡੀ ਇਸ ਵਿਸ਼ੇ 'ਤੇ ਬਹੁਤ ਮਜ਼ਬੂਤ ਪਕੜ ਹੈ!" : 'Exceptional mastery of this lecture!';
    } else if (record.pct >= 50) {
      headline.textContent = state.lang === 'pa' ? 'ਚੰਗਾ ਯਤਨ! ਅਭਿਆਸ ਜਾਰੀ ਰੱਖੋ 🌟' : 'Good Effort! Keep Practicing 🌟';
      sub.textContent = state.lang === 'pa' ? 'ਹੱਲ ਧਿਆਨ ਨਾਲ ਦੇਖੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' : 'Good baseline. Review the explanations below.';
    } else {
      headline.textContent = state.lang === 'pa' ? 'ਦੁਹਰਾਈ ਦੀ ਲੋੜ ਹੈ! 📚' : 'Needs Revision! 📚';
      sub.textContent = state.lang === 'pa' ? 'ਸੰਕਲਪਾਂ ਨੂੰ ਸਮਝਣ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਹੱਲ ਪੜ੍ਹੋ।' : 'Go through the explanations below to master concepts.';
    }
  }

  const solContainer = document.getElementById('quiz-solutions-list');
  if (solContainer) {
    solContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    (record.questions || []).forEach((q, idx) => {
      const userChoice = answers[idx];
      const isCorrect = (userChoice === q.correctIndex);
      const isUnanswered = (userChoice === undefined);
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition ${
        isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'
      } space-y-2.5`;
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1.5">
            <span>${isCorrect ? '✅ Correct' : (isUnanswered ? '⏳ Unanswered' : '❌ Incorrect')}</span>
            <span>•</span>
            <span>Question ${idx + 1}</span>
          </span>
        </div>
        <p class="text-xs sm:text-sm font-semibold text-white leading-relaxed">
          ${escapeHtml(q.question)}
        </p>
        <div class="space-y-1.5 pt-1 text-xs">
          ${q.options.map((opt, oIdx) => {
            let badgeClass = 'bg-slate-900 border-slate-800 text-slate-300';
            let tag = '';
            if (oIdx === q.correctIndex) {
              badgeClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
              tag = ' <span class="text-emerald-400 text-[10px] ml-1.5 font-bold">✅ Correct Answer</span>';
            } else if (oIdx === userChoice) {
              badgeClass = 'bg-red-500/20 border-red-500/40 text-red-300 font-bold';
              tag = ' <span class="text-red-400 text-[10px] ml-1.5 font-bold">❌ Your Choice</span>';
            }
            return `
              <div class="p-2 rounded-xl border flex items-center gap-2 ${badgeClass}">
                <span class="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">${letters[oIdx]}</span>
                <span class="flex-1">${escapeHtml(opt)}${tag}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-1">
          <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">💡 Explanation & Method:</span>
          <p class="leading-relaxed text-slate-300">${escapeHtml(q.explanation || 'Refer to the lecture formulas.')}</p>
        </div>
      `;
      solContainer.appendChild(card);
    });
  }
}

function saveQuizResultsToNotebook(record) {
  if (!record) return;
  let content = `AI Practice Test Results\nScore: ${record.score}/${record.total} (${record.pct}%)\nTopic: ${record.topic}\n\n`;
  (record.questions || []).forEach((q, idx) => {
    content += `Q${idx + 1}: ${q.question}\nCorrect Answer: ${q.options[q.correctIndex]}\nExplanation: ${q.explanation}\n\n`;
  });

  const newNote = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    subjectId: record.subjectId,
    title: `AI Test: ${record.topic} (${record.score}/${record.total})`,
    content: content.trim(),
    images: [],
    drawing: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (!state.notebook) state.notebook = [];
  state.notebook.unshift(newNote);
  saveState();
  showToast(state.lang === 'pa' ? 'ਟੈਸਟ ਨੋਟਸ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਹੋ ਗਿਆ!' : 'Test saved to your Study Notes! 📝');
}

function renderPastAiTests() {
  const container = document.getElementById('ai-past-tests-container');
  const badge = document.getElementById('ai-past-count-badge');
  if (!container) return;
  const list = state.aiTests || [];
  if (badge) badge.textContent = `${list.length} completed`;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
        ${state.lang === 'pa' ? 'ਅਜੇ ਕੋਈ ਟੈਸਟ ਨਹੀਂ ਦਿੱਤਾ। ਉੱਪਰ ਵਿਸ਼ਾ ਦਰਜ ਕਰੋ!' : 'No previous AI tests taken yet. Paste a YouTube link or topic above to start!'}
      </div>
    `;
    return;
  }

  list.slice(0, 15).forEach((test) => {
    const subj = state.subjects.find(s => s.id === test.subjectId) || { name: 'General', id: test.subjectId };
    const icon = getSubjectIcon(subj);
    const dateStr = formatNoteDate(test.date);
    const pct = test.pct !== undefined ? test.pct : Math.round((test.score / test.total) * 100);

    const item = document.createElement('div');
    item.className = 'p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition';
    item.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-base">${pct >= 70 ? '🏆' : (pct >= 40 ? '📈' : '📚')}</span>
        <div class="min-w-0">
          <h5 class="text-xs font-bold text-white truncate">${escapeHtml(test.topic || 'AI Test')}</h5>
          <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            <span class="text-emerald-400 font-semibold">${icon} ${getSubjectName(subj)}</span>
            <span>•</span>
            <span>${dateStr}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="px-2 py-0.5 rounded-lg bg-slate-950 font-bold text-xs ${pct >= 70 ? 'text-emerald-400' : 'text-amber-400'} border border-slate-800">
          ${test.score}/${test.total} (${pct}%)
        </span>
        <button data-review-test="${test.id}" class="tap-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium">
          ${state.lang === 'pa' ? 'ਦੇਖੋ' : 'Review'}
        </button>
        <button data-delete-test="${test.id}" title="Delete record" class="tap-btn w-7 h-7 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs flex items-center justify-center">
          🗑️
        </button>
      </div>
    `;

    item.querySelector(`[data-review-test="${test.id}"]`)?.addEventListener('click', () => {
      showQuizResults(test, test.userAnswers || {});
    });
    item.querySelector(`[data-delete-test="${test.id}"]`)?.addEventListener('click', () => {
      if (confirm('Delete this test record?')) {
        state.aiTests = state.aiTests.filter(t => t.id !== test.id);
        saveState();
        renderPastAiTests();
        showToast('Test record deleted.');
      }
    });
    container.appendChild(item);
  });
}

// Global Window Exports
window.initAiTestView = initAiTestView;
window.populateAiSubjectSelect = populateAiSubjectSelect;
window.selectAiSubject = selectAiSubject;
window.generateAiQuiz = generateAiQuiz;
window.startQuizSession = startQuizSession;
window.renderPastAiTests = renderPastAiTests;
window.handleYouTubeUrlInput = handleYouTubeUrlInput;
window.updateAiKeyStatusBadge = updateAiKeyStatusBadge;
