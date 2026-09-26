// ==============================================
// IN-APP YOUTUBE PLAYLIST & VIDEO STREAMING MODULE
// ==============================================
let activeLectureSubjectFilter = 'all';
let currentPlayingPlaylistId = null;
let currentPlayingVideoIndex = 0;
let lectureStudyTimeTicker = null;
let lectureSessionMinutesLogged = 0;
let pendingFetchedVideos = null;

// URL & ID Extraction Helpers
function extractYouTubePlaylistId(input) {
  if (!input) return null;
  const str = String(input).trim();
  // Check for playlist list= parameter
  const match = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Direct playlist ID pattern
  const directMatch = str.match(/\b((?:PL|UU|FL|RD|OLAK5uy)[a-zA-Z0-9_-]{10,})\b/);
  if (directMatch) {
    return directMatch[1];
  }
  return null;
}

function extractYouTubeVideoId(input) {
  if (!input) return null;
  const str = String(input).trim();
  // Check standard YouTube video ID in URLs
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  return null;
}

function formatDuration(mins) {
  const m = parseInt(mins, 10);
  if (!m || m <= 0) return '⏱️ Auto';
  if (m < 60) return `${m}m`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function calculatePlaylistProgress(playlist) {
  if (!playlist || !Array.isArray(playlist.videos) || playlist.videos.length === 0) {
    return { watchedCount: 0, totalCount: 0, percentage: 0 };
  }
  const totalCount = playlist.videos.length;
  const watchedCount = playlist.videos.filter(v => v.status === 'watched').length;
  const percentage = Math.round((watchedCount / totalCount) * 100);
  return { watchedCount, totalCount, percentage };
}

// Fetch Real YouTube Playlist Data
async function fetchPlaylistData(playlistId) {
  // 1. Try Native Android Bridge (fetches YouTube RSS Feed)
  if (window.AndroidBridge && typeof window.AndroidBridge.fetchYouTubePlaylist === 'function') {
    try {
      const res = window.AndroidBridge.fetchYouTubePlaylist(playlistId);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed && parsed.success && Array.isArray(parsed.videos) && parsed.videos.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('AndroidBridge playlist fetch error:', e);
    }
  }

  // 2. Client-side fallback via public Invidious instances
  const invidiousInstances = [
    `https://inv.nadeko.net/api/v1/playlists/${playlistId}`,
    `https://invidious.nerdvpn.de/api/v1/playlists/${playlistId}`
  ];
  for (const url of invidiousInstances) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
          return {
            success: true,
            title: data.title || 'Lecture Series',
            playlistId: playlistId,
            videos: data.videos.map((v, i) => ({
              id: 'vid_' + (v.videoId || (Date.now() + '_' + i)),
              youtubeVideoId: v.videoId || '',
              title: v.title || `Lecture ${i + 1}`,
              durationMins: v.lengthSeconds ? Math.max(1, Math.round(v.lengthSeconds / 60)) : 0,
              status: 'unwatched'
            }))
          };
        }
      }
    } catch (e) {}
  }

  return null;
}

// Fetch Single Video Details
async function fetchVideoData(videoId) {
  if (window.AndroidBridge && typeof window.AndroidBridge.fetchYouTubeVideoDetails === 'function') {
    try {
      const res = window.AndroidBridge.fetchYouTubeVideoDetails(videoId);
      if (res) {
        const parsed = JSON.parse(res);
        if (parsed && parsed.success) return parsed;
      }
    } catch (e) {}
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}&format=json`;
    const resp = await fetch(oembedUrl);
    if (resp.ok) {
      const data = await resp.json();
      return { success: true, title: data.title, videoId: videoId };
    }
  } catch (e) {}

  return null;
}

function renderLecturesHub() {
  renderLectureSubjectFilterBar();
  renderPlaylistsList();
}

function renderLectureSubjectFilterBar() {
  const bar = document.getElementById('lectures-subject-filter-bar');
  if (!bar) return;
  bar.innerHTML = '';

  const playlists = Array.isArray(state.playlists) ? state.playlists : [];
  const totalPlaylists = playlists.length;
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  const isAll = (activeLectureSubjectFilter === 'all');
  allBtn.className = `tap-btn px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${
    isAll 
      ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40' 
      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
  }`;
  allBtn.innerHTML = `
    <span>🎬</span>
    <span>${state.lang === 'pa' ? 'ਸਾਰੀਆਂ ਪਲੇਲਿਸਟਾਂ' : 'All Series'}</span>
    <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isAll ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${totalPlaylists}</span>
  `;
  allBtn.addEventListener('click', () => {
    activeLectureSubjectFilter = 'all';
    renderLectureSubjectFilterBar();
    renderPlaylistsList();
  });
  bar.appendChild(allBtn);

  state.subjects.forEach(subj => {
    const count = playlists.filter(p => p.subjectId === subj.id).length;
    const isActive = (activeLectureSubjectFilter === subj.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tap-btn px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
      isActive 
        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md ring-2 ring-emerald-400/40' 
        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
    }`;
    btn.innerHTML = `
      <span>${getSubjectIcon(subj)}</span>
      <span>${getSubjectName(subj)}</span>
      <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${count}</span>
    `;
    btn.addEventListener('click', () => {
      activeLectureSubjectFilter = subj.id;
      renderLectureSubjectFilterBar();
      renderPlaylistsList();
    });
    bar.appendChild(btn);
  });
}

