/* pages/messages.js: private one-to-one messages.
   Chat id = both user ids sorted and joined with "_", so the same two people always share one chat.
   chats/{chatId}: members, lastText, lastFrom, lastAt (used for the chat list and unread dots)
   chats/{chatId}/messages: the messages themselves. Access rules: see README. */
let chatUnsub = null;     // live listener for the open chat
let chatsUnsub = null;    // live listener for my chat list
let myChats = [];         // chats I am in, newest first

const chatIdFor = (a, b) => [String(a), String(b)].sort().join('_');
const otherIdOf = (chat, myId) => (chat.members || []).find(m => String(m) !== String(myId));
const toMs = ts => (ts && ts.toMillis ? ts.toMillis() : Date.now());
const myUid = () => Auth.user.uid;

// "Seen" state is kept in this browser: chatId -> time of the last message the user has seen
const SEEN_KEY = 'cc_chat_seen';
function seenMap() { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) { return {}; } }
function markSeen(chat) {
  if (!chat) return;
  const map = seenMap();
  map[chat.id] = chat.lastMs;
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(map)); } catch (e) { /* storage full or blocked: badge may stay */ }
}
const isUnread = c => !!c.lastFrom && String(c.lastFrom) !== String(myUid()) && c.lastMs > (seenMap()[c.id] || 0);

function stopChat() {
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
}
// Stop the live chat listener when the user leaves the open chat
addEventListener('hashchange', () => { if (!location.hash.startsWith('#/messages/')) stopChat(); });

// Nav badge: how many chats have a new message from the other person
function updateChatBadge() {
  const n = myChats.filter(isUnread).length;
  $$('[data-chat-badge]').forEach(b => { b.textContent = n; b.hidden = !n; });
  // Unread count in the browser tab title, e.g. "(2) Messages • CampusConnect"
  const base = document.title.replace(/^\(\d+\) /, '');
  document.title = n ? `(${n}) ${base}` : base;
}

// Called once at startup: keeps the chat list live, shows a toast for new messages
function listenChats() {
  const me = Auth.user;
  let first = true;
  chatsUnsub = fdb.collection('chats').where('members', 'array-contains', me.uid).onSnapshot(snap => {
    myChats = snap.docs.map(d => {
      const x = d.data();
      return { id: d.id, members: x.members || [], lastText: x.lastText || '', lastFrom: x.lastFrom || null, lastMs: toMs(x.lastAt) };
    }).sort((a, b) => b.lastMs - a.lastMs);

    if (!first) {
      snap.docChanges().forEach(ch => {
        const c = myChats.find(x => x.id === ch.doc.id);
        if (!c || ch.type === 'removed' || String(c.lastFrom) === String(me.uid)) return;
        notifyIncoming(c);
      });
    }
    first = false;
    updateChatBadge();
    if (Router.current.key === 'messages' && !Router.current.param) Router.render(); // refresh the chat list
  }, err => {
    console.error('Chat list error:', err);
    toast('Live message alerts stopped: ' + (err.message || err.code) + '. Check the Firestore rules.', 'error');
  });
}

// Sends one message: updates the chat summary, then saves the message itself
DB.sendChat = async function (to, text, att) {
  const me = Auth.user, cid = chatIdFor(me.uid, to), ref = fdb.collection('chats').doc(cid);
  try {
    await ref.set({
      members: [me.uid, String(to)].sort(), lastText: (text || (att && att.image ? '📷 Photo' : att ? '📎 ' + att.fileName : '')).slice(0, 120), lastFrom: me.uid, lastAt: this.serverTs()
    }, { merge: true });
    await ref.collection('messages').add({ uid: me.uid, to: String(to), text: text || '', ...(att && att.image ? { image: att.image } : {}), ...(att && att.file ? { file: att.file, fileName: att.fileName } : {}), createdAt: this.serverTs() });
    DB.bumpUnread(String(to), cid);
  } catch (err) {
    console.error(err);
    toast('Could not send: ' + (err.message || err.code), 'error');
  }
};

Router.add('messages', {
  title: 'Messages',
  onSearch() { Router.render(); },
  render(view, param) {
    stopChat();
    if (param) return renderChat(view, param);
    renderInbox(view);
  }
});

