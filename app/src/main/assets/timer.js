// ==============================================
// CUSTOMIZABLE TIMER MODULE
// ==============================================
let currentTimerMode = 'study'; // 'study' | 'short' | 'long'
let timerRemainingSeconds = 25 * 60;
let timerTotalSeconds = 25 * 60;
let timerInterval = null;
let isTimerRunning = false;
let completedSessionsCount = 0;
let todayFocusedMinutes = 0;

function populateTimerSubjectsSelect() {
  const sel = document.getElementById('timer-subject-select');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${getSubjectIcon(s)} ${getSubjectName(s)}`;
    sel.appendChild(opt);
  });
  if (currentVal && state.subjects.some(s => s.id === currentVal)) {
    sel.value = currentVal;
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timerRemainingSeconds / 60);
  const s = timerRemainingSeconds % 60;
  const countdownEl = document.getElementById('timer-countdown-text');
  if (countdownEl) {
    countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  const circle = document.getElementById('timer-circle-progress');
  if (circle) {
    const circumference = 276.46;
    const progress = timerTotalSeconds > 0 ? (timerRemainingSeconds / timerTotalSeconds) : 0;
    circle.style.strokeDashoffset = circumference * (1 - progress);
  }
}

function setTimerMode(mode) {
  currentTimerMode = mode;
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }
  const studyMins = parseInt(document.getElementById('input-study-mins')?.value) || 25;
  const shortMins = parseInt(document.getElementById('input-short-mins')?.value) || 5;
  const longMins = parseInt(document.getElementById('input-long-mins')?.value) || 15;

  const rBtn = document.getElementById('mode-reading-btn');
  const sBtn = document.getElementById('mode-short-btn');
  const lBtn = document.getElementById('mode-long-btn');
  const circle = document.getElementById('timer-circle-progress');

  if (rBtn && sBtn && lBtn) {
    rBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
    sBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
    lBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";

    let mins = studyMins;
    if (mode === 'study') {
      rBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 shadow transition";
      if (circle) circle.setAttribute('stroke', '#10b981');
      mins = studyMins;
    } else if (mode === 'short') {
      sBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow transition";
      if (circle) circle.setAttribute('stroke', '#f59e0b');
      mins = shortMins;
    } else if (mode === 'long') {
      lBtn.className = "flex-1 py-2 px-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 shadow transition";
      if (circle) circle.setAttribute('stroke', '#0ea5e9');
      mins = longMins;
    }

    timerTotalSeconds = mins * 60;
    timerRemainingSeconds = mins * 60;

    const statusBadge = document.getElementById('timer-status-badge');
    if (statusBadge) statusBadge.textContent = 'Ready';
    const playIcon = document.getElementById('timer-play-icon');
    if (playIcon) playIcon.textContent = '▶️';
    const btnText = document.getElementById('timer-btn-text');
    if (btnText) btnText.textContent = state.lang === 'pa' ? 'ਸ਼ੁਰੂ ਕਰੋ' : 'Start Focus';

    updateTimerDisplay();
  }
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    document.getElementById('timer-status-badge').textContent = 'Paused';
    document.getElementById('timer-play-icon').textContent = '▶️';
    document.getElementById('timer-btn-text').textContent = state.lang === 'pa' ? 'ਜਾਰੀ ਰੱਖੋ' : 'Resume';
  } else {
    isTimerRunning = true;
    document.getElementById('timer-status-badge').textContent = 'Active';
    document.getElementById('timer-play-icon').textContent = '⏸️';
    document.getElementById('timer-btn-text').textContent = state.lang === 'pa' ? 'ਰੋਕੋ' : 'Pause';

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        playTone('bell');
        launchConfetti();
        document.getElementById('timer-status-badge').textContent = 'Completed!';
        document.getElementById('timer-play-icon').textContent = '▶️';
        document.getElementById('timer-btn-text').textContent = 'Start Focus';

        if (currentTimerMode === 'study') {
          completedSessionsCount++;
          document.getElementById('timer-session-count').textContent = completedSessionsCount;
          const studyMins = parseInt(document.getElementById('input-study-mins').value) || 25;
          todayFocusedMinutes += studyMins;
          document.getElementById('timer-today-focus-mins').textContent = `${todayFocusedMinutes} min`;

          const sel = document.getElementById('timer-subject-select');
          const targetSubjId = sel ? sel.value : null;
          const activeDate = getActiveDate();
          if (targetSubjId) {
            if (!state.timeSpent[activeDate]) state.timeSpent[activeDate] = {};
            state.timeSpent[activeDate][targetSubjId] = (state.timeSpent[activeDate][targetSubjId] || 0) + studyMins;
            saveState();
            renderChecklist();
            showToast(`+${studyMins}m logged to ${sel.options[sel.selectedIndex]?.text || ''}`);
          }
        } else {
          showToast('Break session ended! Ready for next focus study session?');
        }
      }
    }, 1000);
  }
}

function resetTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
  }
  setTimerMode(currentTimerMode);
}
