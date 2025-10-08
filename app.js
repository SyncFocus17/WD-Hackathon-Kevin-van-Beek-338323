const adultZone = document.getElementById('adultZone');
const babyZone = document.getElementById('babyZone');
const newGameBtn = document.getElementById('newGameBtn');
const turnsEl = document.getElementById('turns');
const timeEl = document.getElementById('time');
const highscoresList = null;
const scoreForm = document.getElementById('scoreForm');
const playerNameInput = document.getElementById('playerName');
const statusEl = document.getElementById('status');
const scoreSubmitBtn = document.getElementById('scoreSubmitBtn');
const nativeSubmit = document.getElementById('nativeSubmit');
const winDialog = document.getElementById('winDialog');
const winSummary = document.getElementById('winSummary');
const winSaveBtn = document.getElementById('winSaveBtn');
const winNewBtn = document.getElementById('winNewBtn');
const topScoresBtn = document.getElementById('topScoresBtn') || document.getElementById('navStats');
const scoresDialog = document.getElementById('scoresDialog');
const dialogHighscoresList = document.getElementById('dialogHighscoresList');
const scoresCloseBtn = document.getElementById('scoresCloseBtn');
const navPlay = document.getElementById('navPlay');

let turnCount = 0;
let startTimeMs = 0;
let animals = [];
let matchedPairs = 0;
let selectedAdultKey = null;

function bindTap(el, handler){
  const h = (e)=>{ e.preventDefault(); e.stopPropagation(); handler(e); };
  el.addEventListener('pointerup', h);
  el.addEventListener('click', h);
}

async function fetchAnimals(){
  try {
    const response = await fetch('api/animals.php', { cache: 'no-store' });
    if(response.ok){
      const data = await response.json();
      if(Array.isArray(data) && data.length){ return data; }
    }
  } catch(e) {}

  // INFO: Als de API niet kan laden, geeft die een fallback bericht aan, en dus ook random fallback plaatjes, tonend dat die niet werkt nu.

  statusEl.textContent='API leeg of niet bereikbaar – gebruik fallback-afbeeldingen.';
  const keys=['cat','cow','dog','duck','elephant','goat','horse','pig','seal'];
  return keys.map(k=>({ key:k, adult:`./animalcards/${k}_adult.png`, baby:`./animalcards/${k}_baby.png` }));
}

function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

function renderZones(){
  adultZone.innerHTML='';
  babyZone.innerHTML='';
  const adults = animals.map(a=>({key:a.key,src:a.adult}));
  const babies = animals.map(a=>({key:a.key,src:a.baby}));
  shuffle(adults);shuffle(babies);
  for(const a of adults){
    const div=document.createElement('div');
    div.className='card';
    const img=new Image();
    img.src=a.src;
    img.alt=a.key+' volwassen';
    img.draggable=true;
    img.className='draggable';
    img.dataset.key=a.key;
    img.addEventListener('dragstart', onDragStart);
    const selectHandler = ()=> selectAdult(a.key, div);
    bindTap(div, selectHandler);
    bindTap(img, selectHandler);
    div.appendChild(img);
    adultZone.appendChild(div);
  }
  for(const b of babies){
    const div=document.createElement('div');
    div.className='card';
    div.dataset.key=b.key;
    const img=new Image();
    img.src=b.src;
    img.alt=b.key+' baby';
    div.appendChild(img);
    div.addEventListener('dragover', onDragOver);
    div.addEventListener('dragleave', onDragLeave);
    div.addEventListener('drop', onDrop);
    const matchHandler = ()=> clickMatch(b.key, div);
    bindTap(div, matchHandler);
    bindTap(img, matchHandler);
    babyZone.appendChild(div);
  }
}

function onDragStart(ev){
  ev.dataTransfer.setData('text/plain', ev.target.dataset.key);
}
function onDragOver(ev){
  ev.preventDefault();
  ev.currentTarget.classList.add('drop-target');
}
function onDragLeave(ev){
  ev.currentTarget.classList.remove('drop-target');
}

//INFO: -De functie dat handled dat je moet slepen ( drag/drop events ) - Dat het slepen functioneel is.

function onDrop(ev){
  ev.preventDefault();
  ev.currentTarget.classList.remove('drop-target');
  const key=ev.dataTransfer.getData('text/plain');
  const targetKey=ev.currentTarget.dataset.key;
  turnCount++; turnsEl.textContent=String(turnCount);
  if(key===targetKey){
    ev.currentTarget.classList.add('match');
    matchedPairs++;
    const img=document.querySelector(`img.draggable[data-key="${CSS.escape(key)}"]`);
    if(img){
      img.draggable=false; img.classList.remove('draggable');
      ev.currentTarget.appendChild(img);
    }
    if(matchedPairs===animals.length){ onGameWin(); }
  }
}

