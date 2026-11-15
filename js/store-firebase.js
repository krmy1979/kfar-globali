/* שכבת נתונים בענן: Firebase Auth (כניסה אנונימית) + Firestore בזמן אמת.
   אותו ממשק כמו store-local.js. */
const FirebaseStore = cfg => {
  const V = 'https://www.gstatic.com/firebasejs/12.6.0/';
  const listeners = new Set(), cache = {};
  let f = null, db = null, uid = null, users = {}, current = null, stop = null;
  const emit = r => listeners.forEach(fn => fn(r));
  const msgs = room => f.collection(db, 'rooms', room, 'messages');
  return {
    live: true,
    async init() {
      const [appM, authM, fsM] = await Promise.all([
        import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js')
      ]);
      const app = appM.initializeApp(cfg);
      uid = (await authM.signInAnonymously(authM.getAuth(app))).user.uid;
      f = fsM; db = fsM.getFirestore(app);
      f.onSnapshot(f.query(f.collection(db, 'users'), f.orderBy('seen', 'desc'), f.limit(40)), s => {
        users = {}; s.forEach(d => { users[d.id] = d.data(); }); emit('__users');
      }, e => console.warn('users', e.code));
      return uid;
    },
    onFull() {},
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    watch(room) {
      if (current === room) return;
      if (stop) stop();
      current = room;
      stop = f.onSnapshot(f.query(msgs(room), f.orderBy('ts', 'desc'), f.limit(60)), s => {
        cache[room] = s.docs.map(d => ({ id: d.id, ...d.data() })).reverse(); emit(room);
      }, e => console.warn('room', e.code));
    },
    messages: room => cache[room] || [],
    send: (room, msg) => f.addDoc(msgs(room), { ...msg, audio: msg.audio || null, ts: Date.now(), tr: {} }),
    saveTranslation(room, id, lang, text) {
      f.updateDoc(f.doc(db, 'rooms', room, 'messages', id), { ['tr.' + lang]: text }).catch(() => {});
    },
    remove: (room, id) => f.deleteDoc(f.doc(db, 'rooms', room, 'messages', id)),
    report: (room, m, by) => f.addDoc(f.collection(db, 'reports'), { room, id: m.id, uid: m.uid, text: m.text || '', by, ts: Date.now() }),
    users: () => users,
    touch(me) { if (uid) f.setDoc(f.doc(db, 'users', uid), { name: me.name, lang: me.lang, seen: Date.now() }).catch(() => {}); }
  };
};
const Store = window.KG_FIREBASE ? FirebaseStore(window.KG_FIREBASE) : LocalStore;
