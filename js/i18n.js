/* שפות נתמכות + טקסטים של הממשק (עברית / אנגלית; שאר השפות מקבלות ממשק באנגלית) */
const LANGS = [
  { code: 'he', name: 'עברית', rtl: true, speech: 'he-IL' },
  { code: 'en', name: 'English', speech: 'en-US' },
  { code: 'ar', name: 'العربية', rtl: true, speech: 'ar-SA' },
  { code: 'am', name: 'አማርኛ', speech: 'am-ET' },
  { code: 'ru', name: 'Русский', speech: 'ru-RU' },
  { code: 'fr', name: 'Français', speech: 'fr-FR' },
  { code: 'es', name: 'Español', speech: 'es-ES' },
  { code: 'pt', name: 'Português', speech: 'pt-BR' },
  { code: 'de', name: 'Deutsch', speech: 'de-DE' },
  { code: 'it', name: 'Italiano', speech: 'it-IT' },
  { code: 'tr', name: 'Türkçe', speech: 'tr-TR' },
  { code: 'uk', name: 'Українська', speech: 'uk-UA' },
  { code: 'hi', name: 'हिन्दी', speech: 'hi-IN' },
  { code: 'zh', name: '中文', speech: 'zh-CN' },
  { code: 'ja', name: '日本語', speech: 'ja-JP' },
  { code: 'ko', name: '한국어', speech: 'ko-KR' }
];
const langOf = code => LANGS.find(l => l.code === code) || LANGS[1];