function renderPlaylistsList() {
  const container = document.getElementById('playlists-cards-container');
  if (!container) return;
  container.innerHTML = '';

  const playlists = Array.isArray(state.playlists) ? state.playlists : [];
  let list = playlists.filter(p => {
    if (activeLectureSubjectFilter !== 'all' && p.subjectId !== activeLectureSubjectFilter) {
      return false;
    }
    return true;
  });

  if (list.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3';
    emptyCard.innerHTML = `
      <div class="text-3xl">📺</div>
      <h4 class="text-sm font-bold text-white">${state.lang === 'pa' ? 'ਕੋਈ ਪਲੇਲਿਸਟ ਨਹੀਂ ਮਿਲੀ' : 'No Playlists Added Yet'}</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Tap the <b>Add Playlist</b> button above to paste any YouTube playlist link or video URL and start watching lectures inside the app!
      </p>
      <button id="btn-empty-add-pl" type="button" class="tap-btn px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow">
        <span>➕</span> <span>Add YouTube Playlist</span>
      </button>
    `;
    emptyCard.querySelector('#btn-empty-add-pl').addEventListener('click', openAddPlaylistModal);
    container.appendChild(emptyCard);
    return;
  }

  list.forEach(playlist => {
    const subj = state.subjects.find(s => s.id === playlist.subjectId) || { name: 'General', id: playlist.subjectId };
    const { watchedCount, totalCount, percentage } = calculatePlaylistProgress(playlist);

    // Calculate total minutes for the playlist
    const totalMinutes = (playlist.videos || []).reduce((acc, v) => acc + (v.durationMins || 0), 0);
    const durationText = totalMinutes > 0 ? ` · ⏱️ ${formatDuration(totalMinutes)}` : '';

    const card = document.createElement('div');
    card.className = 'p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-md space-y-3.5';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <span>${getSubjectIcon(subj)}</span> <span>${getSubjectName(subj)}</span>
            </span>
            <span class="text-[11px] text-slate-400 font-medium">📺 ${totalCount} Lectures${durationText}</span>
          </div>
          <h4 class="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug line-clamp-2">
            ${escapeHtml(playlist.title)}
          </h4>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button data-action="delete" title="Delete playlist" class="tap-btn w-8 h-8 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 flex items-center justify-center text-xs border border-red-500/20">
            🗑️
          </button>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">Study Progress:</span>
          <span class="font-bold text-emerald-400">${watchedCount}/${totalCount} Completed (${percentage}%)</span>
        </div>
        <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: ${percentage}%;"></div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
        <span class="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
          ${playlist.videos.length > 0 ? `Next: ${escapeHtml(playlist.videos.find(v => v.status !== 'watched')?.title || 'All Completed! 🎉')}` : ''}
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button data-action="add-lecture" class="tap-btn px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center gap-1" title="Add today's new lecture">
            <span>➕ Lecture</span>
          </button>
          <button data-action="sync-playlist" class="tap-btn px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1" title="Sync & Check for new lectures">
            <span>🔄</span>
          </button>
          <button data-action="play" class="tap-btn px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5">
            <span>▶️</span> <span>Watch</span>
          </button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="play"]').addEventListener('click', () => {
      let targetIdx = playlist.videos.findIndex(v => v.status !== 'watched');
      if (targetIdx === -1) targetIdx = 0;
      openInAppPlayer(playlist.id, targetIdx);
    });

    card.querySelector('[data-action="add-lecture"]').addEventListener('click', (e) => {
      e.stopPropagation();
      addNewLectureToPlaylist(playlist.id);
    });

    card.querySelector('[data-action="sync-playlist"]').addEventListener('click', (e) => {
      e.stopPropagation();
      syncPlaylistLectures(playlist.id);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this playlist series?')) {
        state.playlists = state.playlists.filter(p => p.id !== playlist.id);
        saveState();
        renderPlaylistsList();
        renderLectureSubjectFilterBar();
        showToast('Playlist removed.');
      }
    });

    container.appendChild(card);
  });
}

