/* chat-popup.js: Messenger-style chat windows at the bottom right, plus real-time alerts for new messages.
   Uses myChats, markSeen, chatIdFor and updateChatBadge from pages/messages.js. */
const POPUP_MAX = 3;
const popups = new Map(); // otherUserId -> { el, unsub, minimized }

function chatDock() {
  let d = document.getElementById('chatDock');
  if (!d) {
    d = document.createElement('div');
    d.id = 'chatDock';
    d.className = 'chat-dock';
    document.body.appendChild(d);
  }
  return d;
}

// Draws chat bubbles in a box and keeps it scrolled to the newest message
function renderBubbles(box, msgs, myId) {
  const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = msgs.length ? msgs.map(m => {
    const mine = String(m.uid) === String(myId);
    const time = m.createdAt && m.createdAt.toDate ? DB.fmt(m.createdAt) : 'Sending…';
    return `<div class="chat-row ${mine ? 'mine' : ''}"><div class="chat-bubble">${attachHTML(m)}${m.text ? nl2br(m.text) : ''}</div><div class="chat-time">${esc(time)}</div></div>`;
  }).join('') : '<div class="muted small text-center m-auto">No messages yet. Say hello!</div>';
  if (wasAtBottom || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = '1'; }
}

function markSeenById(id) {
  const c = myChats.find(x => x.id === chatIdFor(App.me().id, id));
  if (c) markSeen(c);
}

function setMinimized(id, min) {
  const p = popups.get(id);
  if (!p) return;
  p.minimized = min;
  p.el.classList.toggle('min', min);
  if (!min) {
    const box = p.el.querySelector('.cw-box');
    if (box) box.scrollTop = box.scrollHeight;
    markSeenById(id);
    updateChatBadge();
  }
}

function closePopup(id) {
  const p = popups.get(id);
  if (!p) return;
  if (p.unsub) p.unsub();
  p.el.remove();
  popups.delete(id);
}

function openChatPopup(otherId, { expand = true } = {}) {
  const me = App.me(), id = String(otherId);
  if (id === String(me.id)) return;
  const other = userById(id);
  if (other.name === 'Unknown user') return;
  // Already reading this chat on the full Messages page
  if (Router.current.key === 'messages' && String(Router.current.param) === id) return;

  let p = popups.get(id);
  if (!p) {
    if (popups.size >= POPUP_MAX) closePopup(popups.keys().next().value); // drop the oldest window

    const el = document.createElement('div');
    el.className = 'chat-win';
    el.innerHTML = `<div class="cw-head" role="button" tabindex="0" aria-label="Toggle chat">
        ${avatar(other, 28)}<span class="cw-name">${esc(other.name)}</span>
        <button class="cw-btn" data-act="close" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="cw-body">
        <div class="cw-box"><div class="muted small text-center m-auto">Loading…</div></div>
        <form class="cw-compose" novalidate>${attachBtnHTML()}
          <input class="form-control form-control-sm" maxlength="1000" placeholder="Type a message…" aria-label="Message">
          <button class="btn btn-primary btn-sm" type="submit" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>`;
    chatDock().appendChild(el);
    p = { el, unsub: null, minimized: false };
    popups.set(id, p);

    el.querySelector('.cw-head').addEventListener('click', e => {
      if (e.target.closest('[data-act="close"]')) return closePopup(id);
      setMinimized(id, !p.minimized);
    });
    el.querySelector('.cw-compose').addEventListener('submit', e => {
      e.preventDefault();
      const inp = el.querySelector('input');
      const text = inp.value.trim();
      if (!text && !PENDING_ATTACH) return;
      if (text.length > 1000) return toast('Message is too long (maximum 1000 characters).', 'error');
      inp.value = '';
      const att = PENDING_ATTACH; PENDING_ATTACH = null;
      DB.sendChat(id, text, att);
    });
    el.querySelector('input').addEventListener('focus', () => setMinimized(id, false));

    const cid = chatIdFor(me.id, id);
    p.unsub = fdb.collection('chats').doc(cid).collection('messages')
      .orderBy('createdAt', 'asc').limitToLast(50)
      .onSnapshot(snap => {
        if (!popups.has(id)) return;
        renderBubbles(el.querySelector('.cw-box'), snap.docs.map(d => d.data()), me.id);
        if (!p.minimized) { markSeenById(id); updateChatBadge(); }
      }, err => console.error('Chat window error:', err));
  }
  if (expand) setMinimized(id, false);
  return p;
}

// Called for every new message from someone else
function notifyIncoming(c) {
  const senderId = String(c.lastFrom);
  const viewingPage = Router.current.key === 'messages' && String(Router.current.param) === senderId;
  if (viewingPage) { markSeen(c); return; }
  const sender = userById(senderId);
  playPing();
  openChatPopup(senderId, { expand: true });
  toast(`${sender.name}: ${c.lastText}`, 'info');
  if (document.hidden || !document.hasFocus()) desktopAlert(sender.name, c.lastText, senderId);
}

// Browser notification (shows even when the tab is in the background)
function desktopAlert(title, body, senderId) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon: 'icons/icon-192.png', tag: 'cc-chat-' + senderId });
  n.onclick = () => { window.focus(); location.hash = '#/messages/' + encodeURIComponent(senderId); n.close(); };
}

function requestNotifPermission() {
  if (!('Notification' in window)) return toast('This browser does not support notifications.', 'error');
  Notification.requestPermission().then(() => Router.render());
}

function notifBanner() {
  if (!('Notification' in window)) return '';
  if (Notification.permission === 'denied') {
    return `<div class="alert alert-warning py-2 small"><i class="fa-solid fa-bell-slash me-1"></i>Browser notifications are blocked. Allow them in the site settings (lock icon in the address bar) to get alerts when the tab is in the background.</div>`;
  }
  if (Notification.permission !== 'default') return '';
  return `<div class="alert alert-info d-flex align-items-center justify-content-between gap-2 py-2">
    <span class="small"><i class="fa-solid fa-bell me-1"></i>Get alerts for new messages even when this tab is in the background.</span>
    <button class="btn btn-sm btn-primary" onclick="requestNotifPermission()">Turn on</button></div>`;
}

// Short two-tone beep. Browsers may block sound until the user has clicked on the page once.
let audioCtx = null;
function playPing() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.setValueAtTime(1175, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.36);
  } catch (e) { /* no audio support */ }
}
