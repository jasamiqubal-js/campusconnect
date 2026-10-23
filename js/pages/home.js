/* pages/home.js: banner, shortcut cards, composer, news feed */
const SHORTCUTS = [
  ['Create Post', 'Share updates with the campus community.', 'pen-to-square', 't-blue', '#/home', 'goCompose(event)'],
  ['Notes & Resources', 'Find and share academic materials.', 'file-lines', 't-green', '#/resources'],
  ['Q&A', 'Ask questions and help other students.', 'circle-question', 't-purple', '#/qa'],
  ['Groups', 'Connect with students in your department or semester.', 'user-group', 't-amber', '#/groups'],
  ['Events', 'Discover campus programs and competitions.', 'calendar-check', 't-red', '#/events'],
  ['Notice Board', 'Read official announcements.', 'bullhorn', 't-teal', '#/notices'],
  ['Lost & Found', 'Report lost items or list found belongings.', 'magnifying-glass-location', 't-slate', '#/lost']
];
const SHORT_TEXT = ['Share updates', 'Find materials', 'Ask & answer', 'Join communities', 'Campus programs', 'Official notices', 'Report items'];

function renderFeed() {
  const q = App.query.toLowerCase();
  const list = POSTS.filter(p => !p.groupId && (!q || (p.text + userById(p.uid).name).toLowerCase().includes(q)));
  $('#feed').innerHTML = list.length ? list.map(postCard).join('')
    : emptyState('newspaper', q ? 'No posts match your search' : 'No posts yet', q ? 'Try a different keyword.' : 'Be the first to share something with the community.');
}

Router.add('home', {
  title: 'Home', right: true,
  render(view) {
    view.innerHTML = `
    <section class="banner">
      <div class="d-flex align-items-center gap-3"><i class="fa-solid fa-graduation-cap fa-3x d-none d-md-block"></i>
       <div><h1>Welcome to ${esc(INSTITUTE.shortName)}</h1><div class="tag">CampusConnect · Learn Together. Grow Together.</div></div></div>
      <div><a class="chip-link" href="#/resources"><i class="fa-solid fa-book-open"></i>Explore Resources</a><a class="chip-link" href="#/groups"><i class="fa-solid fa-users"></i>Join Communities</a><a class="chip-link" href="#/notices"><i class="fa-solid fa-bullhorn"></i>Get Latest Updates</a></div>
    </section>
    ${pulseHTML()}
    <section class="sc-grid">${SHORTCUTS.map((s, i) => `<a class="sc ${s[3]}" href="${s[4]}" ${s[5] ? `onclick="${s[5]}"` : ''} title="${esc(s[1])}"><i class="fa-solid fa-${s[2]}"></i><b>${s[0]}</b><small>${SHORT_TEXT[i]}</small></a>`).join('')}</section>
    ${composerHTML()}<div id="feed" class="feed-masonry"></div>`;
    bindComposer(); renderFeed();
  },
  onSearch() { renderFeed(); }
});


/* ===== Campus Pulse: welcome card, live strip and next event at the top of Home ===== */
const msOf = id => (id > 1e12 ? Math.floor(id / 1000) : 0); // real items carry their creation time in the id

function pulseInner() {
  const now = new Date(), nowMs = now.getTime();
  const h = now.getHours();
  const greet = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
  const first = (App.me().name || 'there').split(' ')[0];
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const newNotices = NOTICES.filter(n => msOf(n.id) >= dayStart).length;
  const online = [...PRESENCE.entries()].filter(([, t]) => nowMs - t < 3 * 60000).length;
  const todayPosts = POSTS.filter(p => msOf(p.id) >= dayStart).length;

  const upcoming = EVENTS.map(e => ({ e, d: new Date(`${e.mon} ${e.day}, ${now.getFullYear()}`) }))
    .filter(x => !isNaN(x.d) && x.d.getTime() >= dayStart)
    .sort((a, b) => a.d - b.d)[0];
  const daysLeft = upcoming ? Math.round((upcoming.d.getTime() - dayStart) / 86400000) : null;

  return `
    <div class="pulse-welcome">
      <div class="min-w-0">
        <div class="pulse-greet">${greet}, ${esc(first)}</div>
        <div class="pulse-date">${esc(date)}</div>
      </div>
      <div class="pulse-clock">${esc(time)}</div>
    </div>
    <div class="pulse-strip">
      <div class="pulse-card" style="animation-delay:.05s"><small><span class="pulse-dot"></span>Online now</small><b>${online}</b></div>
      <div class="pulse-card" style="animation-delay:.12s"><small>Today's posts</small><b>${todayPosts}</b></div>
    </div>
    <div class="pulse-card pulse-schedule" style="animation-delay:.19s">
      <i class="fa-solid fa-calendar-day"></i>
      <div class="flex-grow-1 min-w-0">
        <small>Next event</small>
        <div class="fw-semibold text-truncate">${upcoming ? esc(upcoming.e.title) : 'No upcoming event'}</div>
      </div>
      ${upcoming ? `<div class="pulse-count">${daysLeft === 0 ? 'Today' : daysLeft + ' days left'}</div>` : ''}
    </div>
    <div class="pulse-notice">${newNotices ? `${newNotices} new ${newNotices === 1 ? 'notice' : 'notices'} today` : 'No new notices today'}</div>`;
}

function pulseHTML() {
  return `<section class="pulse" id="pulse">${pulseInner()}</section>`;
}

function updatePulse() {
  const el = document.getElementById('pulse');
  if (el) el.innerHTML = pulseInner();
}

// Refresh every 15 seconds: the clock, online count and countdown stay current
if (!window._pulseTimer) window._pulseTimer = setInterval(updatePulse, 15000);