function selectAdult(key, cardEl){
  document.querySelectorAll('.card.selected').forEach(el=>el.classList.remove('selected'));
  selectedAdultKey = key;
  cardEl.classList.add('selected');
  statusEl.textContent='Gekozen: '+key+' – klik of sleep naar de juiste baby.';
}

function clickMatch(targetKey, targetCard){
  if(!selectedAdultKey){ return; }
  turnCount++; turnsEl.textContent=String(turnCount);
  if(selectedAdultKey===targetKey){
    targetCard.classList.add('match');
    matchedPairs++;
    const img=document.querySelector(`img.draggable[data-key="${CSS.escape(selectedAdultKey)}"]`);
    if(img){
      img.draggable=false; img.classList.remove('draggable');
      targetCard.appendChild(img);
    }
    // fun animation on match - dus als je hem goed hebt, geeft die een animatie aan.
    try { anime({ targets: targetCard, scale:[1,1.06,1], duration:400, easing:'easeOutQuad' }); } catch(e) {}
    selectedAdultKey=null;
    document.querySelectorAll('.card.selected').forEach(el=>el.classList.remove('selected'));
    statusEl.textContent='Goed zo! Ga door...';
    if(matchedPairs===animals.length){ onGameWin(); }
  } else {
    statusEl.textContent='Niet juist, probeer opnieuw.';
  }
}

function startTimer(){
  startTimeMs=Date.now();
  function tick(){
    const s=Math.floor((Date.now()-startTimeMs)/1000);
    timeEl.textContent=s+'s';
    if(matchedPairs!==animals.length){
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

function onGameWin(){
  const totalSeconds=Math.floor((Date.now()-startTimeMs)/1000);
  winSummary.textContent=`Beurten: ${turnCount} • Tijd: ${totalSeconds}s`;
  try { winDialog.show(); } catch(_) { alert(`Klaar  |  Beurten: ${turnCount}, Tijd: ${totalSeconds}s`); }
}

async function loadHighscores(){ }

async function saveScore(nameOverride){
  const seconds=Math.floor((Date.now()-startTimeMs)/1000);
  let nameVal='';
  try { nameVal = (nameOverride ?? playerNameInput?.value ?? '').toString().trim(); } catch(_) { nameVal = ''; }
  if(!nameVal){ statusEl.textContent='Vul eerst je naam in.'; return; }
  const payload={ name: nameVal, turns: turnCount, seconds, start_time: Math.floor(startTimeMs/1000), end_time: Math.floor(Date.now()/1000) };
  try{
    const res=await fetch('api/scores.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if(res.ok){
      try { playerNameInput.value=''; } catch(_) {}
      statusEl.textContent='Score opgeslagen!';
    } else {
      const txt = await res.text();
      statusEl.textContent='Score opslaan mislukt ('+txt+').';
    }
  }catch(err){ statusEl.textContent='Netwerkfout bij opslaan.'; }
}

scoreForm.addEventListener('submit', async (e)=>{ e.preventDefault(); saveScore(); });

if(scoreSubmitBtn){ scoreSubmitBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); saveScore(); }); }

async function newGame(){
  turnCount=0; matchedPairs=0; turnsEl.textContent='0'; timeEl.textContent='0s';
  statusEl.textContent='Nieuwe set wordt geladen...';
  animals=await fetchAnimals();
  if(!animals.length){ statusEl.textContent='Geen dieren gevonden in ./animalcards.'; }
  renderZones();
  startTimer();
  statusEl.textContent='Sleep de ouder naar de juiste baby.';
}

newGameBtn.addEventListener('click', newGame);
winNewBtn?.addEventListener('click', ()=>{ try { winDialog.hide(); } catch(_) {}; newGame(); });
winSaveBtn?.addEventListener('click', async ()=>{ await saveScore(); try { winDialog.hide(); } catch(_) {} });
topScoresBtn?.addEventListener('click', async ()=>{
  const res=await fetch('api/scores.php');
  if(!res.ok){ return; }
  const list=await res.json();
  dialogHighscoresList.innerHTML='';
  list.forEach((item)=>{
    const li=document.createElement('li');
    li.textContent=`${item.name} – ${item.turns} beurten – ${item.seconds}s`;
    dialogHighscoresList.appendChild(li);
  });
  try { scoresDialog.show(); } catch(_) {}
});
scoresCloseBtn?.addEventListener('click', ()=>{ try { scoresDialog.hide(); } catch(_) {} });
navPlay?.addEventListener('click', ()=>{
  statusEl.scrollIntoView({behavior:'smooth',block:'center'});
  statusEl.textContent='Klik de bovenste kaart of sleep/klik naar de juiste baby.';
});

// STARTUP - Initalizatie van de game.
// boot - Spel aanmaken & data loaden begint.

newGame();


