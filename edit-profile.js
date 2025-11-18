/* app.js — component sprite builder
   Place your sprite-sheet at: images/avatar-components-spritesheet.png
   The sheet is a grid with COLS x ROWS frames. Change FRAME_W/FRAME_H / COLS/ROWS if your sheet differs.
*/

const SPRITE = 'images/avatar-components-spritesheet.png';

// CONFIG: update if your sprite frames use different size / grid
const FRAME_W = 256;   // width of each frame in sprite (px)
const FRAME_H = 256;   // height of each frame in sprite (px)
const COLS = 10;
const ROWS = 4;
const TOTAL = COLS * ROWS; // should be 40 for our layout

// index ranges for each component (0-based)
const RANGES = {
  skin: { start: 0, count: 10 },      // indices 0 .. 9
  hair: { start: 10, count: 10 },     // 10 .. 19
  hat:  { start: 20, count: 10 },     // 20 .. 29
  expr: { start: 30, count: 5 },      // 30 .. 34
  shirt:{ start: 35, count: 5 }       // 35 .. 39
};

// DOM refs
const layerSkin = document.getElementById('layer-skin');
const layerHair = document.getElementById('layer-hair');
const layerHat = document.getElementById('layer-hat');
const layerExpr = document.getElementById('layer-expression');
const layerShirt = document.getElementById('layer-shirt');
const layerShade = document.getElementById('layer-shade');

const skinRow = document.getElementById('skinRow');
const hairRow = document.getElementById('hairRow');
const hatRow = document.getElementById('hatRow');
const exprRow = document.getElementById('exprRow');
const shirtRow = document.getElementById('shirtRow');

// control buttons removed from UI; no DOM refs for them

const previewWrap = document.querySelector('.preview-wrap');

const LOCAL_KEY = 'avatar_components_v1';

// inputs for about/nick
const nickInput = document.getElementById('nick');
const aboutInput = document.getElementById('about');

// utility: convert frame index -> {col,row}
function frameToCR(index){
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {col, row};
}

