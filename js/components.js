/* =====================================================================
   components.js: shared helpers + reusable UI components
   (header, sidebars, bottom nav, modal, toast, post card, composer)
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const val = id => ($('#' + id)?.value || '').trim();
let _nid = 1000; const newId = () => ++_nid;
// Real posts need ids that never clash between users
const newPostId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
const userById = id => USERS.find(u => u.id === id) || { name: 'Unknown user', role: 'student', dept: '', sem: 0 };
const groupById = id => GROUPS.find(g => g.id === id);
const fmtN = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
const ordinal = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

/* ---------- App state (demo role preview) ---------- */
const App = {
  query: '',
  get role() { if (Auth.user) { const u = USERS.find(x => x.id === Auth.user.uid); return u ? u.role : 'student'; } try { return sessionStorage.getItem('cc_role') || 'student'; } catch (e) { return 'student'; } },
  set role(r) { try { sessionStorage.setItem('cc_role', r); } catch (e) { } },
  me() {
    // Signed in but profile not loaded yet: show the real account name, never a demo user
    if (Auth.user) return USERS.find(u => u.id === Auth.user.uid) || { id: Auth.user.uid, name: Auth.user.displayName || 'Loading…', role: 'student', dept: '', sem: 0, status: 'Active', avatar: null };
    return userById({ student: 1, teacher: 7, admin: 8 }[this.role]);
  },
  isStaff() { return this.role === 'teacher' || this.role === 'admin'; },
  unread() { return NOTIFS.filter(n => !n.read).length; }
};

/* ---------- Small UI pieces ---------- */
const AV_COLORS = ['#2563EB', '#16A34A', '#9333EA', '#D97706', '#DC2626', '#0D9488', '#DB2777'];
function avatar(who, size = 40) {
  const user = typeof who === 'object' && who ? who : null;
  const name = user ? user.name : who;
  if (user && user.avatar) return `<img class="avatar" src="${user.avatar}" alt="" style="width:${size}px;height:${size}px;object-fit:cover">`;
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length;
  const ini = name.replace(/^(Md\.|Mr\.|Ms\.)\s*/, '').split(' ').map(w => w[0]).slice(0, 2).join('');
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${AV_COLORS[i]};font-size:${Math.round(size * .38)}px">${esc(ini)}</span>`;
}
const userMeta = u => u.role === 'teacher' ? `${u.title} • ${u.dept}` : u.role === 'admin' ? 'Administrator' : `${u.dept} • ${ordinal(u.sem)} Sem`;
const DEPT_COLORS = { CST: '#2563EB', EEE: '#D97706', Civil: '#0D9488', Mechanical: '#DC2626', Electronics: '#9333EA', Power: '#475569' };
const deptChip = u => { const c = DEPT_COLORS[u.dept] || '#123B70'; return `<span class="dept-chip" style="--dc:${c}">${esc(userMeta(u))}</span>`; };
// Badge by role: admin = blue tick, teacher = black tick (automatic from the role)
const roleBadge = u => u.role === 'admin' ? ' <i class="fa-solid fa-circle-check role-badge admin" title="Admin"></i>'
  : u.role === 'teacher' ? ' <i class="fa-solid fa-circle-check role-badge teacher" title="Teacher"></i>' : '';
const userName = u => `<a class="user-link" href="#/user/${encodeURIComponent(String(u.id))}">${esc(u.name)}</a>` + roleBadge(u) + (u.verified ? ' <i class="fa-solid fa-circle-check verified" title="Verified"></i>' : '');
const SHORT = { 'General Announcement': 'General', 'Class Schedule': 'Schedule' };
const catBadge = (c, short) => `<span class="cat-badge" style="background:${CAT_COLORS[c] || '#475569'}">${esc(short ? (SHORT[c] || c) : c)}</span>`;
const emptyState = (icon, title, text) => `<div class="cc-card empty-state"><i class="fa-solid fa-${icon}"></i><h5>${esc(title)}</h5><p class="mb-0">${esc(text)}</p></div>`;
const pageHead = (title, sub, action = '') => `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div>${action}</div></div>`;

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'cc-toast ' + type;
  t.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'info' ? 'fa-circle-info' : 'fa-circle-check'} me-2"></i>${esc(msg)}`;
  $('#toastWrap').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- One reusable modal for forms + confirmations ---------- */
