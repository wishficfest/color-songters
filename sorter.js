// ====== ELEMENTS ======
const arena      = document.getElementById('arena');
const prog       = document.getElementById('prog');
const startBtn   = document.getElementById('startBtn');
const restartBtn = document.getElementById('restart');
const hint       = document.getElementById('hint');

// ====== SAFE FALLBACK TRACKS (pakai link yang kamu kasih, bebas non-embed) ======
const fallbackTracks = [
  { id: "color",      title: "COLOR",      spotifyEmbed: "https://open.spotify.com/intl-id/track/7BRP4zawz4T1PhAdj2Nr4Z?si=66dccdf5eb394026" },
  { id: "baby-blue",  title: "Baby Blue",  spotifyEmbed: "https://open.spotify.com/intl-id/track/5Vhv7grrhFyhTYkXKrNo67?si=ecd31ec29eaa4c04" },
  { id: "surf",       title: "Surf",       spotifyEmbed: "https://open.spotify.com/intl-id/track/0ONXDvqXoLojpLSRr2npja?si=d2dd272db55a414d" },
  { id: "cheat-code", title: "Cheat Code", spotifyEmbed: "https://open.spotify.com/intl-id/track/0dE5yWQgpEMBtEiLqsKbL2?si=6ffe6084da694a4b" },
  { id: "videohood",  title: "Videohood",  spotifyEmbed: "https://open.spotify.com/intl-id/track/348MxMVyHYOKA4XrHJEQAk?si=e040566d6fb84b9" },
  { id: "wichu",      title: "WICHU",      spotifyEmbed: "https://open.spotify.com/intl-id/track/37bG7biGfYaLebbXIuQbxK?si=3960a101a81144a8" },
  { id: "reel",       title: "고양이 릴스 Reel-ationship", spotifyEmbed: "https://open.spotify.com/intl-id/track/2lQVBSfjBVCvI245h4oJNi?si=3b3c65dda85f4112" }
];

// ====== STATE ======
let tracks = [];
let queue  = [];   // pairs of indexes
let scores = {};   // id -> wins

// ====== START FLOW ======
startBtn?.addEventListener('click', startGame);
restartBtn?.addEventListener('click', () => location.reload());

async function startGame(){
  // UI: show loading
  const loading = document.createElement('p');
  loading.textContent = 'Loading songs…';
  loading.style.textAlign = 'center';
  arena.innerHTML = '';
  arena.appendChild(loading);

  // show progress + restart
  prog.classList.remove('hide');
  restartBtn.classList.remove('hide');

  try {
    tracks = await loadTracksJSON();
  } catch (e) {
    console.warn('Failed to load songs.json → using fallback:', e);
    tracks = fallbackTracks;
  }

  // normalize semua spotify link → embed
  tracks = normalizeTracks(tracks);

  // validate
  if (!Array.isArray(tracks) || tracks.length < 2) {
    arena.innerHTML = `
      <div style="text-align:center;padding:24px">
        <h3>Can’t start</h3>
        <p>We couldn’t load the track list. Check <code>songs.json</code> is present and valid.</p>
        <p class="muted">Tip: file di root repo & JSON tanpa koma terakhir.</p>
        <button class="primary" id="retryBtn">Retry</button>
      </div>`;
    document.getElementById('retryBtn').onclick = () => location.reload();
    return;
  }

  // init state
  scores = {};
  tracks.forEach(t => scores[t.id] = 0);

  // build all unique pairs i<j and shuffle
  const pairs = [];
  for (let i=0;i<tracks.length;i++){
    for (let j=i+1;j<tracks.length;j++){
      pairs.push([i,j]);
    }
  }
  shuffle(pairs);
  queue = pairs;

  renderNext();
}

// robust loader with helpful errors
async function loadTracksJSON(){
  const res = await fetch('songs.json?cache=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} loading songs.json`);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Invalid JSON in songs.json (cek trailing comma/komentar)');
  }
  return data;
}

// ====== SPOTIFY NORMALIZER ======
function toEmbedUrl(raw){
  if (!raw || typeof raw !== 'string') return '';
  // already embed?
  if (/^https:\/\/open\.spotify\.com\/embed\/track\/[A-Za-z0-9]+/.test(raw)) return raw;

  // accept urls like:
  // https://open.spotify.com/track/ID
  // https://open.spotify.com/intl-id/track/ID?si=....
  const m = raw.match(/^https:\/\/open\.spotify\.com\/(?:[a-z-]+\/)?track\/([A-Za-z0-9]+)\b/i);
  if (m && m[1]) return `https://open.spotify.com/embed/track/${m[1]}`;
  return ''; // invalid/unknown format
}

function normalizeTracks(list){
  return (list || []).map(t => ({
    ...t,
    spotifyEmbed: toEmbedUrl(t.spotifyEmbed)
  }));
}

// ====== RENDERING ======
function renderNext(){
  if (queue.length === 0){ finish(); return; }

  const [ai, bi] = queue[0];
  const A = tracks[ai];
  const B = tracks[bi];

  const totalPairs = (tracks.length * (tracks.length - 1)) / 2;
  const pct = Math.round((1 - queue.length / totalPairs) * 100);
  prog.value = pct;

  arena.innerHTML = `
    ${cardHTML(A, 'A')}
    <div class="or-pill" aria-hidden="true">OR</div>
    ${cardHTML(B, 'B')}
  `;

  // whole card click
  arena.querySelector('[data-pick="A"]').onclick = ()=> choose(A.id);
  arena.querySelector('[data-pick="B"]').onclick = ()=> choose(B.id);

  // button click (still works)
  arena.querySelector('#pickA').onclick = ()=> choose(A.id);
  arena.querySelector('#pickB').onclick = ()=> choose(B.id);

  // preview play toggle (NO SEARCH FALLBACK — hanya pake link yang kamu kasih)
  arena.querySelectorAll('.play-btn').forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation(); // prevent picking card
      const tag = btn.getAttribute('data-play');
      const el  = document.getElementById(`prev${tag}`);
      const song = (tag === 'A') ? A : B;
      const url = song.spotifyEmbed;   // sudah dinormalisasi ke /embed/track/ID

      if (url){
        if (!el.src) el.src = url;
        el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
      } else {
        alert('Preview unavailable: Spotify track URL tidak valid untuk embed.');
      }
    };
  });
}

function cardHTML(song, tag){
  return `
  <section class="card" data-pick="${tag}" role="button" aria-label="Choose ${song.title}">
    <div class="thumb-wrap">
      <img class="thumb" src="assets/cover.jpg" alt="${song.title}">
      <button type="button" class="play-btn" data-play="${tag}" aria-label="Play preview">►</button>
    </div>
    <h3 class="title">${song.title}</h3>
    <p class="meta">NCT WISH · COLOR</p>

    <iframe id="prev${tag}" class="preview" style="display:none"
      loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>

    <div class="actions">
      <button id="pick${tag}" class="primary">Choose This</button>
    </div>
  </section>`;
}

// ====== GAME LOGIC ======
function choose(id){
  scores[id] = (scores[id]||0) + 1;
  queue.shift();
  renderNext();
}

function finish(){
  const ranking = [...tracks].sort((a,b)=>{
    const d = (scores[b.id]||0) - (scores[a.id]||0);
    return d !== 0 ? d : 0;
  }).map(t => ({ id:t.id, title:t.title, wins:scores[t.id]||0, spotifyEmbed:t.spotifyEmbed||'' }));

  localStorage.setItem('color_songters_ranking', JSON.stringify(ranking));
  location.href = 'result.html';
}

// ====== UTIL ======
function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
}
