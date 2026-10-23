/* pages/lost-found.js: lost/found listings (no private messaging; public, moderated contact info) */
let lfStatus = 'All', lfCat = '';
Router.add('lost', {
  title: 'Lost & Found',
  onSearch() { Router.render(); },
  render(view) {
    const me = App.me(), q = App.query.toLowerCase();
    const visible = LOST.filter(l => l.approved || l.uid === me.id || App.role === 'admin');
    const list = visible.filter(l => (lfStatus === 'All' || l.status === lfStatus) && (!lfCat || l.cat === lfCat) && (!q || (l.title + l.desc + l.location).toLowerCase().includes(q)));
    view.innerHTML = `${pageHead('Lost & Found', 'Report lost items or list belongings you have found.', '<button class="btn btn-primary" onclick="reportItem()"><i class="fa-solid fa-plus me-1"></i>Report an Item</button>')}
    <div class="cc-pills">${['All', 'Lost', 'Found'].map(s => `<button class="${lfStatus === s ? 'active' : ''}" onclick="lfStatus='${s}';Router.render()">${s}</button>`).join('')}
     <select class="form-select form-select-sm w-auto rounded-pill" aria-label="Category" onchange="lfCat=this.value;Router.render()"><option value="">All categories</option>${LOST_CATS.map(c => `<option ${c === lfCat ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    ${list.length ? `<div class="row g-3">${list.map(l => `<div class="col-md-6"><div class="cc-card h-100 mb-0">
      ${l.image ? `<img src="${l.image}" class="post-img mb-2" alt="Photo of ${esc(l.title)}">` : ''}
      <div class="d-flex gap-2 align-items-center mb-1"><span class="cat-badge" style="background:${l.status === 'Lost' ? '#DC2626' : '#16A34A'}">${l.status}</span><span class="tagx m-0">${esc(l.cat)}</span>${l.approved ? '' : '<span class="badge bg-warning text-dark">Pending moderation</span>'}</div>
      <h6 class="mt-2">${esc(l.title)}</h6><p class="muted mb-2">${esc(l.desc)}</p>
      <div class="small"><i class="fa-solid fa-location-dot me-1 muted"></i>${esc(l.location)} • ${esc(l.date)}</div>
      <div class="small mt-1"><i class="fa-solid fa-circle-info me-1 muted"></i>${esc(l.contact)}</div>${(l.uid === App.me().id || App.role === 'admin') ? `<button class="btn btn-outline-danger btn-sm mt-2" onclick="deleteLostItem(${l.id})"><i class="fa-solid fa-trash me-1"></i>Delete</button>` : ''}</div></div></div>`).join('')}</div>`
      : emptyState('magnifying-glass-location', 'No items found', 'Try a different filter, or report an item yourself.')}`;
  }
});
// Owner or admin can remove a lost/found listing
function deleteLostItem(id) {
  if (!confirm('Delete this listing? This cannot be undone.')) return;
  const i = LOST.findIndex(l => l.id === id);
  if (i >= 0) LOST.splice(i, 1);
  DB.deleteLost(id);
  Router.render();
  toast('Listing deleted.');
}

function reportItem() {
  openModal({ title: 'Report an item', okText: 'Submit', body: `
   <div class="mb-3 d-flex gap-3"><div class="form-check"><input class="form-check-input" type="radio" name="lfS" id="lfLost" value="Lost" checked><label class="form-check-label" for="lfLost">I lost something</label></div><div class="form-check"><input class="form-check-input" type="radio" name="lfS" id="lfFound" value="Found"><label class="form-check-label" for="lfFound">I found something</label></div></div>
   <div class="mb-3"><label class="form-label">Item title</label><input id="lfTitle" class="form-control"></div>
   <div class="mb-3"><label class="form-label">Description</label><textarea id="lfDesc" class="form-control" rows="2"></textarea></div>
   <div class="row g-2 mb-3"><div class="col"><label class="form-label">Category</label><select id="lfCatSel" class="form-select">${LOST_CATS.map(c => `<option>${c}</option>`).join('')}</select></div><div class="col"><label class="form-label">Location</label><input id="lfLoc" class="form-control"></div></div>
   <div class="mb-3"><label class="form-label">Safe contact instructions</label><input id="lfContact" class="form-control" placeholder="e.g. Contact via Student Affairs Office, Room 102"><div class="form-text">Do not post private phone numbers. An admin reviews every listing first.</div></div>
   <div><label class="form-label">Photo (optional, JPG/PNG, max 3 MB)</label><input id="lfPhoto" type="file" class="form-control" accept="image/png,image/jpeg"></div>`,
    onOk() {
      if (val('lfTitle').length < 3 || val('lfDesc').length < 5 || !val('lfLoc') || val('lfContact').length < 5) return 'Please fill in title, description, location and contact instructions.';
      const f = $('#lfPhoto').files[0], err = validateFile(f, ['jpg', 'jpeg', 'png'], 3); if (err) return err;
      LOST.unshift({ id: newPostId(), status: $('input[name=lfS]:checked').value, title: val('lfTitle'), desc: val('lfDesc'), cat: val('lfCatSel'), date: TODAY, location: val('lfLoc'), contact: val('lfContact'), uid: App.me().id, approved: App.role === 'admin', image: f ? URL.createObjectURL(f) : '' });
      DB.saveLost(LOST[0], f); Router.render(); toast(App.role === 'admin' ? 'Item listed.' : 'Submitted. It will appear publicly after admin approval.');
    } });
}
