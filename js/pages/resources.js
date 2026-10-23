/* pages/resources.js: Notes & Resources library */
const rf = { dept: '', sem: '', cat: '' };
const FILE_ICONS = { PDF: ['file-pdf', '#DC2626'], DOCX: ['file-word', '#2563EB'], PPTX: ['file-powerpoint', '#D97706'], Image: ['file-image', '#16A34A'] };
function resRow(r) {
  const [ic, col] = FILE_ICONS[r.type] || ['file', '#475569'];
  return `<div class="res-row"><span class="file-ic" style="color:${col};background:${col}1F"><i class="fa-solid fa-${ic}"></i></span>
   <div class="flex-grow-1 min-w-0"><div class="fw-semibold">${esc(r.title)}</div>
    <div class="muted small">${esc(r.subject)} • ${esc(r.dept)} • ${ordinal(r.sem)} Sem • ${esc(r.cat)}</div>
    <div class="muted small">${esc(r.type)} • ${esc(r.size)} • Uploaded by ${esc(userById(r.uid).name)} on ${esc(r.date)}</div></div>
   <button class="btn btn-outline-primary btn-sm" onclick="downloadRes(${r.id})"><i class="fa-solid fa-download me-1"></i>Download</button>${(String(r.uid) === String(App.me().id) || App.role === 'admin') ? '<button class="btn btn-outline-danger btn-sm ms-1" onclick="deleteRes(' + r.id + ')" aria-label="Delete resource"><i class="fa-solid fa-trash"></i></button>' : ''}</div>`;
}

// Owner or admin can remove a resource
function deleteRes(id) {
  if (!confirm('Delete this resource? This cannot be undone.')) return;
  const i = RESOURCES.findIndex(r => r.id === id);
  if (i >= 0) RESOURCES.splice(i, 1);
  DB.deleteResource(id);
  Router.render();
  toast('Resource deleted.');
}
function downloadRes(id) {
  const r = RESOURCES.find(x => x.id === id);
  if (!r) return toast("This resource no longer exists.", "error");
  if (r.link) return window.open(r.link, '_blank', 'noopener');
  if (!r.url) return toast('This resource has no file or link.', 'info');
  const a = document.createElement('a'); a.href = r.url; a.download = r.fileName || 'resource'; a.click();
}
Router.add('resources', {
  title: 'Notes & Resources',
  onSearch() { Router.render(); },
  render(view) {
    const q = App.query.toLowerCase();
    const list = RESOURCES.filter(r => (!rf.dept || r.dept === rf.dept) && (!rf.sem || r.sem == rf.sem) && (!rf.cat || r.cat === rf.cat) && (!q || (r.title + r.subject).toLowerCase().includes(q)));
    const sel = (id, label, opts, cur) => `<div class="col-6 col-md-3"><select class="form-select form-select-sm" aria-label="${label}" onchange="rf.${id}=this.value;Router.render()"><option value="">${label}</option>${opts.map(o => `<option value="${o[0]}" ${String(cur) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
    view.innerHTML = `${pageHead('Notes & Resources', 'Search, share and download study materials.', '<button class="btn btn-primary" onclick="uploadResource()"><i class="fa-solid fa-upload me-1"></i>Upload</button>')}
    <div class="cc-card"><div class="row g-2">${sel('dept', 'All departments', DEPTS.map(d => [d, d]), rf.dept)}${sel('sem', 'All semesters', [1, 2, 3, 4, 5, 6, 7, 8].map(s => [s, ordinal(s) + ' Semester']), rf.sem)}${sel('cat', 'All categories', RES_CATS.map(c => [c, c]), rf.cat)}
     <div class="col-6 col-md-3"><button class="btn btn-light btn-sm w-100 border" onclick="rf.dept=rf.sem=rf.cat='';Router.render()">Clear filters</button></div></div></div>
    <div class="muted small mb-2">${list.length} resource${list.length === 1 ? '' : 's'} found</div>
    ${list.length ? `<div class="cc-card">${list.map(resRow).join('')}</div>` : emptyState('folder-open', 'No resources found', 'Try changing the filters or upload the first one.')}`;
  }
});
function uploadResource() {
  const me = App.me();
  openModal({ title: 'Upload resource', okText: 'Upload', body: `
   <div class="mb-3"><label class="form-label">Title</label><input id="rsTitle" class="form-control" placeholder="e.g. DBMS Normalization Notes"></div>
   <div class="mb-3"><label class="form-label">Subject</label><input id="rsSubject" class="form-control"></div>
   <div class="row g-2 mb-3"><div class="col"><label class="form-label">Department</label><select id="rsDept" class="form-select">${DEPTS.map(d => `<option ${d === me.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
    <div class="col"><label class="form-label">Semester</label><select id="rsSem" class="form-select">${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}" ${s === me.sem ? 'selected' : ''}>${ordinal(s)}</option>`).join('')}</select></div></div>
   <div class="mb-3"><label class="form-label">Category</label><select id="rsCat" class="form-select">${RES_CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
   <div><label class="form-label">File (PDF, Word, PowerPoint, JPG, PNG; up to 600 KB here)</label><input id="rsFile" type="file" class="form-control" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"></div>
   <div class="mt-3"><label class="form-label">Link (optional)</label><input id="rsLink" class="form-control" placeholder="https://drive.google.com/..."><div class="form-text">For big files: paste a Google Drive or OneDrive link (set to "Anyone with the link"). Give either a file or a link.</div></div>`,
    onOk() {
      if (val('rsTitle').length < 3 || !val('rsSubject')) return 'Please enter a title and subject.';
      const f = $('#rsFile').files[0], link = val('rsLink');
      if (!f && !link) return 'Please choose a file or paste a link.';
      if (link && !/^https:\/\//i.test(link)) return 'The link must start with https://';
      if (f) {
        const err = validateFile(f, ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'], 10); if (err) return err;
        if (f.size > 600 * 1024) return 'This file is too big to store here. Upload it to Google Drive and paste the link instead.';
      }
      const ext = f ? f.name.split('.').pop().toLowerCase() : '';
      const type = !f ? 'Link' : ext === 'pdf' ? 'PDF' : ext.startsWith('doc') ? 'DOCX' : ext.startsWith('ppt') ? 'PPTX' : 'Image';
      const size = f ? (f.size / 1048576 >= 1 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB') : 'Link';
      RESOURCES.unshift({ id: newPostId(), title: val('rsTitle'), subject: val('rsSubject'), type, dept: val('rsDept'), sem: +val('rsSem'), cat: val('rsCat'), uid: me.id, date: TODAY, size, link: link || '', fileName: f ? f.name : '', url: '' });
      DB.saveResource(RESOURCES[0], f); Router.render(); toast('Resource uploaded.');
    } });
}
