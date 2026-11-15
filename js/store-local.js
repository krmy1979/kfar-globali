/* שכבת נתונים מקומית (גרסת ניסיון): localStorage + BroadcastChannel בין חלונות.
   בהמשך תוחלף ב-store של שרת אמיתי עם אותו ממשק בדיוק:
   subscribe / send / saveTranslation / remove / report / users / touch */
const LocalStore = (() => {
  const KEEP = 60, KEEP_AUDIO = 8;
  const listeners = new Set();
  const bc = 'BroadcastChannel' in self ? new BroadcastChannel('kfar-globali') : null;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  let onFull = () => {};
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch { return false; }
  }
  const key = room => 'kg_room_' + room;
  const emit = (room, local) => {
    listeners.forEach(fn => fn(room));
    if (local && bc) bc.postMessage({ room });
  };
  if (bc) bc.onmessage = e => emit(e.data.room, false);
  addEventListener('storage', e => { if (e.key && e.key.startsWith('kg_')) emit(e.key === 'kg_users' ? '__users' : e.key.replace('kg_room_', ''), false); });

  function saveRoom(room, list) {
    list = list.slice(-KEEP);
    let voices = 0;
    for (let i = list.length - 1; i >= 0; i--)
      if (list[i].audio && ++voices > KEEP_AUDIO) list[i] = { ...list[i], audio: null };
    if (!write(key(room), list)) {
      list = list.slice(-20).map(m => ({ ...m, audio: null }));
      write(key(room), list); onFull();
    }
  }
  return {
    live: false,
    init: async () => null,
    watch() {},
    onFull(fn) { onFull = fn; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    messages: room => read(key(room), []),
    send(room, msg) {
      const list = read(key(room), []);
      list.push({ ...msg, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), ts: Date.now(), tr: {} });
      saveRoom(room, list); emit(room, true);
    },
    saveTranslation(room, id, lang, text) {
      const list = read(key(room), []);
      const m = list.find(x => x.id === id);
      if (!m || (m.tr && m.tr[lang])) return;
      m.tr = { ...(m.tr || {}), [lang]: text };
      saveRoom(room, list); emit(room, true);
    },
    remove(room, id) {
      saveRoom(room, read(key(room), []).filter(m => m.id !== id)); emit(room, true);
    },
    report(room, msg, by) {
      const r = read('kg_reports', []);
      r.push({ room, id: msg.id, uid: msg.uid, text: msg.text, by, ts: Date.now() });
      write('kg_reports', r.slice(-200));
    },
    users: () => read('kg_users', {}),
    touch(me) {
      const u = read('kg_users', {});
      u[me.id] = { name: me.name, lang: me.lang, seen: Date.now() };
      write('kg_users', u); emit('__users', true);
    }
  };
})();