const UI = {
  he: {
    appName: 'כפר גלובלי',
    joinTitle: 'מדברים עם כל העולם, כל אחד בשפה שלו',
    joinLede: 'כתוב בעברית. מי שמולך יקרא בשפה שלו, ואתה תקרא אותו בעברית.',
    yourLang: 'השפה שלי', yourName: 'איך לקרוא לך?',
    agree: 'אני בן/בת 18 ומעלה ומסכים/ה לכללי הקהילה',
    enter: 'כניסה לכפר',
    rule1: 'מדברים בכבוד, גם כשלא מסכימים.',
    rule2: 'לא משתפים פרטים אישיים רגישים בחדרים הפתוחים.',
    rule3: 'הודעה פוגענית? אפשר לדווח עליה ולחסום את הכותב.',
    errName: 'צריך שם של 2 תווים לפחות.',
    errAgree: 'כדי להיכנס צריך לאשר גיל 18+ ואת כללי הקהילה.',
    rooms: 'חדרים', people: 'שיחות פרטיות',
    peopleEmpty: 'אין כרגע אנשים נוספים. פתח חלון נוסף של הדף כדי לנסות שיחה בין שתי שפות.',
    demoNote: 'גרסת ניסיון מקומית: ההודעות נשמרות רק בדפדפן הזה. לצורך תרגום, טקסט ההודעה עשוי להישלח לשירות התרגום MyMemory.',
    liveNote: 'הצ\'אט פתוח לכל העולם. לצורך תרגום, טקסט ההודעה עשוי להישלח לשירות התרגום MyMemory. אל תכתוב פרטים רגישים.',
    peopleEmptyLive: 'עדיין אין כאן אנשים נוספים. שתף את הקישור כדי להזמין.',
    connecting: 'מתחבר לכפר…', connectFail: 'לא הצלחנו להתחבר. בדוק את החיבור לאינטרנט ונסה שוב.', retry: 'נסה שוב',
    sendFail: 'ההודעה לא נשלחה. נסה שוב.',
    transcribing: 'מזהה את הדיבור…', voiceEmpty: 'לא נקלט קול. בדוק את המיקרופון ונסה שוב.',
    voiceNoText: 'ההקלטה נשלחה, אבל הדיבור לא זוהה ולכן אין לה תרגום.', audioUnsupported: 'הדפדפן הזה לא מצליח לנגן את ההקלטה.', audioTooBig: 'ההקלטה גדולה מדי, נשלח רק הטקסט שזוהה.',
    emptyTitle: 'עדיין שקט כאן',
    emptyText: 'כתוב את ההודעה הראשונה, בשפה שלך.',
    send: 'שלח', placeholder: 'כתוב הודעה בשפה שלך…',
    translating: 'מתרגם…', showOrig: 'הצג מקור', hideOrig: 'הסתר מקור',
    needPack: 'נסה לתרגם שוב', noTr: 'התרגום לא הצליח כרגע. מוצג המקור.',
    voice: 'הודעה קולית', noTranscript: 'הדיבור בהקלטה לא זוהה, ולכן אין תרגום.',
    report: 'דווח', block: 'חסום', del: 'מחק',
    reported: 'הדיווח נשמר. תודה.', blocked: 'המשתמש נחסם. לא תראה יותר את ההודעות שלו.',
    micDenied: 'אין גישה למיקרופון. אפשר להמשיך לכתוב.',
    micStart: 'הקלט הודעה קולית', micStop: 'עצור ושלח',
    switchUser: 'החלף שם או שפה', online: 'מחובר/ת',
    storageFull: 'האחסון המקומי מלא. הודעות ישנות נמחקו.',
    r_general: 'הלובי', d_general: 'שיחה חופשית עם כל מי שכאן',
    r_tech: 'טכנולוגיה', d_tech: 'כלים, רעיונות ושאלות טכניות',
    r_cultures: 'תרבויות', d_cultures: 'מנהגים, אוכל, מוזיקה וחגים מסביב לעולם',
    r_collab: 'שיתופי פעולה', d_collab: 'מחפשים שותפים לפרויקט או לרעיון',
    r_langs: 'לומדים שפות', d_langs: 'מתרגלים שפה חדשה מתוך שיחה',
    d_dm: 'שיחה פרטית'
  },
  en: {
    appName: 'Global Village',
    joinTitle: 'Talk with the whole world, each in your own language',
    joinLede: 'Write in your language. The other side reads it in theirs, and you read them in yours.',
    yourLang: 'My language', yourName: 'What should we call you?',
    agree: 'I am 18 or older and I accept the community rules',
    enter: 'Enter the village',
    rule1: 'Be respectful, even when you disagree.',
    rule2: 'Do not share sensitive personal details in open rooms.',
    rule3: 'Offensive message? You can report it and block the sender.',
    errName: 'Please enter a name of at least 2 characters.',
    errAgree: 'To enter, confirm you are 18+ and accept the rules.',
    rooms: 'Rooms', people: 'Private chats',
    peopleEmpty: 'Nobody else is here yet. Open this page in a second window to try a chat between two languages.',
    demoNote: 'Local trial version: messages are stored only in this browser. For translation, message text may be sent to the MyMemory translation service.',
    liveNote: 'This chat is open to the whole world. For translation, message text may be sent to the MyMemory translation service. Do not write sensitive details.',
    peopleEmptyLive: 'Nobody else is here yet. Share the link to invite people.',
    connecting: 'Connecting to the village…', connectFail: 'Could not connect. Check your internet connection and try again.', retry: 'Try again',
    sendFail: 'Message was not sent. Try again.',
    transcribing: 'Recognizing speech…', voiceEmpty: 'No sound was captured. Check the microphone and try again.',
    voiceNoText: 'The recording was sent, but the speech was not recognized, so it has no translation.', audioUnsupported: 'This browser cannot play the recording.', audioTooBig: 'The recording is too large; only the recognized text was sent.',
    emptyTitle: 'Quiet in here',
    emptyText: 'Write the first message, in your own language.',
    send: 'Send', placeholder: 'Write a message in your language…',
    translating: 'Translating…', showOrig: 'Show original', hideOrig: 'Hide original',
    needPack: 'Try translating again', noTr: 'Translation did not work right now. Showing the original.',
    voice: 'Voice message', noTranscript: 'The speech was not recognized, so there is no translation.',
    report: 'Report', block: 'Block', del: 'Delete',
    reported: 'Report saved. Thank you.', blocked: 'User blocked. You will no longer see their messages.',
    micDenied: 'No microphone access. You can keep typing.',
    micStart: 'Record a voice message', micStop: 'Stop and send',
    switchUser: 'Change name or language', online: 'Online',
    storageFull: 'Local storage is full. Old messages were removed.',
    r_general: 'Lobby', d_general: 'Open talk with everyone here',
    r_tech: 'Technology', d_tech: 'Tools, ideas and technical questions',
    r_cultures: 'Cultures', d_cultures: 'Customs, food, music and holidays around the world',
    r_collab: 'Collaborations', d_collab: 'Find partners for a project or an idea',
    r_langs: 'Language learning', d_langs: 'Practice a new language through conversation',
    d_dm: 'Private chat'
  }
};
let uiLang = 'he';
const t = key => (UI[uiLang] || UI.en)[key] ?? UI.en[key] ?? key;
function setUiLang(code) {
  uiLang = UI[code] ? code : 'en';
  const l = langOf(code);
  document.documentElement.lang = uiLang;
  document.documentElement.dir = (uiLang === 'he' || l.rtl) ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
}