let _modal;
function openModal({ title, body, okText = 'Save', okClass = 'btn-primary', onOk, hideOk = false }) {
  _modal = _modal || new bootstrap.Modal($('#ccModal'));
  $('#ccModalTitle').textContent = title;
  $('#ccModalBody').innerHTML = body;
  $('#ccModalErr').textContent = '';
  const ok = $('#ccModalOk');
  ok.className = 'btn ' + okClass; ok.textContent = okText; ok.hidden = hideOk;
  ok.onclick = () => { const err = onOk && onOk(); if (err) { $('#ccModalErr').textContent = err; return; } _modal.hide(); };
  _modal.show();
}
const confirmAction = (message, onYes, okText = 'Delete') =>
  openModal({ title: 'Please confirm', body: `<p class="mb-0">${esc(message)}</p>`, okText, okClass: 'btn-danger', onOk() { onYes(); } });

function validateFile(file, exts, maxMB) {
  if (!file) return '';
  const ext = file.name.split('.').pop().toLowerCase();
  if (!exts.includes(ext)) return `Unsupported file type. Allowed: ${exts.join(', ')}.`;
  if (file.size > maxMB * 1024 * 1024) return `File is too large. Maximum size is ${maxMB} MB.`;
  return '';
}

/* ---------- Layout: header, nav, sidebars ---------- */
const NAV = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'following', label: 'Following', icon: 'user-check' },
  { key: 'institute', label: 'Institute Info', icon: 'school' },
  { key: 'profile', label: 'My Profile', icon: 'user' },
  { key: 'groups', label: 'My Groups', icon: 'user-group' },
  { key: 'resources', label: 'Notes & Resources', icon: 'book-open' },
  { key: 'qa', label: 'Q&A', icon: 'circle-question' },
  { key: 'notices', label: 'Notice Board', icon: 'bullhorn' },
  { key: 'events', label: 'Events', icon: 'calendar-days' },
  { key: 'lost', label: 'Lost & Found', icon: 'magnifying-glass-location' },
  { key: 'messages', label: 'Messages', icon: 'comments', chatBadge: true },
  { key: 'notifications', label: 'Notifications', icon: 'bell', badge: true },
  { key: 'admin', label: 'Admin Panel', icon: 'shield-halved', admin: true }
];

