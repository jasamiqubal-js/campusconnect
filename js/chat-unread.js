/* chat-unread.js: counts unread MESSAGES (not chats) and shows the total as a red number on Messages */
const UNREAD = new Map(); // chatId -> number of unread messages for me
let unreadUnsub = null;

// Live: my unread counters
function listenUnread() {
  const me = Auth.user;
  unreadUnsub = fdb.collection('users').doc(me.uid).collection('unreadChats').onSnapshot(snap => {
    UNREAD.clear();
    snap.docs.forEach(d => { const n = d.data().count || 0; if (n > 0) UNREAD.set(d.id, n); });
    updateChatBadge();
  });
}

// Sender adds 1 to the recipient's counter
DB.bumpUnread = function (uid, cid) {
  return this.save(fdb.collection('users').doc(String(uid)).collection('unreadChats').doc(cid)
    .set({ count: firebase.firestore.FieldValue.increment(1) }, { merge: true }));
};

// Opening a chat resets my counter for it
DB.clearUnread = function (cid) {
  if (!UNREAD.get(cid)) return;
  UNREAD.delete(cid);
  return this.save(fdb.collection('users').doc(Auth.user.uid).collection('unreadChats').doc(cid)
    .set({ count: 0 }, { merge: true }));
};

// Red number = total unread messages (1 message -> 1, 2 messages -> 2)
function updateChatBadge() {
  let n = 0;
  UNREAD.forEach(v => { n += v; });
  $$('[data-chat-badge]').forEach(b => { b.textContent = n; b.hidden = !n; });
  const base = document.title.replace(/^\(\d+\) /, '');
  document.title = n ? `(${n}) ${base}` : base;
}

// Clear the counter when the chat is opened (full page or popup)
const _markSeenOrig = markSeen;
markSeen = function (chat) { _markSeenOrig(chat); if (chat) DB.clearUnread(chat.id); };
const _markSeenByIdOrig = markSeenById;
markSeenById = function (id) { _markSeenByIdOrig(id); DB.clearUnread(chatIdFor(Auth.user.uid, id)); };
