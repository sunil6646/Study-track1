// ==============================================
// SMART STUDY NOTEBOOK & DRAWING CANVAS MODULE
// ==============================================
let activeNoteSubjectFilter = 'all';
let activeEditingNoteId = null;
let currentNoteImages = [];
let currentDrawingUndoStack = [];
let currentDrawTool = 'pen';
let currentDrawColor = '#ffffff';
let currentDrawSize = 5;
let isCanvasDrawing = false;
let drawCanvasCtx = null;
let lastDrawX = 0;
let lastDrawY = 0;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNoteDate(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]}, ${h}:${m} ${ampm}`;
  } catch (e) {
    return '';
  }
}

function resizeImage(file, maxDimension = 1024, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderSubjectNotes() {
  renderNotebookView();
}

function renderNotebookView() {
  renderNotesSubjectIconsBar();
  renderNotesList();
  const goalDisplay = document.getElementById('lbl-goal-display');
  if (goalDisplay) goalDisplay.textContent = state.targetHours || 6;
}

function renderNotesSubjectIconsBar() {
  const bar = document.getElementById('notes-subject-icons-bar');
  if (!bar) return;
  bar.innerHTML = '';
  const totalNotes = state.notebook.length;
  const totalBadge = document.getElementById('notes-total-count-badge');
  if (totalBadge) totalBadge.textContent = `${totalNotes} Notes`;

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  const isAllActive = (activeNoteSubjectFilter === 'all');
  allBtn.className = `tap-btn px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${
    isAllActive
      ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
  }`;
  allBtn.innerHTML = `
    <span>📚</span>
    <span>${state.lang === 'pa' ? 'ਸਾਰੇ ਨੋਟਸ' : 'All Notes'}</span>
    <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isAllActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${totalNotes}</span>
  `;
  allBtn.addEventListener('click', () => {
    activeNoteSubjectFilter = 'all';
    renderNotesSubjectIconsBar();
    renderNotesList();
  });
  bar.appendChild(allBtn);

  state.subjects.forEach(subj => {
    const count = state.notebook.filter(n => n.subjectId === subj.id).length;
    const isActive = (activeNoteSubjectFilter === subj.id);
    const icon = getSubjectIcon(subj);
    const name = getSubjectName(subj);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tap-btn px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
      isActive
        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md ring-2 ring-emerald-400/40'
        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
    }`;
    btn.innerHTML = `
      <span>${icon}</span>
      <span>${name}</span>
      <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${count}</span>
    `;
    btn.addEventListener('click', () => {
      activeNoteSubjectFilter = subj.id;
      renderNotesSubjectIconsBar();
      renderNotesList();
    });
    bar.appendChild(btn);
  });
}