function navHTML(mobile) {
  return `<nav class="cc-nav" aria-label="Main navigation">${NAV.filter(n => !n.admin || App.role === 'admin').map(n =>
    `<a href="#/${n.key}" data-key="${n.key}"><i class="fa-solid fa-${n.icon}"></i>${n.label}${n.badge ? '<span class="nav-badge" data-notif-badge></span>' : ''}${n.chatBadge ? '<span class="nav-badge" data-chat-badge hidden></span>' : ''}</a>`).join('')}</nav>`;
}
function quickGroupsHTML() {
  const mine = GROUPS.filter(g => g.joined);
  if (!mine.length) return '<div class="muted small px-3 pb-2">You have not joined any groups yet.</div>';
  return mine.map(g => `<a class="qg" href="#/groups/${g.id}"><span class="g-tile" style="background:${g.color}"><i class="fa-solid fa-${g.icon}"></i></span><span class="min-w-0"><b>${esc(g.name)}</b><small>${fmtN(g.members)} members</small></span></a>`).join('');
}
function headerHTML() {
  const me = App.me(), r = App.role;
  return `<header class="cc-header" id="ccHeader"><div class="cc-header-in">
  <button class="icon-btn d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>
  <a class="cc-logo" href="#/home"><img class="app-logo" src="icons/logo.png" alt="CampusConnect logo" width="40" height="40"><span>Campus<em>Connect</em></span></a>
  <label class="cc-search"><i class="fa-solid fa-magnifying-glass"></i><input id="globalSearch" type="search" aria-label="Search CampusConnect" placeholder="Search posts, notes, groups, questions..." autocomplete="off"></label>
  <div class="cc-actions">
   <a class="icon-btn" href="#/notifications" aria-label="Notifications"><i class="fa-regular fa-bell"></i><span class="cc-badge" data-notif-badge></span></a>
   <div class="dropdown">
    <button class="user-btn" data-bs-toggle="dropdown" aria-label="Profile menu">${avatar(me, 38)}
     <span class="d-none d-md-block text-start"><b>${esc(me.name)}</b><small>${r === 'student' ? 'Student • ' + userMeta(me).replace(' • ', ' ') : esc(userMeta(me))}</small></span><i class="fa-solid fa-chevron-down small d-none d-md-block"></i></button>
    <ul class="dropdown-menu dropdown-menu-end">
     <li><a class="dropdown-item" href="#/profile">My Profile</a></li>
     ${r === 'admin' ? '<li><a class="dropdown-item fw-semibold" href="#/admin"><i class="fa-solid fa-shield-halved me-2"></i>Admin Panel</a></li>' : ''}
     <li><hr class="dropdown-divider"></li><li><button class="dropdown-item" onclick="toggleTheme()"><i class="fa-solid fa-moon me-2"></i>Dark / light mode</button></li><li><button class="dropdown-item" onclick="logout()">Logout</button></li>
    </ul></div></div></div></header>`;
}
function renderShell() {
  App.query = '';
  $('#app').innerHTML = `${headerHTML()}
  <div class="offcanvas offcanvas-start" tabindex="-1" id="mobileMenu" aria-label="Menu">
   <div class="offcanvas-header"><div class="cc-logo"><i class="fa-solid fa-graduation-cap"></i>CampusConnect</div><button class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
   <div class="offcanvas-body bg-light">${navHTML(true)}<div class="side-title mt-3">QUICK GROUPS</div><div class="qg-list">${quickGroupsHTML()}</div></div>
  </div>
  <div class="cc-wrap">
   <aside class="cc-left d-none d-lg-block">${navHTML(false)}
    <div class="cc-card p-2 mt-3 mb-2"><div class="side-title">QUICK GROUPS</div><div class="qg-list">${quickGroupsHTML()}</div><a href="#/groups" class="d-block px-3 py-2 small fw-semibold text-primary">See All Groups <i class="fa-solid fa-arrow-right"></i></a></div>
    <div class="side-foot">Connect • Learn • Grow<br>CampusConnect<br><span class="small">Demo data: resets on refresh</span></div>
   </aside>
   <main id="view" class="cc-main"></main>
   <aside id="rightCol" class="cc-right"></aside>
  </div>
  <nav class="cc-bottom" aria-label="Bottom navigation">
   <a href="#/home" data-key="home"><i class="fa-solid fa-house"></i>Home</a>
   <a href="#/groups" data-key="groups"><i class="fa-solid fa-user-group"></i>Groups</a>
   <a href="#/home" data-key="create" onclick="goCompose(event)"><i class="fa-regular fa-square-plus"></i>Create Post</a>
   <a href="#/messages" data-key="messages"><i class="fa-regular fa-comments"></i>Messages<span class="cc-badge" data-chat-badge hidden></span></a>
   <a href="#/profile" data-key="profile"><i class="fa-regular fa-user"></i>Profile</a>
  </nav>`;
  // Close the mobile menu after any link tap (without blocking navigation)
  $('#mobileMenu').addEventListener('click', e => { if (e.target.closest('a')) bootstrap.Offcanvas.getOrCreateInstance($('#mobileMenu')).hide(); });
  updateBadges();
}
function setActiveNav(k) { $$('.cc-nav a, .cc-bottom a').forEach(a => a.classList.toggle('active', a.dataset.key === k)); }
function updateBadges() { const n = App.unread(); $$('[data-notif-badge]').forEach(b => { b.textContent = n; b.hidden = !n; }); }
function refreshHeader() { const q = $('#globalSearch')?.value || ''; $('#ccHeader').outerHTML = headerHTML(); $('#globalSearch').value = q; updateBadges(); }
function refreshSide() {
  $$('.qg-list').forEach(el => el.innerHTML = quickGroupsHTML());
  if ($('#popGroups')) $('#popGroups').innerHTML = popularGroupsHTML();
}
function setRole(r) { App.role = r; renderShell(); Router.render(); toast(`Previewing as ${r} (demo only)`, 'info'); }
function logout() { Auth.signOut(); }
function goCompose(e) {
  e && e.preventDefault();
  if (Router.current.key !== 'home') location.hash = '#/home';
  setTimeout(() => { const t = $('#postText'); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus(); } }, 80);
}

