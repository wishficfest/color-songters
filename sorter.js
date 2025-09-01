function renderNext(){
  if (queue.length === 0){ finish(); return; }

  const [ai, bi] = queue[0];
  const A = tracks[ai];
  const B = tracks[bi];

  const pct = Math.round((1 - queue.length / ((tracks.length*(tracks.length-1))/2)) * 100);
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

  setupPreview('A', A.spotifyEmbed);
  setupPreview('B', B.spotifyEmbed);
}

function cardHTML(song, tag){
  return `
  <section class="card" data-pick="${tag}" role="button" aria-label="Choose ${song.title}">
    <span class="tap-hint">Tap to pick</span>
    <img class="thumb" src="assets/cover.jpg" alt="${song.title}">
    <h3 class="title">${song.title}</h3>
    <p class="meta">NCT WISH · COLOR</p>
    <iframe id="prev${tag}" class="preview" style="display:none" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
    <div class="actions">
      <button id="pick${tag}" class="primary">Choose This</button>
      <a class="cta" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent('NCT WISH ' + song.title)}">Open in Spotify</a>
    </div>
  </section>`;
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