function openAddPlaylistModal() {
  const modal = document.getElementById('add-playlist-modal');
  const sel = document.getElementById('input-pl-subject-select');
  if (!modal || !sel) return;

  sel.innerHTML = '';
  state.subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${getSubjectIcon(s)} ${getSubjectName(s)}`;
    sel.appendChild(opt);
  });

  if (activeLectureSubjectFilter !== 'all') {
    sel.value = activeLectureSubjectFilter;
  }

  const urlInput = document.getElementById('input-pl-url');
  if (urlInput) urlInput.value = '';
  const titleInput = document.getElementById('input-pl-title');
  if (titleInput) titleInput.value = '';
  const customVideosInp = document.getElementById('input-pl-custom-videos');
  if (customVideosInp) customVideosInp.value = '';
  const statusBadge = document.getElementById('pl-url-detected-status');
  if (statusBadge) statusBadge.classList.add('hidden');

  pendingFetchedVideos = null;
  setPartCountSelection(10);

  modal.classList.remove('hidden');
}

function closeAddPlaylistModal() {
  document.getElementById('add-playlist-modal')?.classList.add('hidden');
  pendingFetchedVideos = null;
}

function setPartCountSelection(count) {
  const inp = document.getElementById('input-pl-part-count');
  if (inp) inp.value = count;
  document.querySelectorAll('.pl-count-btn').forEach(b => {
    if (b.dataset.count == count) {
      b.className = "pl-count-btn py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold";
    } else {
      b.className = "pl-count-btn py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700";
    }
  });
}

// Process pasted link and fetch real playlist videos
async function processPlaylistLink(quiet = false) {
  const urlInput = document.getElementById('input-pl-url');
  const statusBadge = document.getElementById('pl-url-detected-status');
  const titleInp = document.getElementById('input-pl-title');
  if (!urlInput) return;

  const raw = urlInput.value.trim();
  if (!raw) {
    if (statusBadge) statusBadge.classList.add('hidden');
    if (!quiet) showToast('Please enter a YouTube URL first.');
    return;
  }

  const plId = extractYouTubePlaylistId(raw);
  const vId = extractYouTubeVideoId(raw);

  if (plId) {
    if (statusBadge) {
      statusBadge.textContent = '⏳ Fetching YouTube Playlist...';
      statusBadge.className = 'text-[10px] text-amber-400 font-bold block animate-pulse';
    }

    try {
      const plData = await fetchPlaylistData(plId);
      if (plData && plData.videos && plData.videos.length > 0) {
        pendingFetchedVideos = plData.videos;
        if (titleInp && !titleInp.value.trim() && plData.title) {
          titleInp.value = plData.title;
        }
        if (statusBadge) {
          statusBadge.textContent = `✓ Found ${plData.videos.length} videos from YouTube!`;
          statusBadge.className = 'text-[10px] text-emerald-400 font-bold block';
        }
        if (!quiet) showToast(`✓ Loaded ${plData.videos.length} videos from YouTube playlist!`);
        return;
      }
    } catch (e) {
      console.warn('fetchPlaylistData error:', e);
    }

    if (statusBadge) {
      statusBadge.textContent = `✓ Playlist Link Detected`;
      statusBadge.className = 'text-[10px] text-emerald-400 font-bold block';
    }
  } else if (vId) {
    if (statusBadge) {
      statusBadge.textContent = '⏳ Loading Video Details...';
      statusBadge.className = 'text-[10px] text-amber-400 font-bold block animate-pulse';
    }

    setPartCountSelection(1);
    try {
      const vData = await fetchVideoData(vId);
      if (vData && vData.title) {
        if (titleInp && !titleInp.value.trim()) {
          titleInp.value = vData.title;
        }
        pendingFetchedVideos = [{
          id: 'vid_' + vId,
          youtubeVideoId: vId,
          title: vData.title,
          durationMins: 0,
          status: 'unwatched'
        }];
        if (statusBadge) {
          statusBadge.textContent = `✓ Single Video: "${vData.title.slice(0, 30)}..."`;
          statusBadge.className = 'text-[10px] text-emerald-400 font-bold block';
        }
        if (!quiet) showToast('✓ Single video verified!');
        return;
      }
    } catch (e) {}

    if (statusBadge) {
      statusBadge.textContent = `✓ Single Video Detected (${vId})`;
      statusBadge.className = 'text-[10px] text-emerald-400 font-bold block';
    }
  } else {
    if (statusBadge) {
      statusBadge.textContent = '⚠️ Not recognized as YouTube link';
      statusBadge.className = 'text-[10px] text-amber-400 font-semibold block';
    }
    if (!quiet) showToast('Please enter a valid YouTube video or playlist link.');
  }
}

async function handleSavePlaylist() {
  const sel = document.getElementById('input-pl-subject-select');
  const titleInp = document.getElementById('input-pl-title');
  const urlInp = document.getElementById('input-pl-url');
  const customVideosInp = document.getElementById('input-pl-custom-videos');
  const partCountInp = document.getElementById('input-pl-part-count');

  const subjectId = sel ? sel.value : state.subjects[0].id;
  let title = titleInp ? titleInp.value.trim() : '';
  const url = urlInp ? urlInp.value.trim() : '';
  const customVideosText = customVideosInp ? customVideosInp.value.trim() : '';
  const targetCount = parseInt(partCountInp ? partCountInp.value : '10', 10) || 10;

  if (!url && !customVideosText && !title) {
    showToast('Please enter a YouTube link or playlist title.');
    return;
  }

  const playlistId = extractYouTubePlaylistId(url);
  const singleVideoId = extractYouTubeVideoId(url);

  let videos = [];

  // Priority 1: If we have pre-fetched real videos from YouTube RSS/API
  if (pendingFetchedVideos && pendingFetchedVideos.length > 0) {
    videos = pendingFetchedVideos;
  }

  // Priority 2: If user entered custom video entries (one per line)
  if (videos.length === 0 && customVideosText) {
    const lines = customVideosText.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const vId = extractYouTubeVideoId(trimmed);
      let vTitle = trimmed.replace(/https?:\/\/[^\s]+/g, '').trim();
      if (!vTitle) vTitle = `Lecture ${idx + 1}`;
      videos.push({
        id: 'vid_' + (vId || (Date.now() + '_' + idx)),
        youtubeVideoId: vId || (singleVideoId || ''),
        title: vTitle,
        durationMins: 0,
        status: 'unwatched'
      });
    });
  }

  // Priority 3: If it's a playlist but not pre-fetched yet, attempt instant fetch
  if (videos.length === 0 && playlistId) {
    showToast('Fetching playlist videos from YouTube...');
    try {
      const plData = await fetchPlaylistData(playlistId);
      if (plData && plData.videos && plData.videos.length > 0) {
        videos = plData.videos;
        if (!title && plData.title) title = plData.title;
      }
    } catch (e) {}
  }

  // Priority 4: If it's a single video
  if (videos.length === 0 && singleVideoId && !playlistId) {
    videos.push({
      id: 'vid_' + singleVideoId,
      youtubeVideoId: singleVideoId,
      title: title || 'Lecture Video',
      durationMins: 0,
      status: 'unwatched'
    });
  }

  // Priority 5: Fallback if offline or manual series without direct videos
  if (videos.length === 0) {
    const totalToGen = targetCount > 0 ? targetCount : 5;
    for (let i = 1; i <= totalToGen; i++) {
      videos.push({
        id: 'vid_' + (playlistId || 'pl') + '_' + i,
        youtubeVideoId: (i === 1 && singleVideoId) ? singleVideoId : '',
        title: `${title || 'Lecture'} - Part ${i}`,
        durationMins: 0,
        status: 'unwatched'
      });
    }
  }

  if (!title) {
    const subj = state.subjects.find(s => s.id === subjectId);
    title = `${subj ? subj.name : 'Study'} Lecture Series`;
  }

  const newPlaylist = {
    id: 'pl_' + Date.now(),
    subjectId: subjectId,
    title: title,
    youtubePlaylistId: playlistId,
    originalUrl: url,
    videos: videos,
    createdAt: Date.now()
  };

  if (!Array.isArray(state.playlists)) {
    state.playlists = [];
  }
  state.playlists.unshift(newPlaylist);
  saveState();

  pendingFetchedVideos = null;
  activeLectureSubjectFilter = 'all';

  closeAddPlaylistModal();
  renderLecturesHub();
  showToast(`✓ Saved playlist with ${videos.length} lectures! 🎬`);
}

// In-App Player
function openInAppPlayer(playlistId, videoIndex = 0) {
  const playlist = state.playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  if (!playlist.videos || playlist.videos.length === 0) {
    playlist.videos = [{
      id: 'v_init_' + Date.now(),
      youtubeVideoId: '',
      title: playlist.title,
      durationMins: 0,
      status: 'unwatched'
    }];
  }

  currentPlayingPlaylistId = playlistId;
  currentPlayingVideoIndex = Math.max(0, Math.min(videoIndex, playlist.videos.length - 1));

  const modal = document.getElementById('lecture-player-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  startLectureStudyTimer();
  updatePlayerView();
}

function closeInAppPlayer() {
  const modal = document.getElementById('lecture-player-modal');
  if (modal) modal.classList.add('hidden');

  // Stop video iframe to stop audio
  const iframe = document.getElementById('yt-player-iframe');
  if (iframe) iframe.src = '';

  stopLectureStudyTimer();
  renderPlaylistsList();
}

function updatePlayerView() {
  const playlist = state.playlists.find(p => p.id === currentPlayingPlaylistId);
  if (!playlist) return;

  const video = playlist.videos[currentPlayingVideoIndex] || playlist.videos[0];
  if (!video) return;

  const subj = state.subjects.find(s => s.id === playlist.subjectId) || { name: 'General', id: playlist.subjectId };

  // Set titles
  const plName = document.getElementById('player-playlist-name');
  if (plName) plName.textContent = playlist.title;
  const vidTitle = document.getElementById('player-video-title');
  if (vidTitle) vidTitle.textContent = video.title;
  const subjBadge = document.getElementById('player-subject-badge');
  if (subjBadge) subjBadge.textContent = `${getSubjectIcon(subj)} ${getSubjectName(subj)}`;

  // Set Direct YouTube App Links
  const ytVideoUrl = video.youtubeVideoId 
    ? `https://www.youtube.com/watch?v=${video.youtubeVideoId}`
    : (playlist.youtubePlaylistId ? `https://www.youtube.com/playlist?list=${playlist.youtubePlaylistId}` : (playlist.originalUrl || 'https://www.youtube.com'));

  const ytAppLink = document.getElementById('player-open-yt-app-link');
  if (ytAppLink) ytAppLink.href = ytVideoUrl;
  const fallbackYtBtn = document.getElementById('btn-fallback-yt-open');
  if (fallbackYtBtn) fallbackYtBtn.href = ytVideoUrl;

  // Set Standard In-App Embed URL
  const iframe = document.getElementById('yt-player-iframe');
  if (iframe) {
    let embedSrc = '';
    if (video.youtubeVideoId) {
      embedSrc = `https://www.youtube.com/embed/${video.youtubeVideoId}?enablejsapi=1&playsinline=1&rel=0`;
    } else if (playlist.youtubePlaylistId) {
      embedSrc = `https://www.youtube.com/embed/videoseries?list=${playlist.youtubePlaylistId}&playsinline=1&rel=0`;
    } else {
      embedSrc = `https://www.youtube.com/embed/?playsinline=1&rel=0`;
    }

    if (iframe.src !== embedSrc) {
      iframe.src = embedSrc;
    }
  }

  // Update Status Button
  updatePlayerStatusButton(video.status);

  // Render Playlist Videos list drawer
  renderPlayerVideoList(playlist);
}