/* ---------- Right sidebar (Home) ---------- */
function popularGroupsHTML() {
  return [...GROUPS].sort((a, b) => b.members - a.members).slice(0, 4).map(g => `<div class="pg-row">
   <span class="g-tile" style="background:${g.color}"><i class="fa-solid fa-${g.icon}"></i></span>
   <a href="#/groups/${g.id}" class="flex-grow-1 min-w-0"><b class="d-block" style="font-size:13px">${esc(g.name)}</b><small class="muted">${esc(g.kind)} • ${fmtN(g.members)} members</small></a>
   <button class="btn btn-xs ${g.joined ? 'btn-light border' : 'btn-primary'}" onclick="toggleGroup(${g.id})">${g.joined ? 'Joined' : 'Join'}</button></div>`).join('');
}
function renderRight() {
  $('#rightCol').innerHTML = `
  <section class="cc-card"><div class="side-head"><h6><i class="fa-solid fa-bullhorn"></i> Latest Notices</h6><a href="#/notices">View All <i class="fa-solid fa-arrow-right"></i></a></div>
   ${NOTICES.slice(0, 4).map(n => `<a class="notice-row" href="#/notices"><div class="flex-grow-1 min-w-0">${catBadge(n.cat, true)} <small class="muted ms-1">${n.date}</small><div class="notice-title">${esc(n.title)}</div></div><i class="fa-solid fa-chevron-right muted small"></i></a>`).join('')}</section>
  <section class="cc-card"><div class="side-head"><h6><i class="fa-regular fa-calendar-days"></i> Upcoming Events</h6><a href="#/events">View All <i class="fa-solid fa-arrow-right"></i></a></div>
   ${EVENTS.slice(0, 3).map(e => `<a class="ev-row" href="#/events"><div class="date-box">${e.day}<small>${e.mon}</small></div><div class="min-w-0"><div class="fw-semibold">${esc(e.title)}</div><small class="muted d-block"><i class="fa-solid fa-location-dot me-1"></i>${esc(e.location)}</small><small class="muted"><i class="fa-regular fa-clock me-1"></i>${esc(e.time)}</small></div></a>`).join('')}</section>
  <section class="cc-card"><div class="side-head"><h6><i class="fa-solid fa-user-group"></i> Popular Groups</h6><a href="#/groups">View All <i class="fa-solid fa-arrow-right"></i></a></div><div id="popGroups">${popularGroupsHTML()}</div></section>
  <section class="cc-card"><div class="side-head"><h6><i class="fa-solid fa-link"></i> Quick Links</h6></div>
   <div class="ql-grid">
    <a href="#/resources" style="background:#EEF4FF"><i class="fa-solid fa-book-open" style="color:#2563EB"></i>Notes Library</a>
    <a href="#/notices/Examination" style="background:#EEFAF1"><i class="fa-solid fa-file-signature" style="color:#16A34A"></i>Exam Information</a>
    <button style="background:#F5EFFF" onclick="openHelp()"><i class="fa-solid fa-headset" style="color:#9333EA"></i>Help &amp; Support</button>
    <a href="#/profile" style="background:#EAFAF8"><i class="fa-solid fa-user" style="color:#0D9488"></i>My Profile</a>
   </div></section>`;
}
function openHelp() {
  openModal({ title: 'Help & Support', hideOk: true, body: `<p>Need help with CampusConnect?</p><ul><li>Report wrong or inappropriate content using the three-dot menu on any post.</li><li>For account problems, visit the Student Affairs Office (Room 102).</li><li>For technical issues, contact the CampusConnect admin team.</li></ul><p class="muted small mb-0">This is demo text. Real contact details are added when the project is deployed.</p>` });
}

