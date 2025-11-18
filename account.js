// account.js — handles account form, theme application, location suggestions
(function(){
  const LOCAL_ACCOUNT = 'user_account_v1';

  // elements
  const emailEl = document.getElementById('email');
  const pwEl = document.getElementById('password');
  const togglePw = document.getElementById('togglePassword');
  const birthdayEl = document.getElementById('birthday');
  const locationEl = document.getElementById('location');
  const detectBtn = document.getElementById('detectLoc');
  const suggestions = document.getElementById('locSuggestions');
  const langEl = document.getElementById('language');
  const saveBtn = document.getElementById('saveAccount');
  const toast = document.getElementById('toast');

  // small city list (sample) — name, country, lat, lon
  const CITIES = [
    {name:'Sofia', country:'BG', lat:42.6977, lon:23.3219},
    {name:'Plovdiv', country:'BG', lat:42.1354, lon:24.7453},
    {name:'Varna', country:'BG', lat:43.2141, lon:27.9147},
    {name:'Burgas', country:'BG', lat:42.5048, lon:27.4626},
    {name:'London', country:'GB', lat:51.5074, lon:-0.1278},
    {name:'New York', country:'US', lat:40.7128, lon:-74.0060},
    {name:'San Francisco', country:'US', lat:37.7749, lon:-122.4194},
    {name:'Berlin', country:'DE', lat:52.52, lon:13.4050},
    {name:'Madrid', country:'ES', lat:40.4168, lon:-3.7038},
    {name:'Rome', country:'IT', lat:41.9028, lon:12.4964},
    {name:'Paris', country:'FR', lat:48.8566, lon:2.3522},
    {name:'Istanbul', country:'TR', lat:41.0082, lon:28.9784},
    {name:'Moscow', country:'RU', lat:55.7558, lon:37.6173},
    {name:'Tokyo', country:'JP', lat:35.6762, lon:139.6503},
    {name:'Sydney', country:'AU', lat:-33.8688, lon:151.2093}
  ];

  // theme application: read from avatar_components_v1 (accent and bgColor)
  function applyProfileTheme(){
    try{
      const raw = localStorage.getItem('avatar_components_v1');
      if(!raw) return;
      const s = JSON.parse(raw);
      if(s.accent) document.documentElement.style.setProperty('--accent', s.accent);
      if(s.bgColor){
        const bg = s.bgColor;
        const light = (function(h){
          // simple lighten
          const hex = h.replace('#','');
          const n = parseInt(hex.length===3?hex.split('').map(c=>c+c).join(''):hex,16);
          const r = (n>>16)&255, g=(n>>8)&255,b=n&255;
          const R = Math.round(r + (255-r)*0.12), G = Math.round(g + (255-g)*0.12), B = Math.round(b + (255-b)*0.12);
          const toHex = n=>('0'+n.toString(16)).slice(-2);
          return '#'+toHex(R)+toHex(G)+toHex(B);
        })(bg);
        document.documentElement.style.setProperty('--bg-1', bg);
        document.documentElement.style.setProperty('--bg-2', light);
        document.body.style.background = `linear-gradient(180deg, ${bg}, ${light})`;
      }
      // set nickname if available (on acct page)
      try{
        const nickEl = document.getElementById('acctNickDisplay');
        if(nickEl) nickEl.textContent = s.nick || 'Nickname';
      }catch(e){}
    }catch(e){console.warn('applyProfileTheme failed', e)}
  }

  // small helper: haversine distance
  function haversine(lat1,lon1,lat2,lon2){
    const toRad = d => d * Math.PI/180;
    const R = 6371; // km
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }

  function showSuggestions(list){
    suggestions.innerHTML = '';
    if(!list || !list.length) { suggestions.classList.remove('show'); suggestions.setAttribute('aria-hidden','true'); return; }
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name}, ${item.country}`;
      li.tabIndex = 0;
      li.addEventListener('click', ()=>{ locationEl.value = `${item.name}, ${item.country}`; suggestions.classList.remove('show'); saveAccount(); });
      li.addEventListener('keydown', (e)=>{ if(e.key==='Enter') { li.click(); } });
      suggestions.appendChild(li);
    });
    suggestions.classList.add('show');
    suggestions.setAttribute('aria-hidden','false');
  }

  function detectNearby(){
    if(!navigator.geolocation){ showToast('Geolocation not supported'); return; }
    showToast('Detecting nearby cities — please allow location access');
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      // compute distances
      const list = CITIES.map(c=>({ ...c, d: haversine(lat,lon,c.lat,c.lon) })).sort((a,b)=>a.d-b.d).slice(0,6);
      showSuggestions(list);
    }, (err)=>{
      showToast('Location blocked or unavailable');
      // fallback: show local cities first
      showSuggestions(CITIES.slice(0,6));
    }, {timeout:8000});
  }

  function loadAccount(){
    try{
      const raw = localStorage.getItem(LOCAL_ACCOUNT);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(s.email) emailEl.value = s.email;
      if(s.birthday) birthdayEl.value = s.birthday;
      if(s.location) locationEl.value = s.location;
      if(s.language) langEl.value = s.language;
      if(s.password) pwEl.value = s.password;
    }catch(e){console.warn(e)}
  }

  function saveAccount(){
    try{
      const payload = {
        email: emailEl.value || '',
        password: pwEl.value || '',
        birthday: birthdayEl.value || '',
        location: locationEl.value || '',
        language: langEl.value || ''
      };
      localStorage.setItem(LOCAL_ACCOUNT, JSON.stringify(payload));
      showToast('Account saved');
    }catch(e){ showToast('Save failed'); }
  }

  function showToast(msg, ms=1800){
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toast.classList.remove('show'), ms);
  }

  // toggle password visibility
  togglePw && togglePw.addEventListener('click', ()=>{
    if(pwEl.type === 'password'){ pwEl.type = 'text'; togglePw.textContent = 'Hide'; }
    else { pwEl.type = 'password'; togglePw.textContent = 'Show'; }
  });

  detectBtn && detectBtn.addEventListener('click', detectNearby);
  saveBtn && saveBtn.addEventListener('click', saveAccount);

  // when clicking outside suggestions hide it
  document.addEventListener('click', (e)=>{ if(!e.target.closest('.location-field')){ suggestions.classList.remove('show'); suggestions.setAttribute('aria-hidden','true'); } });

  // init: apply theme, load saved account; if no email set, attempt to pull from avatar_components_v1 (none) or placeholder
  applyProfileTheme();
  loadAccount();
  // if email empty, use placeholder
  if(!emailEl.value) emailEl.value = 'user@example.com';

  // account menu dropdown
  const acctMenuBtn = document.getElementById('acctMenuBtn');
  const acctMenuDropdown = document.getElementById('acctMenuDropdown');
  if(acctMenuBtn && acctMenuDropdown){
    acctMenuBtn.addEventListener('click', ()=>{
      const open = acctMenuBtn.classList.toggle('open');
      acctMenuDropdown.classList.toggle('show', open);
      acctMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      acctMenuDropdown.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    // close when clicking outside
    document.addEventListener('click', (e)=>{ if(!e.target.closest('.avatar-menu') && !e.target.closest('#acctMenuBtn')){ acctMenuDropdown.classList.remove('show'); acctMenuBtn.classList.remove('open'); acctMenuBtn.setAttribute('aria-expanded','false'); acctMenuDropdown.setAttribute('aria-hidden','true'); } });
    // keyboard: Esc to close
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ acctMenuDropdown.classList.remove('show'); acctMenuBtn.classList.remove('open'); acctMenuBtn.setAttribute('aria-expanded','false'); acctMenuDropdown.setAttribute('aria-hidden','true'); } });
  }

})();