function updatePlayerStatusButton(status) {
  const btn = document.getElementById('btn-toggle-video-status');
  if (!btn) return;
  if (status === 'watched') {
    btn.className = "tap-btn px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow ring-1 ring-emerald-400";
    btn.innerHTML = "<span>✅</span> <span>Watched</span>";
  } else if (status === 'in_progress') {
    btn.className = "tap-btn px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5";
    btn.innerHTML = "<span>⏳</span> <span>In Progress</span>";
  } else {
    btn.className = "tap-btn px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700";
    btn.innerHTML = "<span>⚪</span> <span>Mark Watched</span>";
  }
}

function updateNumberingOrderButton() {
  const isBottom = (state.lectureNumbering !== 'top'); // default is bottom
  const lbl = document.getElementById('lbl-numbering-order');
  const hint = document.getElementById('player-drawer-numbering-hint');
  if (lbl) lbl.textContent = isBottom ? '1 at Bottom (1,2,3)' : '1 at Top';
  if (hint) hint.textContent = isBottom ? 'Numbering: 1 at bottom (starts 1, 2, 3 from bottom)' : 'Numbering: 1 at top';
}

function renderPlayerVideoList(playlist) {
  const container = document.getElementById('player-videos-drawer-list');
  if (!container) return;
  container.innerHTML = '';

  const { watchedCount, totalCount, percentage } = calculatePlaylistProgress(playlist);
  const progText = document.getElementById('player-drawer-progress-text');
  if (progText) progText.textContent = `${watchedCount}/${totalCount} Watched (${percentage}%)`;

  const isBottomNumbering = (state.lectureNumbering !== 'top'); // default is bottom (1, 2, 3...)
  updateNumberingOrderButton();

  // Wire drawer header buttons
  const toggleNumBtn = document.getElementById('btn-toggle-numbering-order');
  if (toggleNumBtn) {
    toggleNumBtn.onclick = () => {
      state.lectureNumbering = (state.lectureNumbering === 'bottom' || !state.lectureNumbering) ? 'top' : 'bottom';
      saveState();
      updateNumberingOrderButton();
      renderPlayerVideoList(playlist);
      showToast(state.lectureNumbering === 'bottom' ? '✓ Numbering from bottom: 1, 2, 3...' : '✓ Numbering from top: 1, 2, 3...');
    };
  }

  const syncBtn = document.getElementById('btn-player-sync-playlist');
  if (syncBtn) {
    syncBtn.onclick = () => {
      syncPlaylistLectures(playlist.id);
    };
  }

  const addLecBtn = document.getElementById('btn-player-add-lecture');
  if (addLecBtn) {
    addLecBtn.onclick = () => {
      addNewLectureToPlaylist(playlist.id);
    };
  }

  playlist.videos.forEach((vid, idx) => {
    const isCurrent = (idx === currentPlayingVideoIndex);
    const item = document.createElement('div');
    item.className = `w-full p-2.5 rounded-xl text-left text-xs transition flex items-center gap-2.5 cursor-pointer ${
      isCurrent 
        ? 'bg-emerald-500/20 border border-emerald-400 text-white font-bold ring-1 ring-emerald-400/40' 
        : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
    }`;

    const isWatched = (vid.status === 'watched');
    const statusBtnClass = isWatched 
      ? 'w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 shadow'
      : 'w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs shrink-0 border border-slate-700';

    const durText = formatDuration(vid.durationMins);
    // Numbering starting from bottom as 1, 2, 3...
    const displayNum = isBottomNumbering ? (totalCount - idx) : (idx + 1);

    item.innerHTML = `
      <span class="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-mono font-bold ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}">
        ${displayNum}
      </span>
      <div class="flex-1 min-w-0" data-role="select-video">
        <p class="truncate leading-tight">${escapeHtml(vid.title)}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="text-[10px] text-slate-400 font-mono" data-role="duration-badge" title="Tap to adjust duration">${durText}</span>
          <span class="text-[9px] text-slate-500 hover:text-slate-300" data-role="edit-dur">✏️</span>
        </div>
      </div>
      <button type="button" data-role="toggle-status" title="${isWatched ? 'Mark unwatched' : 'Mark watched'}" class="${statusBtnClass}">
        ${isWatched ? '✅' : '⚪'}
      </button>
    `;

    // Row click selects and plays video
    item.querySelector('[data-role="select-video"]').addEventListener('click', () => {
      currentPlayingVideoIndex = idx;
      updatePlayerView();
    });

    // Edit duration
    item.querySelector('[data-role="edit-dur"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      promptEditVideoDuration(playlist.id, idx);
    });

    // Dedicated toggle status button
    item.querySelector('[data-role="toggle-status"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleVideoStatusByIndex(idx);
    });

    container.appendChild(item);
  });
}