/* ---------- Groups: join / leave ---------- */
function toggleGroup(id) {
  const g = groupById(id);
  const apply = () => {
    g.joined = !g.joined; g.members += g.joined ? 1 : -1; DB.setGroupMembership(g.id, App.me().id, g.joined);
    toast(g.joined ? `You joined ${g.name}` : `You left ${g.name}`);
    refreshSide(); if (Router.current.key === 'groups') Router.render();
  };
  g.joined ? confirmAction(`Leave "${g.name}"?`, apply, 'Leave group') : apply();
}

/* ---------- Posts: card + actions ---------- */
const postById = id => POSTS.find(p => p.id === id);
function canManage(p) {
  const me = App.me(); const g = p.groupId && groupById(p.groupId);
  return p.uid === me.id || App.role === 'admin' || (g && g.ownerUid === me.id);
}
const commentHTMLBase = c => { const u = userById(c.uid); return `<div class="cmt">${avatar(u, 30)}<div class="cmt-body"><b>${userName(u)}</b><div>${nl2br(c.text)}</div></div></div>`; };

function postCard(p) {
  const u = userById(p.uid), me = App.me(), own = p.uid === me.id;
  const shown = p.open ? p.comments : p.comments.slice(-1);
  return `<article class="cc-card post" data-post="${p.id}">
  <div class="d-flex gap-2 align-items-start">${avatar(u, 44)}
   <div class="flex-grow-1 min-w-0"><div class="fw-semibold">${userName(u)} ${deptChip(u)}</div>
    <div class="muted small">${esc(p.time)} · <i class="fa-solid fa-earth-asia"></i></div></div>
   <div class="dropdown"><button class="icon-ghost" data-bs-toggle="dropdown" aria-label="Post options"><i class="fa-solid fa-ellipsis"></i></button>
    <ul class="dropdown-menu dropdown-menu-end">
     ${own ? `<li><button class="dropdown-item" onclick="editPost(${p.id})"><i class="fa-regular fa-pen-to-square me-2"></i>Edit post</button></li>` : ''}
     ${canManage(p) ? `<li><button class="dropdown-item text-danger" onclick="deletePost(${p.id})"><i class="fa-regular fa-trash-can me-2"></i>Delete post</button></li>` : ''}
     ${own ? '' : `<li><button class="dropdown-item" onclick="reportPost(${p.id})"><i class="fa-regular fa-flag me-2"></i>Report post</button></li>`}
    </ul></div></div>
  <p class="post-text">${nl2br(p.text)}</p>
  ${p.image ? `<img class="post-img" src="${p.image}" alt="Photo attached to post">` : ''}
  ${p.file ? `<div class="file-chip"><i class="fa-regular fa-file-lines"></i> ${esc(p.file)}</div>` : ''}
  <div class="post-stats">${reactSummaryHTML(p)}<button class="link-btn" onclick="toggleComments(${p.id})">${p.comments.length} Comments</button></div>
  <div class="post-actions">
   ${reactButtonHTML(p)}
   <button onclick="$('#cm${p.id}').focus()"><i class="fa-regular fa-comment"></i> Comment</button>
   <button onclick="sharePost(${p.id})"><i class="fa-solid fa-share"></i> Share</button></div>
  <div class="comments">${shown.map(commentHTML).join('')}
   ${!p.open && p.comments.length > 1 ? `<button class="link-btn mb-2" onclick="toggleComments(${p.id})">View all ${p.comments.length} comments <i class="fa-solid fa-arrow-right"></i></button>` : ''}
   <div class="d-flex gap-2 align-items-center">${avatar(me, 30)}<input class="form-control form-control-sm" id="cm${p.id}" placeholder="Write a comment..." onkeydown="if(event.key==='Enter')addComment(${p.id})"><button class="btn btn-primary btn-sm" onclick="addComment(${p.id})">Send</button></div></div>
  </article>`;
}
function redrawPost(id) { const el = $(`[data-post="${id}"]`), p = postById(id); if (el && p) el.outerHTML = postCard(p); }
/* ---------- Reactions (Facebook-style: Like, Love, Haha, Wow) ---------- */
const REACTIONS = {
  like: { emoji: '👍', label: 'Like', color: '#2563EB' },
  love: { emoji: '❤️', label: 'Love', color: '#E11D48' },
  haha: { emoji: '😂', label: 'Haha', color: '#D97706' },
  wow:  { emoji: '😮', label: 'Wow',  color: '#7C3AED' }
};
// Older posts stored a single "likes" count; convert them once to the reaction format
function ensureReacts(p) {
  if (!p.reacts) { p.reacts = { like: p.likes || 0 }; p.myReact = p.liked ? 'like' : null; }
}
const reactTotal = p => Object.values(p.reacts).reduce((a, b) => a + b, 0);

