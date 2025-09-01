(function(){
  const top = getTop();
  const box = document.getElementById('top-card');

  if (!top){
    box.innerHTML = `<p>No result yet. <a href="index.html">Start sorting</a>.</p>`;
    return;
  }

  box.innerHTML = `
    <img class="thumb" src="assets/cover.jpg" alt="${top.title}">
    <h3 class="title">${top.title}</h3>
    <p class="meta">NCT WISH · COLOR</p>
    ${top.spotifyEmbed ? `<iframe class="preview" src="${top.spotifyEmbed}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>` : ``}
  `;

  // Share text
  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const text = `My Top 1 from NCT WISH — COLOR: ${top.title} 💙\nTry yours: https://<your-username>.github.io/color-songters/`;
    if (navigator.share){
      await navigator.share({ text, title: 'COLOR Songters' });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  });

  // Save screenshot
  document.getElementById('saveImg').addEventListener('click', ()=>{
    html2canvas(document.querySelector('#top-card')).then(canvas=>{
      const link = document.createElement('a');
      link.download = `${top.title.replace(/\s+/g,'_')}_Top1.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  });
})();

function getTop(){
  try{
    const data = JSON.parse(localStorage.getItem('color_songters_ranking')||'[]');
    return data[0];
  }catch(e){ return null; }
}
