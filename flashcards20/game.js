'use strict';

// ============================================================
// CONFIG
// ============================================================
const SANITY_PROJECT = 's9j0sgbs';
const SANITY_DATASET = 'production';
const SANITY_API_URL =
  `https://${SANITY_PROJECT}.api.sanity.io/v2026-01-08/data/query/${SANITY_DATASET}` +
  `?query=*%5B_type%20%3D%3D%20%22staff%22%5D`;
const LOCAL_DATA_URL = 'data/staff.json';
const LOCAL_MANIFEST_URL = 'data/manifest.json';
const STATS_KEY = 'systek_namegame_stats';
const CDN_BASE = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/`;

// ============================================================
// STATE
// ============================================================
let allStaff = [];       // full list loaded from API/local
let localImageManifest = {};  // { [_id]: 'data/images/<id>.jpg' }
let gameQueue = [];      // shuffled subset for current round
let currentIdx = 0;
let score = 0;
let selectedCount = 'all';  // 'all' | 10 | 20 | 50
let awaitingNext = false;

// stats: { [staffId]: { name, wrong: number } }
let stats = {};

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const screens = {
  setup:  $('screen-setup'),
  game:   $('screen-game'),
  result: $('screen-result'),
};

// ============================================================
// UTILS
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanityImageUrl(ref, width = 600, height = 750) {
  // ref format: image-HASH-WIDTHxHEIGHT-FORMAT
  if (!ref) return '';
  const parts = ref.split('-');
  // parts: ['image', HASH, 'WIDTHxHEIGHT', 'FORMAT']
  const hash = parts[1];
  const dims = parts[2];
  const fmt  = parts[3] || 'jpg';
  return `${CDN_BASE}${hash}-${dims}.${fmt}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}

function imageUrlForStaff(staff) {
  // Prefer local image if available (from fetch_data script)
  if (localImageManifest[staff._id]) return localImageManifest[staff._id];

  const ref = staff.image?.asset?._ref;
  if (!ref) return '';
  // Use hotspot focal point if available
  let url = sanityImageUrl(ref, 600, 750);
  if (staff.image.hotspot) {
    url += `&fp-x=${staff.image.hotspot.x.toFixed(3)}&fp-y=${staff.image.hotspot.y.toFixed(3)}`;
  }
  return url;
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ============================================================
// STATS
// ============================================================
function loadStats() {
  try { stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch { stats = {}; }
}

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recordWrong(staff) {
  const id = staff._id;
  if (!stats[id]) stats[id] = { name: staff.name, wrong: 0, photo: imageUrlForStaff(staff) };
  stats[id].wrong += 1;
  saveStats();
}

function clearStats() {
  stats = {};
  saveStats();
}

function topWrong(n = 10) {
  return Object.values(stats)
    .filter(s => s.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, n);
}

function renderWrongList(listEl) {
  const top = topWrong(10);
  listEl.innerHTML = '';
  if (top.length === 0) {
    listEl.innerHTML = '<li class="empty-state">Ingen feil ennå</li>';
    return;
  }
  top.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML =
      `<span class="rank">${i + 1}.</span>` +
      `<span class="person-name">${item.name}</span>` +
      `<span class="count">${item.wrong}</span>` +
      (item.photo ? `<div class="wrong-photo-popup"><img src="${item.photo}" alt="${item.name}" /></div>` : '');
    listEl.appendChild(li);
  });
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadStaff() {
  // Try to load local image manifest (populated by fetch_data.sh/js)
  try {
    const res = await fetch(LOCAL_MANIFEST_URL);
    if (res.ok) localImageManifest = await res.json();
  } catch { /* no manifest, use CDN URLs */ }

  // Try live API first, then local fallback
  let data = null;

  try {
    const res = await fetch(SANITY_API_URL);
    if (res.ok) {
      const json = await res.json();
      data = json.result;
    }
  } catch (e) {
    // CORS or network error — try local
  }

  if (!data || data.length === 0) {
    try {
      const res = await fetch(LOCAL_DATA_URL);
      if (res.ok) {
        const json = await res.json();
        data = json.result || json;
      }
    } catch (e) {
      // local also failed
    }
  }

  if (!data || data.length === 0) {
    throw new Error('Kunne ikke laste ansattdata. Kjør fetch_data.sh for å laste ned lokale filer.');
  }

  // Filter to staff that have both a name and an image
  return data.filter(s => s.name && s.image?.asset?._ref);
}

// ============================================================
// SETUP SCREEN
// ============================================================
function initSetup() {
  const hint = $('setup-hint');
  const startBtn = $('start-btn');

  // Option buttons
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCount = btn.dataset.count === 'all' ? 'all' : parseInt(btn.dataset.count, 10);
      updateHint();
    });
  });

  function updateHint() {
    const total = allStaff.length;
    if (selectedCount === 'all') {
      hint.textContent = `Du spiller med alle ${total} ansatte.`;
    } else {
      const n = Math.min(selectedCount, total);
      hint.textContent = `Du spiller med ${n} tilfeldig valgte ansatte.`;
    }
  }

  $('start-btn').addEventListener('click', startGame);

  // Load data
  loadStaff().then(staff => {
    allStaff = staff;
    startBtn.textContent = 'Start spill';
    startBtn.disabled = false;
    updateHint();
  }).catch(err => {
    startBtn.textContent = 'Feil ved lasting';
    hint.textContent = err.message;
  });
}

// ============================================================
// GAME LOGIC
// ============================================================
function startGame() {
  loadStats();

  // Build game queue
  let pool = shuffle(allStaff);
  if (selectedCount !== 'all') {
    pool = pool.slice(0, Math.min(selectedCount, pool.length));
  }
  gameQueue = pool;
  currentIdx = 0;
  score = 0;

  $('header-score').hidden = false;
  showScreen('game');
  renderWrongList($('wrong-list'));
  loadQuestion();
}