function reactSummaryHTML(p) {
  ensureReacts(p);
  const total = reactTotal(p);
  if (!total) return '<span></span>';
  const top = Object.keys(REACTIONS).filter(k => p.reacts[k] > 0).sort((a, b) => p.reacts[b] - p.reacts[a]).slice(0, 3);
  const tip = top.map(k => `${REACTIONS[k].label}: ${p.reacts[k]}`).join(', ');
  return `<span class="react-summary" title="${tip}">${top.map(k => `<span class="react-dot">${REACTIONS[k].emoji}</span>`).join('')}<span class="ms-1">${total}</span></span>`;
}

function reactButtonHTML(p) {
  ensureReacts(p);
  const cur = p.myReact, r = cur ? REACTIONS[cur] : null;
  const label = r ? `<span style="color:${r.color}">${r.emoji} ${r.label}</span>` : '<i class="fa-regular fa-thumbs-up"></i> Like';
  const picker = Object.entries(REACTIONS).map(([k, v]) =>
    `<button type="button" title="${v.label}" aria-label="${v.label}" onclick="reactPost(${p.id},'${k}')">${v.emoji}</button>`).join('');
  return `<div class="react-wrap"><button type="button" class="${cur ? 'on' : ''}" onclick="reactPost(${p.id},'${cur || 'like'}')">${label}</button><div class="react-picker">${picker}</div></div>`;
}

// Same reaction again = remove it; a different one = switch to it
function reactPost(id, type) {
  const p = postById(id); ensureReacts(p);
  if (p.myReact === type) {
    p.reacts[type] = Math.max(0, p.reacts[type] - 1); p.myReact = null;
  } else {
    if (p.myReact) p.reacts[p.myReact] = Math.max(0, p.reacts[p.myReact] - 1);
    p.reacts[type] = (p.reacts[type] || 0) + 1; p.myReact = type;
  }
  if (!p.reactors) p.reactors = {};
  if (p.myReact) p.reactors[App.me().id] = p.myReact; else delete p.reactors[App.me().id];
  DB.setReaction(id, App.me().id, p.myReact);
  if (p.myReact) DB.notifyOwner(p, `${App.me().name} reacted to your post`, 'face-smile', '#E11D48');
  redrawPost(id);
}

