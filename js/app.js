/* כפר גלובלי — לוגיקת הממשק */
(() => {
  const $ = id => document.getElementById(id);
  const ROOMS = ['general', 'tech', 'cultures', 'collab', 'langs'];
  let me = null, room = 'general', showOrig = new Set(), trState = new Map(), els = new Map();
  /* בענן הזהות היא לפי הדפדפן (localStorage); בגרסה המקומית לפי חלון (sessionStorage) כדי לדמות שני משתמשים */
  const bag = Store.live ? localStorage : sessionStorage;
  const readS = (k, d) => { try { return JSON.parse(bag.getItem(k)) ?? d; } catch { return d; } };
  let cloudUid = null;
  const ONLINE_MS = Store.live ? 200000 : 60000;
  const blockedKey = () => 'kg_blocked_' + me.id;
  const blocked = () => { try { return new Set(JSON.parse(localStorage.getItem(blockedKey())) || []); } catch { return new Set(); } };

  /* ---------- כניסה ---------- */
  function initJoin() {
    const sel = $('joinLang');
    if (sel.options.length) return;
    LANGS.forEach(l => sel.add(new Option(l.name, l.code)));
    const guess = (navigator.language || 'he').slice(0, 2);
    sel.value = LANGS.some(l => l.code === guess) ? guess : 'he';
    setUiLang(sel.value);
    sel.onchange = () => setUiLang(sel.value);
    $('joinForm').onsubmit = e => {
      e.preventDefault();
      const name = $('joinName').value.trim();
      const okName = name.length >= 2, okAgree = $('joinAgree').checked;
      $('nameErr').textContent = t('errName'); $('nameErr').hidden = okName;
      $('agreeErr').textContent = t('errAgree'); $('agreeErr').hidden = okAgree;
      if (!okName) return $('joinName').focus();
      if (!okAgree) return $('joinAgree').focus();
      me = { id: cloudUid || (me && me.id) || 'u' + Math.random().toString(36).slice(2, 10), name, lang: sel.value };
      try { bag.setItem('kg_me', JSON.stringify(me)); } catch {}
      start();
    };
  }
  function showJoin() {
    $('app').hidden = true; $('join').hidden = false;
    if (me) { $('joinName').value = me.name; $('joinLang').value = me.lang; $('joinAgree').checked = true; }
    setUiLang($('joinLang').value);
    $('joinName').focus();
  }

  /* ---------- הפעלה ---------- */
  function start() {
    $('join').hidden = true; $('app').hidden = false;
    setUiLang(me.lang);
    $('meName').textContent = me.name;
    $('meLang').textContent = langOf(me.lang).name;
    $('meAvatar').textContent = me.name.slice(0, 1).toUpperCase();
    $('meBtn').title = t('switchUser');
    $('langChip').textContent = langOf(me.lang).name;
    $('input').placeholder = t('placeholder');
    $('input').dir = document.documentElement.dir;
    $('micBtn').title = t('micStart'); $('micBtn').setAttribute('aria-label', t('micStart'));
    $('sideNote').textContent = t(Store.live ? 'liveNote' : 'demoNote');
    $('peopleEmpty').textContent = t(Store.live ? 'peopleEmptyLive' : 'peopleEmpty');
    Store.touch(me);
    renderSide(); openRoom(room, false);
  }

  /* ---------- סרגל צד ---------- */
  const dmId = uid => 'dm_' + [me.id, uid].sort().join('_');
  function roomBtn(id, name, sub, mark, online) {
    const li = document.createElement('li'), b = document.createElement('button');
    b.className = 'room'; b.type = 'button';
    if (id === room) b.setAttribute('aria-current', 'true');
    const d = document.createElement('span'); d.className = 'dot'; d.textContent = mark;
    const n = document.createElement('span'); n.className = 'nm';
    const bdi = document.createElement('bdi'); bdi.textContent = name; n.append(bdi);
    if (sub) { const s = document.createElement('span'); s.className = 'sub'; s.textContent = ' · ' + sub; n.append(s); }
    b.append(d, n);
    if (online) { const o = document.createElement('span'); o.className = 'on'; o.title = t('online'); b.append(o); }
    b.onclick = () => openRoom(id, true);
    li.append(b); return li;
  }
  function renderSide() {
    const rl = $('roomList'); rl.replaceChildren();
    ROOMS.forEach(id => rl.append(roomBtn(id, t('r_' + id), '', '#')));
    const pl = $('peopleList'); pl.replaceChildren();
    const users = Store.users(), bl = blocked(), now = Date.now();
    const others = Object.entries(users).filter(([id]) => id !== me.id && !bl.has(id))
      .sort((a, b) => b[1].seen - a[1].seen).slice(0, 30);
    others.forEach(([id, u]) => pl.append(roomBtn(dmId(id), u.name, langOf(u.lang).name, u.name.slice(0, 1).toUpperCase(), now - u.seen < ONLINE_MS)));
    $('peopleEmpty').hidden = others.length > 0;
  }

  /* ---------- חדר ---------- */
  function openRoom(id, enter) {
    room = id; els.clear(); $('msgs').replaceChildren();
    if (id.startsWith('dm_')) {
      const other = id.slice(3).split('_').find(x => x !== me.id);
      const u = Store.users()[other];
      $('roomName').textContent = u ? u.name : '…';
      $('roomDesc').textContent = t('d_dm') + (u ? ' · ' + langOf(u.lang).name : '');
    } else {
      $('roomName').textContent = t('r_' + id);
      $('roomDesc').textContent = t('d_' + id);
    }
    if (enter) $('app').classList.add('in-chat');
    Store.watch(room);
    renderSide(); renderMsgs(true);
  }
  $('backBtn').onclick = () => $('app').classList.remove('in-chat');
  $('meBtn').onclick = showJoin;

  /* ---------- הודעות ---------- */
  const fmtTime = ts => new Date(ts).toLocaleTimeString(uiLang, { hour: '2-digit', minute: '2-digit' });
  function renderMsgs(jump) {
    const box = $('msgs'), bl = blocked();
    const list = Store.messages(room).filter(m => !bl.has(m.uid));
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    const ids = new Set(list.map(m => m.id));
    els.forEach((el, id) => { if (!ids.has(id)) { el.remove(); els.delete(id); } });
    list.forEach(m => {
      let el = els.get(m.id);
      if (!el) { el = buildMsg(m); els.set(m.id, el); box.append(el); }
      fillMsg(el, m);
    });
    $('empty').hidden = list.length > 0;
    if (jump || near) box.scrollTop = box.scrollHeight;
  }
  function buildMsg(m) {
    const el = document.createElement('article');
    el.className = 'msg' + (m.uid === me.id ? ' mine' : '');
    const meta = document.createElement('div'); meta.className = 'msg-meta';
    const b = document.createElement('b'); b.textContent = m.name; b.dir = 'auto';
    const s = document.createElement('span'); s.textContent = langOf(m.lang).name + ' · ' + fmtTime(m.ts);
    meta.append(b, s);
    const bub = document.createElement('div'); bub.className = 'bubble';
    if (m.audio) bub.append(buildAudio(m.audio));
    const main = document.createElement('div'); main.className = 'main'; main.dir = 'auto';
    const orig = document.createElement('div'); orig.className = 'orig'; orig.dir = 'auto'; orig.hidden = true;
    bub.append(main, orig);
    const act = document.createElement('div'); act.className = 'msg-actions';
    el.append(meta, bub, act);
    return el;
  }
  function buildAudio(dataUrl) {
    const a = document.createElement('audio'); a.controls = true; a.preload = 'auto';
    try {
      const [head, b64] = dataUrl.split(','), bin = atob(b64), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      a.src = URL.createObjectURL(new Blob([buf], { type: (head.match(/data:([^;,]+)/) || [])[1] || 'audio/webm' }));
    } catch { a.src = dataUrl; }
    /* הקלטות מהדפדפן נשמרות בלי אורך; בלי התיקון הזה הלחיצה הראשונה על פליי שותקת */
    a.addEventListener('loadedmetadata', () => {
      if (a.duration !== Infinity && !Number.isNaN(a.duration)) return;
      const back = () => { a.removeEventListener('timeupdate', back); a.currentTime = 0; };
      a.addEventListener('timeupdate', back);
      try { a.currentTime = 1e7; } catch {}
    }, { once: true });
    a.addEventListener('error', () => { a.replaceWith(Object.assign(document.createElement('div'), { className: 'state', textContent: t('audioUnsupported') })); }, { once: true });
    return a;
  }
  function link(label, fn, strong) {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'link' + (strong ? ' strong' : ''); b.textContent = label; b.onclick = fn; return b;
  }
  function fillMsg(el, m) {
    const main = el.querySelector('.main'), orig = el.querySelector('.orig'), act = el.querySelector('.msg-actions');
    const foreign = m.lang !== me.lang && !!m.text, tr = m.tr && m.tr[me.lang];
    const st = trState.get(m.id);
    let text = m.text, state = '';
    if (!m.text) { text = ''; state = m.audio ? t('noTranscript') : ''; }
    else if (foreign && tr) text = tr;
    else if (foreign) {
      if (!st) requestTr(m);
      state = trState.get(m.id) === 'none' ? t('noTr') : t('translating');
    }
    main.textContent = text;
    let stEl = el.querySelector('.state');
    if (state) { if (!stEl) { stEl = document.createElement('div'); stEl.className = 'state'; main.after(stEl); } stEl.textContent = state; }
    else if (stEl) stEl.remove();
    const open = showOrig.has(m.id) && foreign && tr;
    orig.hidden = !open; orig.textContent = open ? m.text : '';
    act.replaceChildren();
    if (foreign && tr) act.append(link(open ? t('hideOrig') : t('showOrig'), () => { open ? showOrig.delete(m.id) : showOrig.add(m.id); renderMsgs(); }));
    if (foreign && !tr && trState.get(m.id) === 'none') act.append(link(t('needPack'), retryFailed, true));
    if (m.uid === me.id) act.append(link(t('del'), () => guard(Store.remove(room, m.id))));
    else {
      act.append(link(t('report'), () => { guard(Store.report(room, m, me.id)); toast(t('reported')); }));
      act.append(link(t('block'), () => {
        const bl = blocked(); bl.add(m.uid);
        try { localStorage.setItem(blockedKey(), JSON.stringify([...bl])); } catch {}
        toast(t('blocked')); renderSide(); renderMsgs();
      }));
    }
  }
  async function requestTr(m) {
    trState.set(m.id, 'busy');
    const r = await Translate.run(m.text, m.lang, me.lang);
    if (r.text) { trState.delete(m.id); Store.saveTranslation(room, m.id, me.lang, r.text); return; }
    trState.set(m.id, 'none');
    renderMsgs();
  }
  /* ניסיון חוזר להודעות שלא תורגמו (אחרי התקנת חבילת שפה, או בלחיצה על "נסה שוב") */
  function retryFailed() { trState.forEach((v, id) => { if (v === 'none') trState.delete(id); }); renderMsgs(); }

  /* ---------- שליחה ---------- */
  const input = $('input');
  const grow = () => { input.dir = input.value ? 'auto' : document.documentElement.dir; input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; $('sendBtn').disabled = !input.value.trim(); };
  input.oninput = grow;
  input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('composer').requestSubmit(); } };
  $('composer').onsubmit = e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    guard(Store.send(room, { uid: me.id, name: me.name, lang: me.lang, text }), t('sendFail'));
    input.value = ''; grow(); input.focus();
  };

  /* ---------- הודעה קולית: הקלטה + תמלול בדפדפן ---------- */
  let rec = null;
  const MAX_AUDIO_BYTES = 270000;   // נכנס במגבלת המסמך בשרת אחרי קידוד base64
  function pickMime() {
    // mp4/AAC מתנגן גם ב-Chrome וגם בספארי; webm הוא ברירת המחדל כשאין תמיכה
    const prefs = ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/mp4'];
    return prefs.find(m => self.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
  }
  $('micBtn').onclick = async () => {
    if (rec) return rec.stop();
    if (!navigator.mediaDevices || !self.MediaRecorder) return toast(t('micDenied'));
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return toast(t('micDenied')); }
    const mime = pickMime(), opts = { audioBitsPerSecond: 24000 };
    if (mime) opts.mimeType = mime;
    let mr;
    try { mr = new MediaRecorder(stream, opts); } catch { mr = new MediaRecorder(stream); }
    const chunks = [], t0 = Date.now(), sendRoom = room;
    let bytes = 0, transcript = '', sr = null, srDone = null;

    /* זיהוי דיבור: מאזין לאותו ערוץ מיקרופון של ההקלטה (כשהדפדפן תומך), כולל תוצאות ביניים */
    const SR = self.SpeechRecognition || self.webkitSpeechRecognition;
    if (SR) {
      try {
        sr = new SR(); sr.lang = langOf(me.lang).speech; sr.continuous = true; sr.interimResults = true;
        sr.onresult = ev => { transcript = [...ev.results].map(r => r[0].transcript).join(' '); };
        sr.onerror = () => {};
        srDone = new Promise(res => { sr.onend = res; });
        try { sr.start(stream.getAudioTracks()[0]); } catch { sr.start(); }
      } catch { sr = null; srDone = null; }
    }
    const tick = setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      $('recTime').textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      if (sec >= 30 && mr.state === 'recording') mr.stop();
    }, 250);
    mr.ondataavailable = e => {
      if (!e.data || !e.data.size) return;
      chunks.push(e.data); bytes += e.data.size;
      if (bytes > MAX_AUDIO_BYTES && mr.state === 'recording') mr.stop();
    };
    mr.onstop = async () => {
      clearInterval(tick);
      rec = null; setRec(false);
      const tooShort = Date.now() - t0 < 700;
      /* מחכים שזיהוי הדיבור יסיים להחזיר את המילים האחרונות (עד 4 שניות) לפני השליחה */
      if (sr) {
        try { sr.stop(); } catch {}
        if (!tooShort) { toast(t('transcribing')); await Promise.race([srDone, new Promise(r => setTimeout(r, 4000))]); }
      }
      stream.getTracks().forEach(tr => tr.stop());
      if (tooShort) return;
      const blob = new Blob(chunks, { type: mr.mimeType || mime || 'audio/webm' });
      let audio = blob.size && blob.size <= MAX_AUDIO_BYTES * 1.05 ? await new Promise(res => {
        const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(blob);
      }) : null;
      if (audio && audio.length > 395000) audio = null;
      const text = transcript.replace(/\s+/g, ' ').trim();
      if (!audio && !text) return toast(t('voiceEmpty'));
      if (!audio) toast(t('audioTooBig'));
      else if (!text) toast(t('voiceNoText'));
      guard(Store.send(sendRoom, { uid: me.id, name: me.name, lang: me.lang, text, audio }), t('sendFail'));
    };
    rec = mr; mr.start(1000); setRec(true);
  };
  function setRec(on) {
    $('micBtn').classList.toggle('rec', on); $('recTime').hidden = !on; $('recTime').textContent = '0:00';
    const label = t(on ? 'micStop' : 'micStart');
    $('micBtn').title = label; $('micBtn').setAttribute('aria-label', label);
  }

  /* ---------- כללי ---------- */
  /* פעולות מול השרת מחזירות Promise — אם נכשלו, מודיעים למשתמש */
  function guard(p, msg) { if (p && p.catch) p.catch(e => { console.warn(e); toast(msg || t('sendFail')); }); }
  let toastT;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }
  Store.onFull(() => toast(t('storageFull')));
  Store.subscribe(r => {
    if (!me) return;
    if (r === '__users') return renderSide();
    if (r === room) renderMsgs();
  });
  document.addEventListener('click', () => { Translate.warm().then(ok => { if (ok && me) retryFailed(); }); });
  setInterval(() => { if (me && !document.hidden) Store.touch(me); }, Store.live ? 120000 : 20000);

  /* ---------- עלייה: התחברות לשרת ואז כניסה ---------- */
  async function boot() {
    initJoin();
    $('boot').classList.remove('failed'); $('bootRetry').hidden = true;
    $('bootMsg').textContent = t('connecting');
    try { cloudUid = await Store.init(); }
    catch (e) {
      console.warn(e);
      $('boot').classList.add('failed'); $('bootMsg').textContent = t('connectFail');
      $('bootRetry').textContent = t('retry'); $('bootRetry').hidden = false;
      return;
    }
    $('boot').hidden = true;
    me = readS('kg_me', null);
    if (me && cloudUid) me.id = cloudUid;
    me ? start() : showJoin();
  }
  $('bootRetry').onclick = () => location.reload();
  boot();
})();
