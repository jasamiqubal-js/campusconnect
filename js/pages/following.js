/* pages/following.js: posts from the people you follow, plus suggestions to follow more people */
function followBtn(u) {
  if (String(u.id) === String(App.me().id)) return '';
  const on = FOLLOWING.has(String(u.id));
  return `<button class="btn ${on ? 'btn-outline-secondary' : 'btn-primary'} btn-sm" onclick="${on ? 'unfollowUser' : 'followUser'}('${encodeURIComponent(String(u.id))}')">${on ? '<i class="fa-solid fa-user-check me-1"></i>Following' : '<i class="fa-solid fa-user-plus me-1"></i>Follow'}</button>`;
}

function followUser(uid) {
  const u = userById(decodeURIComponent(uid));
  DB.follow(decodeURIComponent(uid));
  if (u) toast(`You are now following ${u.name}.`);
  Router.render();
}

function unfollowUser(uid) {
  DB.unfollow(decodeURIComponent(uid));
  toast('Unfollowed.', 'info');
  Router.render();
}

// Shows how many followers and following a user has (loaded after the page is drawn)
function loadFollowCounts(u) {
  setTimeout(() => {
    fdb.collection('users').doc(String(u.id)).collection('followers').get()
      .then(s => { const el = document.getElementById('fers'); if (el) el.textContent = s.size; });
    fdb.collection('users').doc(String(u.id)).collection('following').get()
      .then(s => { const el = document.getElementById('fing'); if (el) el.textContent = s.size; });
  }, 0);
  return '';
}

Router.add('following', {
  title: 'Following',
  render(view) {
    const mine = POSTS.filter(p => FOLLOWING.has(String(p.uid)));
    const suggest = USERS.filter(u => typeof u.id === 'string' && String(u.id) !== String(App.me().id) && !FOLLOWING.has(String(u.id)));
    view.innerHTML = `${pageHead('Following', `${FOLLOWING.size} people you follow`)}
      <h6 class="mb-2"><i class="fa-solid fa-user-group me-1"></i>Posts from people you follow</h6>
      ${mine.length ? mine.map(postCard).join('') : emptyState('user-group', 'Nothing here yet', 'Follow someone below, and their posts will appear here.')}
      <h6 class="mb-2 mt-4"><i class="fa-solid fa-user-plus me-1"></i>Suggested people</h6>
      <section class="cc-card">${suggest.length ? suggest.slice(0, 12).map(u => `
        <div class="d-flex align-items-center gap-3 py-2 border-bottom">
          ${avatar(u, 40)}
          <div class="flex-grow-1 min-w-0"><a href="#/user/${encodeURIComponent(String(u.id))}" class="user-link">${esc(u.name)}</a>
            <div class="muted small text-truncate">${esc(userMeta(u))}</div></div>
          ${followBtn(u)}
        </div>`).join('') : '<p class="muted mb-0">You are following everyone here.</p>'}</section>`;
  }
});
