/* מנוע תרגום, שני שלבים:
   1. המנוע המובנה של Chrome (Translator API) — רץ על המחשב, פרטי ובחינם, אם חבילת השפה כבר הותקנה.
   2. אם לא — שירות התרגום החינמי MyMemory דרך האינטרנט (מוגבל לכ-5,000 תווים ביום לכל מחשב).
   ברקע, בלחיצה הבאה של המשתמש, מורידים את חבילת השפה של Chrome כדי שהפעם הבאה תרוץ על המחשב.
   תוצאה: {text} | {none:true} */
const Translate = (() => {
  const local = new Map(), wanted = new Set();
  const hasLocal = 'Translator' in self;
  let cloudBlockedUntil = 0;

  async function viaChrome(text, from, to) {
    if (!hasLocal) return null;
    const pair = from + '>' + to;
    try {
      if (!local.has(pair)) {
        const state = await Translator.availability({ sourceLanguage: from, targetLanguage: to });
        if (state !== 'available') { if (state !== 'unavailable') wanted.add(pair); return null; }
        local.set(pair, Translator.create({ sourceLanguage: from, targetLanguage: to }));
      }
      return await (await local.get(pair)).translate(text);
    } catch { local.delete(pair); return null; }
  }

  /* MyMemory מקבל עד 500 בייט לבקשה — מפצלים טקסט ארוך לחלקים */
  function chunks(text) {
    const enc = new TextEncoder(), out = []; let cur = '';
    for (const part of text.split(/(?<=[.!?。！？\n])/)) {
      for (const w of part.split(/(?<= )/)) {
        if (enc.encode(cur + w).length > 440 && cur) { out.push(cur); cur = ''; }
        cur += w;
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  async function viaCloud(text, from, to) {
    if (Date.now() < cloudBlockedUntil) return null;
    try {
      const res = [];
      for (const c of chunks(text)) {
        const u = 'https://api.mymemory.translated.net/get?' + new URLSearchParams({ q: c, langpair: from + '|' + to });
        const r = await fetch(u); if (!r.ok) throw 0;
        const j = await r.json(), tx = j && j.responseData && j.responseData.translatedText;
        if (Number(j.responseStatus) !== 200 || !tx || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(tx)) {
          if (Number(j.responseStatus) === 429 || /WARNING/i.test(tx || '')) cloudBlockedUntil = Date.now() + 10 * 60000;
          throw 0;
        }
        res.push(tx);
      }
      return res.join(' ').replace(/\s+\n/g, '\n').trim();
    } catch { return null; }
  }

  async function run(text, from, to) {
    const a = await viaChrome(text, from, to);
    if (a) return { text: a };
    const b = await viaCloud(text, from, to);
    return b ? { text: b } : { none: true };
  }

  /* נקרא מתוך לחיצה של המשתמש: מוריד ברקע חבילות שפה חסרות. מחזיר true אם משהו הותקן. */
  async function warm() {
    if (!hasLocal || !wanted.size) return false;
    const pairs = [...wanted]; wanted.clear();
    const done = await Promise.all(pairs.map(async pair => {
      const [from, to] = pair.split('>');
      try {
        const p = Translator.create({ sourceLanguage: from, targetLanguage: to });
        local.set(pair, p); await p; return true;
      } catch { local.delete(pair); return false; }
    }));
    return done.some(Boolean);
  }
  return { run, warm };
})();