// Touch: press and hold the Like button to open the picker (no hover on phones)
let reactPressTimer = null, reactLongPressed = false;
document.addEventListener('pointerdown', e => {
  document.querySelectorAll('.react-wrap.open').forEach(w => { if (!w.contains(e.target)) w.classList.remove('open'); });
  const btn = e.target.closest('.react-wrap > button');
  if (!btn) return;
  reactLongPressed = false;
  reactPressTimer = setTimeout(() => { reactLongPressed = true; btn.parentElement.classList.add('open'); }, 450);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
  document.addEventListener(ev, () => clearTimeout(reactPressTimer)));
// After a long press, the release should only open the picker, not also count as a like
document.addEventListener('click', e => {
  if (reactLongPressed && e.target.closest('.react-wrap > button')) {
    e.stopImmediatePropagation(); e.preventDefault(); reactLongPressed = false;
  }
}, true);
function toggleComments(id) { const p = postById(id); p.open = !p.open; redrawPost(id); }
function addComment(id) {
  const v = val('cm' + id); if (!v) return toast('Write a comment before sending.', 'error');
  const p = postById(id); const cid = String(newPostId()); p.comments.push({ cid, uid: App.me().id, text: v, time: 'Just now' }); p.open = true; DB.addComment(id, App.me().id, v, cid);
  DB.notifyOwner(p, `${App.me().name} commented on your post`, 'comment', '#2563EB'); redrawPost(id);
}
function sharePost(id) {
  const link = location.href.split('#')[0] + '#/home';
  navigator.clipboard?.writeText(link).then(() => toast('Link copied to clipboard.'), () => toast('Could not copy the link.', 'error'));
  if (!navigator.clipboard) toast('Copy is not supported in this browser.', 'error');
}
function editPost(id) {
  const p = postById(id);
  openModal({ title: 'Edit post', body: `<textarea id="editText" class="form-control" rows="5">${esc(p.text)}</textarea>`, okText: 'Save changes',
    onOk() { const v = val('editText'); if (!v) return 'Post text cannot be empty.'; p.text = v; DB.updatePost(id, v); redrawPost(id); toast('Post updated.'); } });
}
function deletePost(id) {
  confirmAction('Delete this post? This cannot be undone.', () => {
    POSTS = POSTS.filter(p => p.id !== id); DB.deletePost(id); $(`[data-post="${id}"]`)?.remove(); toast('Post deleted.');
    const f = $('#feed'); if (f && !f.children.length) f.innerHTML = emptyState('newspaper', 'No posts yet', 'Be the first to share something with the community.');
  });
}
function reportPost(id) {
  openModal({ title: 'Report post', okText: 'Submit report', body: `<label class="form-label">Why are you reporting this post?</label><select id="repReason" class="form-select"><option>Spam or irrelevant</option><option>Inappropriate language</option><option>Misleading information</option><option>Harassment</option><option>Other</option></select>`,
    onOk() { const rep = { id: newPostId(), postId: id, by: App.me().id, reason: val('repReason'), status: 'Open' }; REPORTS.push(rep); DB.saveReport(rep); toast('Report submitted. Moderators will review it.'); } });
}

/* ---------- Post composer (Home + group pages) ---------- */
let _img = null, _file = null;
function composerHTML(gid) {
  const me = App.me(); _img = _file = null;
  return `<section class="cc-card composer"><div class="d-flex gap-2">${avatar(me, 42)}<textarea id="postText" rows="2" class="form-control" placeholder="What would you like to share?"></textarea></div>
  <div id="composerPreview"></div>
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
   <div class="d-flex gap-1"><button class="tool-btn" onclick="$('#photoInput').click()"><i class="fa-regular fa-image text-success me-1"></i>Add Photo</button><button class="tool-btn" onclick="$('#fileInput').click()"><i class="fa-solid fa-paperclip text-primary me-1"></i>Attach File</button></div>
   <button class="btn btn-primary px-4" onclick="publishPost(${gid || 0})"><i class="fa-solid fa-paper-plane me-1"></i> Post</button></div>
  <input type="file" id="photoInput" accept="image/png,image/jpeg,image/webp" hidden><input type="file" id="fileInput" accept=".pdf,.doc,.docx,.ppt,.pptx" hidden></section>`;
}
function bindComposer() {
  $('#photoInput').onchange = e => { const f = e.target.files[0], err = validateFile(f, ['jpg', 'jpeg', 'png', 'webp'], 3); if (err) { toast(err, 'error'); e.target.value = ''; return; } _img = f; drawPreview(); };
  $('#fileInput').onchange = e => { const f = e.target.files[0], err = validateFile(f, ['pdf', 'doc', 'docx', 'ppt', 'pptx'], 5); if (err) { toast(err, 'error'); e.target.value = ''; return; } _file = f; drawPreview(); };
}
function drawPreview() {
  $('#composerPreview').innerHTML = (_img ? `<img class="preview-img" src="${URL.createObjectURL(_img)}" alt="Selected photo preview">` : '') + (_file ? `<div class="file-chip"><i class="fa-regular fa-file-lines"></i> ${esc(_file.name)}</div>` : '');
}
function publishPost(gid) {
  const text = val('postText'); if (!text) return toast('Write something before posting.', 'error');
  const p = { id: newPostId(), uid: App.me().id, time: 'Just now', text, likes: 0, liked: false, comments: [], reacts: { like: 0, love: 0, haha: 0, wow: 0 }, myReact: null, open: false };
  if (gid) p.groupId = gid; const imgFile = _img; if (_img) p.image = URL.createObjectURL(_img); if (_file) p.file = _file.name;
  POSTS.unshift(p); $('#feed .empty-state')?.closest('.cc-card')?.remove();
  $('#feed').insertAdjacentHTML('afterbegin', postCard(p));
  $('#postText').value = ''; _img = _file = null; $('#composerPreview').innerHTML = '';
  toast('Post published.');
  DB.saveNewPost(p, imgFile); // the photo is shrunk first, then the post is saved
  DB.notifyFollowers(p);
}


/* ===== Comment edit and delete (owner edits and deletes; admin can delete any) ===== */
const commentHTML = c => {
  const base = commentHTMLBase(c);
  if (!c.cid) return base;
  const own = String(c.uid) === String(App.me().id), admin = App.role === 'admin';
  if (!own && !admin) return base;
  const acts = `<span class="cmt-acts">${own ? `<button class="link-btn small" data-cedit="${esc(c.cid)}">Edit</button> ` : ''}<button class="link-btn small text-danger" data-cdel="${esc(c.cid)}">Delete</button></span>`;
  const i = base.lastIndexOf('</div>');
  return base.slice(0, i) + acts + base.slice(i);
};

function editCommentModal(pid, cid) {
  const p = postById(pid), c = p && p.comments.find(x => String(x.cid) === String(cid));
  if (!c) return;
  openModal({
    title: 'Edit comment',
    body: `<textarea id="ecText" class="form-control" rows="3">${esc(c.text)}</textarea>`,
    okText: 'Save',
    onOk() {
      const v = val('ecText');
      if (!v) return 'Comment cannot be empty.';
      c.text = v;
      DB.updateComment(pid, cid, v);
      redrawPost(pid);
    }
  });
}

function removeComment(pid, cid) {
  const p = postById(pid);
  if (p) p.comments = p.comments.filter(x => String(x.cid) !== String(cid));
  DB.deleteComment(pid, cid);
  redrawPost(pid);
}

document.addEventListener('click', e => {
  const ed = e.target.closest('[data-cedit]');
  if (ed) { editCommentModal(Number(ed.closest('[data-post]').dataset.post), ed.dataset.cedit); return; }
  const dl = e.target.closest('[data-cdel]');
  if (dl) {
    const pid = Number(dl.closest('[data-post]').dataset.post), cid = dl.dataset.cdel;
    confirmAction('Delete this comment?', () => removeComment(pid, cid));
  }
});


// Dark mode: remembered on this device
function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-bs-theme') !== 'dark';
  document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('cc-theme', dark ? 'dark' : 'light'); } catch (e) {}
  toast(dark ? 'Dark mode on' : 'Light mode on', 'info');
}