function addNewLectureToPlaylist(playlistId) {
  const playlist = state.playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  const nextNumber = playlist.videos.length + 1;
  const defaultTitle = `${playlist.title} - Part ${nextNumber}`;
  const title = prompt(
    state.lang === 'pa'
      ? `ਨਵਾਂ ਲੈਕਚਰ ਸ਼ਾਮਲ ਕਰੋ (ਲੈਕਚਰ ${nextNumber} ਦਾ ਸਿਰਲੇਖ ਦਰਜ ਕਰੋ):`
      : `Add New Lecture to Series (Enter title for Lecture ${nextNumber}):`,
    defaultTitle
  );
  if (title === null) return;

  const ytUrl = prompt(
    state.lang === 'pa'
      ? 'ਯੂਟਿਊਬ ਵੀਡੀਓ ਲਿੰਕ (ਜੇਕਰ ਉਪਲਬਧ ਹੋਵੇ, ਨਹੀਂ ਤਾਂ ਖਾਲੀ ਛੱਡੋ):'
      : 'YouTube Video Link (Optional, leave blank if not yet published):',
    ''
  );

  const vId = extractYouTubeVideoId(ytUrl || '');
  const newVid = {
    id: 'vid_' + (vId || (Date.now() + '_' + nextNumber)),
    youtubeVideoId: vId || '',
    title: (title && title.trim()) ? title.trim() : defaultTitle,
    durationMins: 0,
    status: 'unwatched'
  };

  playlist.videos.push(newVid);
  saveState();
  renderPlaylistsList();
  if (currentPlayingPlaylistId === playlist.id) {
    updatePlayerView();
  }
  showToast(`✓ Added Lecture ${nextNumber}: "${newVid.title.slice(0, 25)}..." 🎬`);
}

