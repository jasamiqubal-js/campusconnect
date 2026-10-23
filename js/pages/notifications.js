/* pages/notifications.js: in-app notification centre */
let nfFilter = 'all';

Router.add('notifications', {
  title: 'Notifications',
  render(view) {
    const list = NOTIFS.filter(n => nfFilter === 'all' || !n.read);
    view.innerHTML = `${pageHead('Notifications', `${App.unread()} unread`, '<button class="btn btn-light border" onclick="markAllRead()"><i class="fa-solid fa-check-double me-1"></i>Mark all as read</button>')}
    <div class="cc-pills">
      <button class="${nfFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="${nfFilter === 'unread' ? 'active' : ''}" data-filter="unread">Unread</button>
    </div>
    ${list.length ? list.map(n => `<div class="notif ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" role="button" tabindex="0"
        aria-label="${esc(n.text)}${n.read ? '' : ' (unread)'}">
      <span class="g-tile" style="background:${esc(n.color)}"><i class="fa-solid fa-${esc(n.icon)}"></i></span>
      <div class="flex-grow-1 min-w-0"><div>${esc(n.text)}</div><small class="muted">${esc(n.time)}</small></div>${n.read ? '' : '<span class="dot" title="Unread"></span>'}</div>`).join('')
      : emptyState('bell-slash', 'You are all caught up', 'New activity on your posts, questions and groups will appear here.')}`;
  }
});

function markRead(id) {
  const n = NOTIFS.find(x => x.id === id);
  if (n && !n.read) { n.read = true; DB.markNotifRead(n.id); updateBadges(); Router.render(); }
}
// Opens the post a notification is about: goes to its page, scrolls to it and highlights it
function openNotif(id) {
  const n = NOTIFS.find(x => x.id === id);
  if (!n) return;
  markRead(id);
  if (n.icon === 'bullhorn') { if (location.hash !== '#/notices') location.hash = '#/notices'; return; } // notice notification: open the Notice Board
  if (!n.postId) return; // old notifications have no post attached
  const p = POSTS.find(x => x.id === n.postId);
  if (!p) return toast('This post is no longer available.', 'info');

  const target = n.groupId ? `#/groups/${n.groupId}` : '#/home';
  if (location.hash !== target) location.hash = target;
  setTimeout(() => {
    if (n.icon === 'comment' && !p.open) { p.open = true; redrawPost(p.id); }
    const el = document.querySelector(`[data-post="${p.id}"]`);
    if (!el) return toast('Could not find the post on this page.', 'info');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 2000);
  }, 300);
}

function markAllRead() {
  NOTIFS.forEach(n => n.read = true); DB.markAllNotifsRead(NOTIFS.map(n => n.id));
  updateBadges(); Router.render(); toast('All notifications marked as read.');
}

// One delegated handler for the filter pills and notification items (no inline onclick with data)
document.addEventListener('click', e => {
  const pill = e.target.closest('#view [data-filter]');
  if (pill) { nfFilter = pill.dataset.filter; Router.render(); return; }
  const item = e.target.closest('#view [data-notif-id]');
  if (item) openNotif(Number(item.dataset.notifId));
});

// Keyboard: Enter or Space activates a notification item, like a real button
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const item = e.target.closest && e.target.closest('#view [data-notif-id]');
  if (!item) return;
  e.preventDefault(); // stops Space from scrolling the page
  openNotif(Number(item.dataset.notifId));
});