function renderNotesList() {
  const container = document.getElementById('notes-list-container');
  if (!container) return;
  container.innerHTML = '';
  const searchInp = document.getElementById('input-search-notes');
  const searchKeyword = searchInp ? searchInp.value.toLowerCase().trim() : '';

  let filtered = state.notebook.filter(note => {
    if (activeNoteSubjectFilter !== 'all' && note.subjectId !== activeNoteSubjectFilter) {
      return false;
    }
    if (searchKeyword) {
      const subj = state.subjects.find(s => s.id === note.subjectId);
      const subjName = subj ? (subj.name + ' ' + (subj.name_pa || '')).toLowerCase() : '';
      const t = (note.title || '').toLowerCase();
      const c = (note.content || '').toLowerCase();
      return t.includes(searchKeyword) || c.includes(searchKeyword) || subjName.includes(searchKeyword);
    }
    return true;
  });

  if (filtered.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3';
    let emptyText = state.lang === 'pa' ? 'ਕੋਈ ਨੋਟ ਨਹੀਂ ਮਿਲਿਆ।' : 'No study notes found.';
    if (activeNoteSubjectFilter !== 'all') {
      const s = state.subjects.find(s => s.id === activeNoteSubjectFilter);
      if (s) emptyText = `No notes created for ${getSubjectName(s)} yet.`;
    }
    emptyCard.innerHTML = `
      <div class="text-3xl">📝</div>
      <h4 class="text-sm font-bold text-white">${emptyText}</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Tap "+ New Note" to write comprehensive notes, upload diagrams/photos, or draw freehand sketches!
      </p>
      <button id="btn-empty-create-note" class="tap-btn px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5">
        <span>➕</span> <span>Create First Note</span>
      </button>
    `;
    emptyCard.querySelector('#btn-empty-create-note').addEventListener('click', () => {
      openNoteModal();
    });
    container.appendChild(emptyCard);
    return;
  }

  filtered.forEach(note => {
    const subj = state.subjects.find(s => s.id === note.subjectId) || { name: 'General', id: note.subjectId };
    const icon = getSubjectIcon(subj);
    const name = getSubjectName(subj);
    const dateStr = formatNoteDate(note.createdAt || note.updatedAt);
    const hasImages = Array.isArray(note.images) && note.images.length > 0;
    const hasDrawing = !!note.drawing;

    const card = document.createElement('div');
    card.className = 'p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-3';
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-inner">
            <span>${icon}</span> <span>${name}</span>
          </span>
          <span class="text-[11px] text-slate-400">${dateStr}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button data-action="edit" title="Edit / View Note" class="tap-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1">
            <span>✏️</span> <span class="hidden sm:inline">Open</span>
          </button>
          <button data-action="delete" title="Delete Note" class="tap-btn px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-xs font-semibold text-red-300 border border-red-500/30">
            🗑️
          </button>
        </div>
      </div>
      <h4 class="text-sm sm:text-base font-bold text-white tracking-tight leading-snug cursor-pointer" data-action="open-title">
        ${escapeHtml(note.title || 'Untitled Study Note')}
      </h4>
      ${note.content ? `
        <p class="text-xs text-slate-300 whitespace-pre-line line-clamp-3 leading-relaxed font-normal bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 cursor-pointer" data-action="open-content">
          ${escapeHtml(note.content)}
        </p>
      ` : ''}
      ${hasImages ? `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center gap-1">📷 Photos Attached (${note.images.length})</span>
            <span class="text-[10px] text-emerald-400">Tap photo to enlarge</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            ${note.images.map((imgSrc, i) => `
              <div class="relative group cursor-pointer" data-lightbox-src="${imgSrc}">
                <img src="${imgSrc}" alt="Attached note photo ${i+1}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-700 hover:opacity-90 shadow" />
                <span class="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1 rounded text-white font-mono">🔍</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${hasDrawing ? `
        <div class="space-y-1">
          <span class="text-[11px] text-slate-400 flex items-center gap-1">🎨 Hand-drawn Diagram / Sketch:</span>
          <div class="p-1.5 rounded-xl bg-[#0d131f] border border-slate-800 inline-block max-w-full cursor-pointer" data-lightbox-src="${note.drawing}">
            <img src="${note.drawing}" alt="Hand-drawn diagram" class="max-h-32 sm:max-h-40 rounded-lg object-contain block mx-auto hover:opacity-95" />
          </div>
        </div>
      ` : ''}
    `;

    card.querySelectorAll('[data-action="edit"], [data-action="open-title"], [data-action="open-content"]').forEach(el => {
      el.addEventListener('click', () => openNoteModal(note.id));
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });
    card.querySelectorAll('[data-lightbox-src]').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(thumb.dataset.lightboxSrc);
      });
    });

    container.appendChild(card);
  });
}

function openNoteModal(noteId = null) {
  activeEditingNoteId = noteId;
  const sel = document.getElementById('input-note-subject-select');
  sel.innerHTML = '';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${getSubjectIcon(s)} ${getSubjectName(s)}`;
    sel.appendChild(opt);
  });

  const titleInp = document.getElementById('input-note-title');
  const contentInp = document.getElementById('input-note-content');
  const delBtn = document.getElementById('btn-delete-active-note');
  const heading = document.getElementById('note-modal-heading');
  let existingDrawing = '';

  if (noteId) {
    const note = state.notebook.find(n => n.id === noteId);
    if (note) {
      sel.value = note.subjectId;
      titleInp.value = note.title || '';
      contentInp.value = note.content || '';
      currentNoteImages = Array.isArray(note.images) ? note.images.slice() : [];
      existingDrawing = note.drawing || '';
      delBtn.classList.remove('hidden');
      heading.innerHTML = `<span>✏️</span> <span>${state.lang === 'pa' ? 'ਨੋਟ ਸੰਪਾਦਿਤ ਕਰੋ' : 'Edit Study Note'}</span>`;
    }
  } else {
    if (activeNoteSubjectFilter !== 'all') {
      sel.value = activeNoteSubjectFilter;
    } else if (state.subjects.length > 0) {
      sel.value = state.subjects[0].id;
    }
    titleInp.value = '';
    contentInp.value = '';
    currentNoteImages = [];
    existingDrawing = '';
    delBtn.classList.add('hidden');
    heading.innerHTML = `<span>📝</span> <span>${state.lang === 'pa' ? 'ਨਵਾਂ ਨੋਟ ਬਣਾਓ' : 'Create Study Note'}</span>`;
  }

  renderNoteImagesPreview();
  document.getElementById('note-full-modal').classList.remove('hidden');
  setTimeout(() => setupDrawingCanvas(existingDrawing), 60);
}

function closeNoteModal() {
  document.getElementById('note-full-modal').classList.add('hidden');
  activeEditingNoteId = null;
}

function renderNoteImagesPreview() {
  const grid = document.getElementById('note-images-preview-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (currentNoteImages.length === 0) {
    grid.innerHTML = '<p class="text-xs text-slate-500 m-auto py-2">No photos attached yet. Tap "+ Add Photos" to upload.</p>';
    return;
  }
  currentNoteImages.forEach((imgSrc, idx) => {
    const item = document.createElement('div');
    item.className = 'relative group';
    item.innerHTML = `
      <img src="${imgSrc}" alt="Attached photo" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-700 shadow cursor-pointer" />
      <button type="button" data-del-img="${idx}" title="Remove photo" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow hover:bg-red-500">
        ✕
      </button>
    `;
    item.querySelector('img').addEventListener('click', () => openLightbox(imgSrc));
    item.querySelector(`[data-del-img="${idx}"]`).addEventListener('click', (e) => {
      e.stopPropagation();
      currentNoteImages.splice(idx, 1);
      renderNoteImagesPreview();
    });
    grid.appendChild(item);
  });
}

function setupDrawingCanvas(existingDrawingUrl = '') {
  const canvas = document.getElementById('note-drawing-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || canvas.parentElement.clientWidth || 340;
  canvas.height = 300;
  drawCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
  drawCanvasCtx.fillStyle = '#0d131f';
  drawCanvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  currentDrawingUndoStack = [];

  if (existingDrawingUrl) {
    const img = new Image();
    img.onload = () => {
      drawCanvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveCanvasUndoState();
    };
    img.src = existingDrawingUrl;
  } else {
    saveCanvasUndoState();
  }

  canvas.onpointerdown = (e) => {
    isCanvasDrawing = true;
    canvas.setPointerCapture(e.pointerId);
    const cRect = canvas.getBoundingClientRect();
    lastDrawX = e.clientX - cRect.left;
    lastDrawY = e.clientY - cRect.top;
    drawCanvasCtx.beginPath();
    drawCanvasCtx.moveTo(lastDrawX, lastDrawY);
  };

  canvas.onpointermove = (e) => {
    if (!isCanvasDrawing) return;
    const cRect = canvas.getBoundingClientRect();
    const curX = e.clientX - cRect.left;
    const curY = e.clientY - cRect.top;
    drawCanvasCtx.strokeStyle = (currentDrawTool === 'eraser') ? '#0d131f' : currentDrawColor;
    drawCanvasCtx.lineWidth = (currentDrawTool === 'eraser') ? currentDrawSize * 3.5 : currentDrawSize;
    drawCanvasCtx.lineCap = 'round';
    drawCanvasCtx.lineJoin = 'round';
    drawCanvasCtx.lineTo(curX, curY);
    drawCanvasCtx.stroke();
    drawCanvasCtx.beginPath();
    drawCanvasCtx.moveTo(curX, curY);
  };

  canvas.onpointerup = (e) => {
    if (isCanvasDrawing) {
      isCanvasDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      saveCanvasUndoState();
    }
  };

  canvas.onpointercancel = (e) => {
    if (isCanvasDrawing) {
      isCanvasDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      saveCanvasUndoState();
    }
  };
}

function saveCanvasUndoState() {
  const canvas = document.getElementById('note-drawing-canvas');
  if (!canvas || !drawCanvasCtx) return;
  if (currentDrawingUndoStack.length > 20) currentDrawingUndoStack.shift();
  currentDrawingUndoStack.push(drawCanvasCtx.getImageData(0, 0, canvas.width, canvas.height));
}

function undoCanvasDraw() {
  const canvas = document.getElementById('note-drawing-canvas');
  if (!canvas || !drawCanvasCtx || currentDrawingUndoStack.length <= 1) return;
  currentDrawingUndoStack.pop();
  const prevState = currentDrawingUndoStack[currentDrawingUndoStack.length - 1];
  drawCanvasCtx.putImageData(prevState, 0, 0);
}

function clearCanvasDraw() {
  const canvas = document.getElementById('note-drawing-canvas');
  if (!canvas || !drawCanvasCtx) return;
  drawCanvasCtx.fillStyle = '#0d131f';
  drawCanvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  saveCanvasUndoState();
}

function isCanvasDrawnOn() {
  return currentDrawingUndoStack.length > 1;
}

function saveFullNote() {
  const sel = document.getElementById('input-note-subject-select');
  const titleInp = document.getElementById('input-note-title');
  const contentInp = document.getElementById('input-note-content');
  const canvas = document.getElementById('note-drawing-canvas');
  const subjectId = sel.value;
  const title = titleInp.value.trim();
  const content = contentInp.value.trim();

  if (!title && !content && currentNoteImages.length === 0 && !isCanvasDrawnOn()) {
    showToast('Please enter text, upload a photo, or draw a sketch.');
    return;
  }

  let drawingData = '';
  if (isCanvasDrawnOn() && canvas) {
    drawingData = canvas.toDataURL('image/png');
  }

  const now = Date.now();
  if (activeEditingNoteId) {
    const idx = state.notebook.findIndex(n => n.id === activeEditingNoteId);
    if (idx !== -1) {
      state.notebook[idx].subjectId = subjectId;
      state.notebook[idx].title = title || 'Study Note';
      state.notebook[idx].content = content;
      state.notebook[idx].images = currentNoteImages;
      if (drawingData) state.notebook[idx].drawing = drawingData;
      state.notebook[idx].updatedAt = now;
    }
  } else {
    const newNote = {
      id: 'note_' + now + '_' + Math.random().toString(36).substr(2, 5),
      subjectId: subjectId,
      title: title || 'Study Note',
      content: content,
      images: currentNoteImages,
      drawing: drawingData,
      createdAt: now,
      updatedAt: now
    };
    state.notebook.unshift(newNote);
  }

  saveState();
  renderNotebookView();
  closeNoteModal();
  showToast('Study note saved successfully! 📝');
}

function deleteNote(noteId) {
  if (!confirm('Are you sure you want to delete this note?')) return;
  state.notebook = state.notebook.filter(n => n.id !== noteId);
  saveState();
  renderNotebookView();
  closeNoteModal();
  showToast('Note deleted.');
}

function openLightbox(imgSrc) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (modal && img) {
    img.src = imgSrc;
    modal.classList.remove('hidden');
  }
}

function closeLightbox() {
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) modal.classList.add('hidden');
}