async function syncPlaylistLectures(playlistId) {
  const playlist = state.playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  showToast(state.lang === 'pa' ? 'ਨਵੇਂ ਲੈਕਚਰਾਂ ਦੀ ਜਾਂਚ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...' : 'Checking for new daily lectures...');

  if (playlist.youtubePlaylistId) {
    try {
      const plData = await fetchPlaylistData(playlist.youtubePlaylistId);
      if (plData && Array.isArray(plData.videos) && plData.videos.length > 0) {
        const existingVids = new Set(playlist.videos.map(v => v.youtubeVideoId).filter(Boolean));
        let addedCount = 0;
        plData.videos.forEach(newV => {
          if (newV.youtubeVideoId && !existingVids.has(newV.youtubeVideoId)) {
            playlist.videos.push(newV);
            existingVids.add(newV.youtubeVideoId);
            addedCount++;
          }
        });
        if (addedCount > 0) {
          saveState();
          renderPlaylistsList();
          if (currentPlayingPlaylistId === playlist.id) updatePlayerView();
          showToast(`✓ Added ${addedCount} new daily lectures from YouTube! Total: ${playlist.videos.length}`);
          return;
        }
      }
    } catch (e) {
      console.warn('Sync error:', e);
    }
  }

  // If no new videos auto-detected, ask if user wants to add today's lecture
  const addToday = confirm(
    state.lang === 'pa'
      ? `ਪਲੇਲਿਸਟ ਵਿੱਚ ਇਸ ਵੇਲੇ ${playlist.videos.length} ਲੈਕਚਰ ਹਨ। ਕੀ ਅੱਜ ਦਾ ਨਵਾਂ ਭਾਗ (ਲੈਕਚਰ ${playlist.videos.length + 1}) ਸ਼ਾਮਲ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`
      : `Playlist currently has ${playlist.videos.length} lectures. Do you want to add today's new lecture (Lecture ${playlist.videos.length + 1})?`
  );
  if (addToday) {
    addNewLectureToPlaylist(playlistId);
  } else {
    showToast(`Playlist is up to date (${playlist.videos.length} lectures).`);
  }
}