function loadQuestion() {
  if (currentIdx >= gameQueue.length) {
    endGame();
    return;
  }

  awaitingNext = false;
  const staff = gameQueue[currentIdx];

  // Progress
  const pct = (currentIdx / gameQueue.length) * 100;
  $('progress-bar').style.width = pct + '%';
  $('progress-text').textContent = `Spørsmål ${currentIdx + 1} av ${gameQueue.length}`;
  $('header-score').querySelector('span').textContent = `${score} / ${currentIdx}`;

  // Photo
  const img = $('employee-photo');
  img.style.opacity = '0';
  img.src = imageUrlForStaff(staff);
  img.onload = () => { img.style.opacity = '1'; };
  img.onerror = () => { img.style.opacity = '0.3'; };

  // Input
  const input = $('name-input');
  input.value = '';
  input.disabled = false;
  input.focus();

  // Suggestions
  hideSuggestions();

  // Feedback
  const fb = $('feedback');
  fb.hidden = true;
  fb.className = 'feedback';
}

// Suggestion / autocomplete
let highlightedIdx = -1;

$('name-input').addEventListener('input', onInputChange);
$('name-input').addEventListener('keydown', onInputKeydown);

function onInputChange() {
  if (awaitingNext) return;
  const q = $('name-input').value.trim().toLowerCase();
  if (q.length < 1) { hideSuggestions(); return; }

  const matches = allStaff
    .filter(s => s.name.toLowerCase().includes(q))
    .slice(0, 8);

  if (matches.length === 0) { hideSuggestions(); return; }

  const ul = $('suggestions');
  ul.innerHTML = '';
  highlightedIdx = -1;
  matches.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = s.name;
    li.dataset.name = s.name;
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      selectAnswer(s.name);
    });
    ul.appendChild(li);
  });
  ul.hidden = false;
}

function onInputKeydown(e) {
  if (awaitingNext) {
    if (e.key === 'Enter' || e.key === ' ') nextQuestion();
    return;
  }
  const ul = $('suggestions');
  const items = ul.querySelectorAll('li');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
    updateHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIdx = Math.max(highlightedIdx - 1, -1);
    updateHighlight(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIdx >= 0 && items[highlightedIdx]) {
      selectAnswer(items[highlightedIdx].dataset.name);
    } else if ($('name-input').value.trim()) {
      selectAnswer($('name-input').value.trim());
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
}

function updateHighlight(items) {
  items.forEach((li, i) => {
    li.classList.toggle('highlighted', i === highlightedIdx);
  });
}

function hideSuggestions() {
  const ul = $('suggestions');
  ul.hidden = true;
  ul.innerHTML = '';
  highlightedIdx = -1;
}

function selectAnswer(guessedName) {
  if (awaitingNext) return;
  awaitingNext = true;

  hideSuggestions();
  const input = $('name-input');
  input.value = guessedName;
  input.disabled = true;

  const staff = gameQueue[currentIdx];
  const correct = staff.name.toLowerCase() === guessedName.toLowerCase();

  const fb = $('feedback');
  fb.hidden = false;

  if (correct) {
    score++;
    fb.className = 'feedback correct';
    fb.textContent = `✓ Riktig! Det er ${staff.name}.`;
  } else {
    fb.className = 'feedback wrong';
    fb.textContent = `✗ Feil. Det var ${staff.name}, ikke "${guessedName}".`;
    recordWrong(staff);
    renderWrongList($('wrong-list'));
  }

  $('header-score').querySelector('span').textContent = `${score} / ${currentIdx + 1}`;
  currentIdx++;

  // Auto-advance after delay
  setTimeout(() => nextQuestion(), 1800);
}

function nextQuestion() {
  loadQuestion();
}

// ============================================================
// END GAME
// ============================================================
function endGame() {
  const total = gameQueue.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  $('progress-bar').style.width = '100%';
  $('header-score').hidden = true;

  // Icon
  let icon = '😐';
  if (pct === 100) icon = '🏆';
  else if (pct >= 80) icon = '🎉';
  else if (pct >= 60) icon = '👍';
  else if (pct >= 40) icon = '🤔';
  else icon = '📸';

  $('result-icon').textContent = icon;
  $('result-score').textContent = `${score} av ${total} (${pct}%)`;

  let msg = '';
  if (pct === 100) msg = 'Perfekt! Du kjenner alle!';
  else if (pct >= 80) msg = 'Veldig bra! Du kjenner de fleste.';
  else if (pct >= 60) msg = 'Bra jobba! Øv litt mer.';
  else if (pct >= 40) msg = 'Ikke verst — men det er rom for forbedring!';
  else msg = 'Det er mange ansatte å lære seg. Øv videre!';

  $('result-msg').textContent = msg;

  // Wrong list in result
  const top = topWrong(5);
  const wrap = $('result-wrong-wrap');
  if (top.length > 0) {
    renderWrongList($('result-wrong-list'));
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
  }

  showScreen('result');
}

// ============================================================
// RESULT ACTIONS
// ============================================================
$('play-again-btn').addEventListener('click', () => {
  startGame();
});

$('change-setup-btn').addEventListener('click', () => {
  showScreen('setup');
});

$('clear-stats-btn').addEventListener('click', () => {
  if (confirm('Vil du slette all statistikk?')) {
    clearStats();
    renderWrongList($('wrong-list'));
  }
});

// ============================================================
// INIT
// ============================================================
loadStats();
initSetup();
