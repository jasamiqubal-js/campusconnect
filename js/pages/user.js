/* pages/user.js: another person's profile, with their posts, comments and shared resources */
Router.add('user', {
  title: 'Profile',
  render(view, param) {
    const u = USERS.find(x => String(x.id) === String(param));
    if (!u) { view.innerHTML = emptyState('user-slash', 'User not found', 'This profile does not exist.'); return; }
    const own = String(u.id) === String(App.me().id);

    const posts = POSTS.filter(p => String(p.uid) === String(u.id));
    const comments = [];
    POSTS.forEach(p => p.comments.forEach(c => { if (String(c.uid) === String(u.id)) comments.push({ p, c }); }));
    const res = RESOURCES.filter(r => String(r.uid) === String(u.id));
    const reacted = POSTS.filter(p => p.reactors && p.reactors[String(u.id)]);
    const tags = list => (list || []).map(t => `<span class="tagx">${esc(t)}</span>`).join('');

    view.innerHTML = `
    <section class="cc-card p-0 overflow-hidden mb-3">
      <img src="${esc(u.cover || DEFAULT_COVER)}" alt="" class="w-100" id="coverImg" style="height:180px;object-fit:cover">${loadCover(u)}
      <div class="p-3 p-md-4">
        <div class="d-flex flex-wrap align-items-end gap-3 mb-3" style="margin-top:-70px">
          <div style="border:4px solid #fff;border-radius:50%;line-height:0">${avatar(u, 100)}</div>
          <div class="flex-grow-1 min-w-0 pb-1">
            <h4 class="mb-0">${userName(u)}</h4>
            <div class="muted small">${esc(userMeta(u))}</div>
          </div>
          ${own ? '<a class="btn btn-outline-primary btn-sm" href="#/profile"><i class="fa-solid fa-pen me-1"></i>Edit profile</a>'
            : `<a class="btn btn-primary btn-sm" href="#/messages/${encodeURIComponent(String(u.id))}"><i class="fa-solid fa-comments me-1"></i>Message</a> ${followBtn(u)}`}
        </div>
        ${u.bio ? `<p class="mb-2">${esc(u.bio)}</p>` : ''}
        ${(u.skills || []).length ? `<div class="mb-2"><small class="muted d-block mb-1">Skills</small>${tags(u.skills)}</div>` : ''}
        ${(u.interests || []).length ? `<div class="mb-2"><small class="muted d-block mb-1">Interests</small>${tags(u.interests)}</div>` : ''}
        <div class="d-flex gap-4 mt-3 small">
          <span><b>${posts.length}</b> posts</span>
          <span><b>${comments.length}</b> comments</span>
          <span><b id="fers">–</b> followers</span>
          <span><b id="fing">–</b> following</span>
          <span><b>${reacted.length}</b> reactions</span>${loadFollowCounts(u)}
          <span><b>${res.length}</b> shared resources</span>
        </div>
      </div>
    </section>

    <h6 class="mb-2 mt-4"><i class="fa-solid fa-pen-nib me-1"></i>Posts</h6>
    ${posts.length ? posts.map(postCard).join('') : emptyState('pen', 'No posts yet', 'Posts will show here.')}

    <h6 class="mb-2 mt-4"><i class="fa-regular fa-comment me-1"></i>Comments</h6>
    ${comments.length ? `<section class="cc-card">${comments.map(({ p, c }) => `
      <div class="py-2 border-bottom">
        <div class="small text-truncate"><span class="muted">On:</span> ${esc(p.text.slice(0, 80))}</div>
        <div>${esc(c.text)}</div>
        <small class="muted">${esc(c.time)} · <a href="${p.groupId ? '#/groups/' + p.groupId : '#/home'}">Open post</a></small>
      </div>`).join('')}</section>` : emptyState('comment', 'No comments yet', 'Comments will show here.')}

    <h6 class="mb-2 mt-4"><i class="fa-regular fa-face-smile me-1"></i>Reactions</h6>
    ${reacted.length ? `<section class="cc-card">${reacted.map(p => {
      const r = REACTIONS[p.reactors[String(u.id)]];
      const author = userById(p.uid);
      return `<div class="py-2 border-bottom d-flex gap-2 align-items-start">
        <span style="font-size:20px;line-height:1">${r.emoji}</span>
        <div class="min-w-0"><div class="small">${esc(r.label)} on <b>${esc(author ? author.name : 'someone')}</b>'s post</div>
          <div class="text-truncate muted small">${esc(p.text.slice(0, 90))}</div>
          <a class="small" href="${p.groupId ? '#/groups/' + p.groupId : '#/home'}">Open post</a></div></div>`;
    }).join('')}</section>` : emptyState('face-smile', 'No reactions yet', 'Reactions will show here.')}

    <h6 class="mb-2 mt-4"><i class="fa-solid fa-book-open me-1"></i>Shared resources</h6>
    ${res.length ? res.map(r => `
      <div class="cc-card d-flex align-items-center gap-3">
        <div class="flex-grow-1 min-w-0"><b>${esc(r.title)}</b>
          <div class="muted small">${esc(r.subject)} • ${esc(r.type)} • ${esc(r.size)}</div></div>
        <button class="btn btn-outline-primary btn-sm" onclick="downloadRes(${r.id})"><i class="fa-solid fa-download me-1"></i>Open</button>
      </div>`).join('') : emptyState('book-open', 'No resources yet', 'Shared notes will show here.')}`;
  }
});


// Loads a profile's cover photo only when that profile is opened
function loadCover(u) {
  if (u.cover || String(u.id) === String(App.me().id)) return '';
  setTimeout(() => {
    fdb.collection('users').doc(String(u.id)).get().then(d => {
      const c = d.data() && d.data().cover;
      if (!c) return;
      u.cover = c;
      const img = document.getElementById('coverImg');
      if (img) img.src = c;
    });
  }, 0);
  return '';
}