function promptEditVideoDuration(playlistId, videoIdx) {
  const pl = state.playlists.find(p => p.id === playlistId);
  if (!pl || !pl.videos[videoIdx]) return;
  const current = pl.videos[videoIdx].durationMins || 30;
  const ans = prompt(`Enter duration in minutes for "${pl.videos[videoIdx].title}":`, current);
  if (ans !== null) {
    const mins = parseInt(ans, 10);
    if (!isNaN(mins) && mins >= 0) {
      pl.videos[videoIdx].durationMins = mins;
      saveState();
      renderPlayerVideoList(pl);
      renderPlaylistsList();
      showToast(`Duration updated to ${formatDuration(mins)}`);
    }
  }
}

// Toggle watched status by video index
function toggleVideoStatusByIndex(videoIdx) {
  const playlist = state.playlists.find(p => p.id === currentPlayingPlaylistId);
  if (!playlist) return;
  const video = playlist.videos[videoIdx];
  if (!video) return;

  const activeDate = getActiveDate();
  if (video.status === 'watched') {
    video.status = 'unwatched';
    showToast(`Marked "${video.title.slice(0, 20)}..." as unwatched.`);
  } else {
    video.status = 'watched';
    try {
      if (typeof playTone === 'function') playTone('check');
      if (typeof launchConfetti === 'function') launchConfetti();
    } catch (e) {}

    // Auto-log video's actual duration to today's subject log
    const minsToAdd = video.durationMins > 0 ? video.durationMins : 30;
    if (!state.timeSpent[activeDate]) state.timeSpent[activeDate] = {};
    state.timeSpent[activeDate][playlist.subjectId] = (state.timeSpent[activeDate][playlist.subjectId] || 0) + minsToAdd;
    
    // Auto-check this subject on daily checklist
    if (!state.records[activeDate]) state.records[activeDate] = {};
    state.records[activeDate][playlist.subjectId] = true;

    showToast(`✅ Watched! +${minsToAdd}m logged to daily study tracker.`);
  }

  saveState();
  updatePlayerView();
  if (typeof renderChecklist === 'function') renderChecklist();
  if (typeof computeStreak === 'function') computeStreak();
}