// Left side of the page: my recent chats first, then every other user
function renderInbox(view) {
  const me = App.me(), q = App.query.toLowerCase();
  const match = name => !q || name.toLowerCase().includes(q);

  const convs = myChats
    .map(c => ({ c, other: userById(otherIdOf(c, me.id)) }))
    .filter(x => x.other.name !== 'Unknown user' && match(x.other.name));

  const people = USERS.filter(u => u.id !== me.id && u.status !== 'Suspended' && match(u.name));

  const convRow = ({ c, other }) => {
    const unread = isUnread(c), mine = String(c.lastFrom) === String(me.id);
    const when = c.lastAt && c.lastAt.toDate ? c.lastAt.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return `<a class="inbox-row ${unread ? 'unread' : ''}" href="#/messages/${encodeURIComponent(String(other.id))}">
      <div class="inbox-av">${avatar(other, 48)}${unread ? '<span class="inbox-dot"></span>' : ''}</div>
      <div class="min-w-0 flex-grow-1">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span class="inbox-name text-truncate">${esc(other.name)}</span><small class="muted text-nowrap">${esc(when)}</small>
        </div>
        <div class="inbox-last text-truncate">${mine ? 'You: ' : ''}${esc(c.lastText)}</div>
      </div></a>`;
  };

  const personRow = u => `<a class="cc-card d-flex align-items-center gap-3 text-decoration-none text-dark" href="#/messages/${encodeURIComponent(String(u.id))}">
      ${avatar(u, 44)}<div class="min-w-0 flex-grow-1"><b>${esc(u.name)}</b><div class="muted small">${esc(userMeta(u))}</div></div>
      <i class="fa-solid fa-chevron-right muted"></i></a>`;

  view.innerHTML = `<div class="msg-inbox">${pageHead('Messages', 'Chat privately with other students and teachers.')}
    ${notifBanner()}
    ${convs.length ? `<h6 class="mb-2"><i class="fa-regular fa-comments me-1"></i>Recent chats</h6>${convs.map(convRow).join('')}` : ''}
    <h6 class="mb-2 ${convs.length ? 'mt-4' : ''}"><i class="fa-solid fa-users me-1"></i>All users</h6>
    ${people.length ? people.map(personRow).join('')
      : emptyState('comments', 'No users found', 'Try another name.')}</div>`;
}

function renderChat(view, otherId) {
  const me = App.me(), other = userById(otherId);
  if (!other || other.name === 'Unknown user') return view.innerHTML = emptyState('comments', 'User not found', 'This person is not available.');
  view.innerHTML = `${pageHead(other.name, userMeta(other), '<a class="btn btn-light border" href="#/messages"><i class="fa-solid fa-arrow-left me-1"></i>All messages</a>')}
    <div class="cc-card p-0 overflow-hidden">
      <div id="chatBox" class="chat-box" aria-live="polite"><div class="muted small text-center p-4">Loading messages…</div></div>
      <div class="chat-compose">${attachBtnHTML()}
        <input id="chatInput" class="form-control" maxlength="1000" placeholder="Type a message…" aria-label="Message" onkeydown="if(event.key==='Enter')sendChat()">
        <button class="btn btn-primary" onclick="sendChat()" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>`;

  // Opening the chat counts as reading it
  const cid = chatIdFor(me.id, otherId);
  const summary = myChats.find(c => c.id === cid);
  if (summary) markSeen(summary);
  updateChatBadge();

  chatUnsub = fdb.collection('chats').doc(cid).collection('messages').orderBy('createdAt', 'asc').limitToLast(100)
    .onSnapshot(snap => {
      // Ignore updates that arrive after the user has moved to another page or chat
      if (Router.current.key !== 'messages' || String(Router.current.param) !== String(otherId)) return;
      drawChat(snap.docs.map(d => d.data()), me.id);
    }, err => toast('Could not load messages: ' + (err.message || err.code), 'error'));
}

function drawChat(msgs, myId) {
  const box = $('#chatBox');
  if (!box) return;
  const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = msgs.length ? msgs.map(m => {
    const mine = String(m.uid) === String(myId);
    const time = m.createdAt && m.createdAt.toDate ? DB.fmt(m.createdAt) : 'Sending…';
    return `<div class="chat-row ${mine ? 'mine' : ''}"><div class="chat-bubble">${attachHTML(m)}${m.text ? nl2br(m.text) : ''}</div><div class="chat-time">${esc(time)}</div></div>`;
  }).join('') : '<div class="muted small text-center p-4">No messages yet. Say hello!</div>';
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

function sendChat() {
  const inp = $('#chatInput');
  const text = (inp?.value || '').trim();
  if (!text && !PENDING_ATTACH) return;
  if (text.length > 1000) return toast('Message is too long (maximum 1000 characters).', 'error');
  const to = Router.current.param;
  if (!to) return;
  inp.value = '';
  const att = PENDING_ATTACH; PENDING_ATTACH = null;
  DB.sendChat(to, text, att);
}
