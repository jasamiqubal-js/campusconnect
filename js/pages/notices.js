/* pages/notices.js: Notice Board (only teachers/admins can publish) */
Router.add('notices', {
  title: 'Notice Board',
  onSearch() { Router.render(); },
  render(view, param) {
    const cat = NOTICE_CATS.includes(param) ? param : 'All', q = App.query.toLowerCase();
    const list = NOTICES.filter(n => (cat === 'All' || n.cat === cat) && (!q || (n.title + n.desc).toLowerCase().includes(q)));
    view.innerHTML = `${pageHead('Notice Board', 'Official announcements from teachers and administrators.', App.isStaff() ? '<button class="btn btn-primary" onclick="openNoticeForm()"><i class="fa-solid fa-plus me-1"></i>Publish Notice</button>' : '')}
    <div class="cc-pills">${['All', ...NOTICE_CATS].map(c => `<a class="${c === cat ? 'active' : ''}" href="#/notices/${encodeURIComponent(c)}">${c}</a>`).join('')}</div>
    ${list.length ? list.map(n => { const u = userById(n.uid); return `<div class="cc-card"><div class="d-flex justify-content-between flex-wrap gap-2">${catBadge(n.cat)}<span class="muted small"><i class="fa-regular fa-calendar me-1"></i>${esc(n.date)}</span></div>
      <h5 class="mt-2" style="color:var(--navy)">${esc(n.title)}</h5><p class="mb-2">${nl2br(n.desc)}</p><div class="muted small">Published by ${userName(u)}</div></div>`; }).join('')
      : emptyState('bullhorn', 'No notices found', 'Try another category or search keyword.')}`;
  }
});
function openNoticeForm() {
  if (!App.isStaff()) return toast('Only teachers and administrators can publish notices.', 'error');
  openModal({ title: 'Publish notice', okText: 'Publish', body: `
   <div class="mb-3"><label class="form-label">Category</label><select id="ntCat" class="form-select">${NOTICE_CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
   <div class="mb-3"><label class="form-label">Title</label><input id="ntTitle" class="form-control"></div>
   <div><label class="form-label">Description</label><textarea id="ntDesc" class="form-control" rows="4"></textarea></div>`,
    onOk() {
      if (val('ntTitle').length < 5) return 'Please enter a notice title.'; if (val('ntDesc').length < 10) return 'Please add a description.';
      NOTICES.unshift({ id: newPostId(), cat: val('ntCat'), date: TODAY, uid: App.me().id, title: val('ntTitle'), desc: val('ntDesc') });
      DB.notifyAll('New notice: ' + val('ntTitle'), 'bullhorn', '#DC2626'); // saved in the database for every user
      DB.saveNotice(NOTICES[0]); Router.render(); toast('Notice published.');
    } });
}