function toggleCurrentVideoWatchedStatus() {
  toggleVideoStatusByIndex(currentPlayingVideoIndex);
}

// Listen to YouTube Player Iframe API Messages for Duration & State
window.addEventListener('message', (event) => {
  try {
    if (!event.data) return;
    let data = event.data;
    if (typeof data === 'string' && data.startsWith('{')) {
      data = JSON.parse(data);
    }
    // YouTube player info delivery
    if (data && data.event === 'infoDelivery' && data.info) {
      if (data.info.duration && typeof data.info.duration === 'number' && data.info.duration > 0) {
        const secs = data.info.duration;
        const mins = Math.max(1, Math.round(secs / 60));
        const playlist = state.playlists.find(p => p.id === currentPlayingPlaylistId);
        if (playlist && playlist.videos[currentPlayingVideoIndex]) {
          const vid = playlist.videos[currentPlayingVideoIndex];
          if (!vid.durationMins || vid.durationMins !== mins) {
            vid.durationMins = mins;
            saveState();
            renderPlayerVideoList(playlist);
          }
        }
      }
    }
  } catch (e) {}
});

// Active Live Study Time Logger while watching
function startLectureStudyTimer() {
  stopLectureStudyTimer();
  lectureSessionMinutesLogged = 0;
  const timeBadge = document.getElementById('player-live-study-time');
  if (timeBadge) timeBadge.textContent = "⏱️ Active: 0m logged";

  // Ticks every 60 seconds of watching
  lectureStudyTimeTicker = setInterval(() => {
    lectureSessionMinutesLogged++;
    const playlist = state.playlists.find(p => p.id === currentPlayingPlaylistId);
    if (playlist) {
      const activeDate = getActiveDate();
      if (!state.timeSpent[activeDate]) state.timeSpent[activeDate] = {};
      state.timeSpent[activeDate][playlist.subjectId] = (state.timeSpent[activeDate][playlist.subjectId] || 0) + 1;
      saveState();
      if (typeof renderChecklist === 'function') renderChecklist();
    }
    const timeBadge = document.getElementById('player-live-study-time');
    if (timeBadge) timeBadge.textContent = `⏱️ Active: ${lectureSessionMinutesLogged}m logged`;
  }, 60000);
}

function stopLectureStudyTimer() {
  if (lectureStudyTimeTicker) {
    clearInterval(lectureStudyTimeTicker);
    lectureStudyTimeTicker = null;
  }
}

// Quick Scratchpad / Lecture Note Saver
function saveLectureScratchpadNote() {
  const scratchpad = document.getElementById('player-note-scratchpad');
  if (!scratchpad) return;
  const text = scratchpad.value.trim();
  if (!text) {
    showToast('Please type your notes before saving.');
    return;
  }

  const playlist = state.playlists.find(p => p.id === currentPlayingPlaylistId);
  const video = playlist?.videos[currentPlayingVideoIndex];
  const subjectId = playlist ? playlist.subjectId : (state.subjects[0]?.id || 'subj_maths');

  const newNote = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    subjectId: subjectId,
    title: `Lecture Note: ${video ? video.title : (playlist?.title || 'Study Video')}`,
    content: text,
    images: [],
    drawing: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (!state.notebook) state.notebook = [];
  state.notebook.unshift(newNote);
  saveState();
  scratchpad.value = '';
  showToast('Note saved to your Study Notebook! 📝');
}

// Global Exports
window.openAddPlaylistModal = openAddPlaylistModal;
window.closeAddPlaylistModal = closeAddPlaylistModal;
window.handleSavePlaylist = handleSavePlaylist;
window.openInAppPlayer = openInAppPlayer;
window.closeInAppPlayer = closeInAppPlayer;
window.toggleCurrentVideoWatchedStatus = toggleCurrentVideoWatchedStatus;
window.toggleVideoStatusByIndex = toggleVideoStatusByIndex;
window.processPlaylistLink = processPlaylistLink;
window.renderLecturesHub = renderLecturesHub;
window.saveLectureScratchpadNote = saveLectureScratchpadNote;
window.promptEditVideoDuration = promptEditVideoDuration;
window.addNewLectureToPlaylist = addNewLectureToPlaylist;
window.syncPlaylistLectures = syncPlaylistLectures;
