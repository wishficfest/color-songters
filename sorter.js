// ====== ELEMENTS ======
const arena      = document.getElementById('arena');
const prog       = document.getElementById('prog');
const startBtn   = document.getElementById('startBtn');
const restartBtn = document.getElementById('restart');
const hint       = document.getElementById('hint');

// ====== STATE ======
let tracks = [];
let queue  = [];   // pairs of indexes
let scores = {};   // id -> wins

// ====== START FLOW ======
startBtn?.addEventListener('click', startGame);
restartBtn?.addEventListener('click', () => location.reload());

async function startGame(){
  // UI: hide start screen, show progress + restart
  arena.innerHTML = '';
  prog.classList.remove('hide');
  restartBtn.classList.remove('hide');

  // load songs
  tracks = await fetch('songs.json').then(r=>r.json());
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

// ====== RENDERING ======
function renderNext(){
  if (queue.length === 0){
    finish();
    return;
  }

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

  // preview play toggle
  arena.querySelectorAll('.play-btn').forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation(); // prevent picking card
      const tag = btn.getAttribute('data-play');
      const el  = document.getElementById(`prev${tag}`);
      const url = (tag === 'A') ? A.spotifyEmbed : B.spotifyEmbed;
      if (url){
        if (!el.src) el.src = url;
        el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
      } else {
        // no embed: open search
        window.open(`https://open.spotify.com/search/${encodeURIComponent('NCT WISH ' + ((tag==='A')?A.title:B.title))}`, '_blank');
      }
    };
  });
}

function cardHTML(song, tag){
  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent('NCT WISH ' + song.title)}`;
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
      <a class="cta" target="_blank" rel="noopener" href="${searchUrl}">Open in Spotify</a>
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