// color helpers: hex <-> rgb and lighten by blending toward white
function hexToRgb(hex){
  if(!hex) return null;
  hex = hex.replace('#','');
  if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const num = parseInt(hex,16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r,g,b){
  const toHex = (n)=> ('0'+Math.round(n).toString(16)).slice(-2);
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function lightenHex(hex, amount){
  // amount: 0..1 - how much to blend towards white
  const rgb = hexToRgb(hex) || {r:233,g:246,b:255};
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  return rgbToHex(r,g,b);
}

// utility: set background on a given layer element to show a specific frame
function setLayerFrame(el, frameIndex){
  if(frameIndex == null){
    // hide animated layer if present
    if(el.classList.contains('layer-fade')) el.classList.remove('show');
    el.style.backgroundImage = 'none';
    return;
  }
  // compute preview element size and scale to show one frame exactly
  const elW = previewWrap.clientWidth;
  const elH = previewWrap.clientHeight;
  // scale needed to make FRAME_W -> elW (so each frame fills preview)
  const scaleX = elW / FRAME_W;
  const scaleY = elH / FRAME_H;
  // we'll use uniform scaleX (assume square frames)
  const scale = scaleX;
  const sheetW = COLS * FRAME_W;
  const sheetH = ROWS * FRAME_H;
  const bgW = Math.round(sheetW * scale);
  const bgH = Math.round(sheetH * scale);

  const {col, row} = frameToCR(frameIndex);
  const posX = -Math.round(col * FRAME_W * scale);
  const posY = -Math.round(row * FRAME_H * scale);

  el.style.backgroundImage = `url("${SPRITE}")`;
  el.style.backgroundSize = `${bgW}px ${bgH}px`;
  el.style.backgroundPosition = `${posX}px ${posY}px`;
  // trigger fade transition for layer-fade elements
  if(el.classList.contains('layer-fade')){
    // restart animation
    el.classList.remove('show');
    // ensure style applied before adding class
    requestAnimationFrame(()=>{
      el.classList.add('show');
    });
  }
}

// create option thumbnail element for a given frame
function makeOption(frameIndex){
  const opt = document.createElement('button');
  opt.className = 'option';
  opt.setAttribute('data-frame', frameIndex);
  // compute thumbnail background so option shows correct frame
  // Use thumbnail size to compute scale similar to preview logic
  // We'll compute using CSS size once inserted: simply set backgroundImage now,
  opt.style.backgroundImage = `url("${SPRITE}")`;
  // store col/row for layout pass
  const {col, row} = frameToCR(frameIndex);
  opt.dataset.col = col;
  opt.dataset.row = row;
  opt.addEventListener('click', () => {
    onOptionClick(frameIndex);
  });
  return opt;
}

// layout background-size and background-position for all option buttons
function layoutOptions(){
  document.querySelectorAll('.option').forEach(opt => {
    const w = opt.clientWidth;
    const h = opt.clientHeight;
    const scale = w / FRAME_W;
    const sheetW = COLS * FRAME_W;
    const sheetH = ROWS * FRAME_H;
    const bgW = Math.round(sheetW * scale);
    const bgH = Math.round(sheetH * scale);
    const col = parseInt(opt.dataset.col,10), row = parseInt(opt.dataset.row,10);
    const posX = -Math.round(col * FRAME_W * scale);
    const posY = -Math.round(row * FRAME_H * scale);
    opt.style.backgroundSize = `${bgW}px ${bgH}px`;
    opt.style.backgroundPosition = `${posX}px ${posY}px`;
  });
}

// populate rows from RANGES
function populateRows(){
  // helper
  function fillRow(container, start, count){
    container.innerHTML = '';
    for(let i=0;i<count;i++){
      const idx = start + i;
      if(idx >= TOTAL) break;
      const opt = makeOption(idx);
      container.appendChild(opt);
    }
  }
  fillRow(skinRow, RANGES.skin.start, RANGES.skin.count);
  fillRow(hairRow, RANGES.hair.start, RANGES.hair.count);
  fillRow(hatRow,  RANGES.hat.start,  RANGES.hat.count);
  fillRow(exprRow, RANGES.expr.start, RANGES.expr.count);
  fillRow(shirtRow,RANGES.shirt.start,RANGES.shirt.count);

  // layout after insertion
  requestAnimationFrame(layoutOptions);
}

// state
let state = {
  skin: RANGES.skin.start,
  hair: RANGES.hair.start,
  hat:  RANGES.hat.start,
  expr: RANGES.expr.start,
  shirt:RANGES.shirt.start
};

// set UI selected class on option buttons
function markSelected(){
  document.querySelectorAll('.option').forEach(el=>{
    const idx = parseInt(el.dataset.frame,10);
    const isSelected = (idx === state.skin || idx === state.hair || idx === state.hat || idx === state.expr || idx === state.shirt);
    el.classList.toggle('selected', isSelected);
  });
}

// apply state to layers
function applyState(){
  setLayerFrame(layerShirt, state.shirt);
  setLayerFrame(layerSkin, state.skin);
  setLayerFrame(layerHair, state.hair);
  setLayerFrame(layerHat,  state.hat);
  setLayerFrame(layerExpr, state.expr);
  // small shade/back layer: show skin silhouette or subtle background if you want
  setLayerFrame(layerShade, null); // none by default
  markSelected();
}

// when user clicks an option button: we detect which component it belongs to and set state
function onOptionClick(frameIndex){
  // check which range contains frameIndex
  if(frameIndex >= RANGES.skin.start && frameIndex < RANGES.skin.start + RANGES.skin.count){
    state.skin = frameIndex;
  } else if(frameIndex >= RANGES.hair.start && frameIndex < RANGES.hair.start + RANGES.hair.count){
    state.hair = frameIndex;
  } else if(frameIndex >= RANGES.hat.start && frameIndex < RANGES.hat.start + RANGES.hat.count){
    state.hat = frameIndex;
  } else if(frameIndex >= RANGES.expr.start && frameIndex < RANGES.expr.start + RANGES.expr.count){
    state.expr = frameIndex;
  } else if(frameIndex >= RANGES.shirt.start && frameIndex < RANGES.shirt.start + RANGES.shirt.count){
    state.shirt = frameIndex;
  }
  applyState();
}

// randomize components
function randomize(){
  const r = (min,count) => Math.floor(Math.random()*count) + min;
  state.skin = r(RANGES.skin.start, RANGES.skin.count);
  state.hair = r(RANGES.hair.start, RANGES.hair.count);
  state.hat  = r(RANGES.hat.start,  RANGES.hat.count);
  state.expr = r(RANGES.expr.start, RANGES.expr.count);
  state.shirt= r(RANGES.shirt.start,RANGES.shirt.count);
  applyState();
}

// save/load
function saveLocal(){
  try{
    const pron = (document.getElementById('pronouns')||{}).value || '';
    const accent = (document.getElementById('accentColor')||{}).value || '';
    const bg = (document.getElementById('bgColor')||{}).value || '';
    const payload = Object.assign({}, state, {
      nick: nickInput ? nickInput.value.trim() : '',
      about: aboutInput ? aboutInput.value.trim() : '',
      pronouns: pron,
      accent: accent,
      bgColor: bg
    });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    // silent save — no UI buttons in this layout
    // console.log('saved', payload);
  }catch(e){
    console.error('saveLocal failed', e);
  }
}

function loadLocal(){
  try{
    const raw = localStorage.getItem(LOCAL_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    // validate
    if(typeof s.skin === 'number') state.skin = s.skin;
    if(typeof s.hair === 'number') state.hair = s.hair;
    if(typeof s.hat  === 'number') state.hat = s.hat;
    if(typeof s.expr === 'number') state.expr = s.expr;
    if(typeof s.shirt=== 'number') state.shirt= s.shirt;
    // restore text fields
    if(nickInput && typeof s.nick === 'string') nickInput.value = s.nick;
    if(aboutInput && typeof s.about === 'string') aboutInput.value = s.about;
    // restore pronouns and accent if present
    const pronEl = document.getElementById('pronouns');
    if(pronEl && typeof s.pronouns === 'string') pronEl.value = s.pronouns;
    const accEl = document.getElementById('accentColor');
    if(accEl && typeof s.accent === 'string' && s.accent){
      accEl.value = s.accent;
      try{ document.documentElement.style.setProperty('--accent', s.accent); }catch(e){}
    }
    const bgEl = document.getElementById('bgColor');
    if(bgEl && typeof s.bgColor === 'string' && s.bgColor){
      bgEl.value = s.bgColor;
      // apply gradient: set --bg-1 to chosen and --bg-2 to a lightened variant
      try{
        const light = lightenHex(s.bgColor, 0.12);
        document.documentElement.style.setProperty('--bg-1', s.bgColor);
        document.documentElement.style.setProperty('--bg-2', light);
      }catch(e){}
    }
  }catch(e){}
}

// Compose a PNG data URL from the selected frames (same order as exportPNG)
// composeDataURL removed — image composition left available via exportPNG if needed

// Export composed PNG: draw each selected frame from sprite to an offscreen canvas in order
function exportPNG(filename = 'avatar.png'){
  const img = new Image();
  img.onload = function(){
    // final resolution: FRAME_W x FRAME_H
    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d');

    // draw order: shirt (behind), skin, hair, hat, expression (top)
    const drawFrame = (frameIndex) => {
      if(frameIndex == null) return Promise.resolve();
      return new Promise((resolve)=>{
        const {col,row} = frameToCR(frameIndex);
        // source rect on sheet
        const sx = col*FRAME_W, sy = row*FRAME_H;
        ctx.drawImage(img, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
        resolve();
      });
    };

    // draw sequence
    (async ()=>{
      // clear to transparent
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // Shirt
      await drawFrame(state.shirt);
      // Skin
      await drawFrame(state.skin);
      // Hair
      await drawFrame(state.hair);
      // Hat
      await drawFrame(state.hat);
      // Expression
      await drawFrame(state.expr);

      // export
      canvas.toBlob(blob=>{
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, 'image/png');
    })();
  };
  img.crossOrigin = 'anonymous';
  img.src = SPRITE;
}

// keyboard nav (optional)
window.addEventListener('keydown', e=>{
  if(e.key === 'r') randomize();
});

// debounce helper for input events
function debounce(fn, delay){
  let t = null;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=> fn.apply(this, args), delay);
  };
}

// initialize UI
function init(){
  populateRows();
  layoutOptions();
  loadLocal();
  applyState();

  // staggered entrance for question cards
  const cards = document.querySelectorAll('.question-card');
  cards.forEach((c, i) => {
    setTimeout(() => c.classList.add('show'), 120 * i);
  });

  // wire option clicks to auto-save
  // override option click behavior to also persist state
  document.addEventListener('click', (ev)=>{
    const el = ev.target.closest('.option');
    if(!el) return;
    const idx = parseInt(el.dataset.frame,10);
    if(Number.isFinite(idx)){
      onOptionClick(idx);
      saveLocal();
    }
  });

  // wire export button (overlay) if present
  const exportBtn = document.getElementById('exportBtn');
  if(exportBtn){
    exportBtn.addEventListener('click', ()=> exportPNG('avatar.png'));
  }

  // wire text fields to auto-save with debounce
  const pronounsInput = document.getElementById('pronouns');
  const accentInput = document.getElementById('accentColor');
  const bgInput = document.getElementById('bgColor');
  const saveDebounced = debounce(()=> saveLocal(), 420);
  if(nickInput) nickInput.addEventListener('input', saveDebounced);
  if(aboutInput) aboutInput.addEventListener('input', saveDebounced);
  if(pronounsInput) pronounsInput.addEventListener('input', saveDebounced);
  if(accentInput){
    // apply accent color live and save
    accentInput.addEventListener('input', (e)=>{
      try{ document.documentElement.style.setProperty('--accent', e.target.value); }catch(err){}
      saveDebounced();
    });
  }
  if(bgInput){
    bgInput.addEventListener('input', (e)=>{
      const v = e.target.value;
      try{
        const light = lightenHex(v, 0.12);
        document.documentElement.style.setProperty('--bg-1', v);
        document.documentElement.style.setProperty('--bg-2', light);
      }catch(err){}
      saveDebounced();
    });
  }

  // live nickname preview under avatar
  const nickDisplay = document.getElementById('nickDisplay');
  if(nickDisplay && nickInput){
    nickDisplay.textContent = nickInput.value || 'Nickname';
    nickInput.addEventListener('input', (e)=>{
      nickDisplay.textContent = e.target.value || 'Nickname';
      saveDebounced();
    });
  }

  // Save button behaviour (beautiful feedback)
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if(saveProfileBtn){
    saveProfileBtn.addEventListener('click', async ()=>{
      saveProfileBtn.classList.add('saving');
      saveLocal();
      // visual feedback
      setTimeout(()=>{
        saveProfileBtn.classList.remove('saving');
        saveProfileBtn.classList.add('saved');
        const old = saveProfileBtn.textContent;
        saveProfileBtn.textContent = 'Saved';
        setTimeout(()=>{ saveProfileBtn.classList.remove('saved'); saveProfileBtn.textContent = old; }, 1200);
      }, 450);
    });
  }

  // top menu dropdown (hamburger animation)
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  if(menuBtn && menuDropdown){
    menuBtn.addEventListener('click', (e)=>{
      const open = menuBtn.classList.toggle('open');
      menuDropdown.classList.toggle('show', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuDropdown.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    // close when clicking outside
    document.addEventListener('click', (e)=>{ if(!e.target.closest('.avatar-menu') && !e.target.closest('#menuBtn')){ menuDropdown.classList.remove('show'); menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); menuDropdown.setAttribute('aria-hidden','true'); } });
    // keyboard: Esc to close
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ menuDropdown.classList.remove('show'); menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); menuDropdown.setAttribute('aria-hidden','true'); } });
  }

  // relayout on resize
  window.addEventListener('resize', layoutOptions);
}

init();
