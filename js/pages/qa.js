/* pages/qa.js: Q&A list + question detail with answers */
let qTag = '';

// Tag filter click: the tag value is read from data-tag, never injected into JS code
document.addEventListener('click', e => {
  const btn = e.target.closest('#qTagPills [data-tag]');
  if (!btn) return;
  qTag = btn.dataset.tag;
  Router.render();
});
Router.add('qa', {
  title: 'Q&A',
  render(view, param) { param ? qDetail(view, +param) : qList(view); },
  onSearch() { Router.render(); }
});
function qList(view) {
  const q = App.query.toLowerCase(), tags = [...new Set(QUESTIONS.flatMap(x => x.tags))];
  const list = QUESTIONS.filter(x => (!qTag || x.tags.includes(qTag)) && (!q || (x.title + x.desc).toLowerCase().includes(q)));
  view.innerHTML = `${pageHead('Q&A', 'Ask academic questions and help other students.', '<button class="btn btn-primary" onclick="askQuestion()"><i class="fa-solid fa-plus me-1"></i>Ask a Question</button>')}
  <div class="cc-pills" id="qTagPills"><button class="${!qTag ? 'active' : ''}" data-tag="">All</button>${tags.map(t => `<button class="${qTag === t ? 'active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
  ${list.length ? list.map(x => { const u = userById(x.uid), acc = x.answers.some(a => a.accepted);
    return `<div class="cc-card q-card"><div class="q-count"><b>${x.answers.length}</b><small>answers</small></div>
    <div class="flex-grow-1 min-w-0"><a class="q-title" href="#/qa/${x.id}">${esc(x.title)}</a> ${acc ? '<span class="badge bg-success ms-1">Accepted</span>' : ''}
     <p class="muted mb-2 mt-1">${esc(x.desc.slice(0, 140))}${x.desc.length > 140 ? '…' : ''}</p>
     <div>${x.tags.map(t => `<span class="tagx">${esc(t)}</span>`).join('')}</div><div class="muted small">Asked by ${esc(u.name)} • ${x.time}</div></div></div>`; }).join('')
    : emptyState('circle-question', 'No questions found', 'Try a different keyword or ask a new question.')}`;
}
function askQuestion() {
  openModal({ title: 'Ask a question', okText: 'Post question', body: `
   <div class="mb-3"><label class="form-label">Title</label><input id="qTitle" class="form-control" maxlength="150" placeholder="Summarise your question"></div>
   <div class="mb-3"><label class="form-label">Description</label><textarea id="qDesc" class="form-control" rows="4"></textarea></div>
   <div><label class="form-label">Subject tags (comma separated, max 5)</label><input id="qTags" class="form-control" placeholder="e.g. PHP, Web Technology"></div>`,
    onOk() {
      if (val('qTitle').length < 8) return 'Title must be at least 8 characters.';
      if (val('qDesc').length < 10) return 'Please describe your question in a little more detail.';
      const tags = val('qTags').split(',').map(t => t.trim()).filter(Boolean).slice(0, 5); if (!tags.length) return 'Add at least one subject tag.';
      QUESTIONS.unshift({ id: newId(), uid: App.me().id, time: 'Just now', title: val('qTitle'), desc: val('qDesc'), tags, answers: [] });
      Router.render(); toast('Question posted.');
    } });
}
function qDetail(view, id) {
  const x = QUESTIONS.find(q => q.id === id);
  if (!x) { view.innerHTML = emptyState('circle-exclamation', 'Question not found', 'It may have been removed.'); return; }
  const me = App.me(), mine = x.uid === me.id, u = userById(x.uid);
  const answers = [...x.answers].sort((a, b) => b.accepted - a.accepted);
  view.innerHTML = `<a href="#/qa" class="link-btn d-inline-block mb-3"><i class="fa-solid fa-arrow-left"></i> All questions</a>
  <section class="cc-card"><h4 style="color:var(--navy)">${esc(x.title)}</h4><p>${nl2br(x.desc)}</p>
   <div>${x.tags.map(t => `<span class="tagx">${esc(t)}</span>`).join('')}</div><div class="muted small">Asked by ${userName(u)} • ${x.time}</div></section>
  <h6 class="mb-2">${x.answers.length} Answer${x.answers.length === 1 ? '' : 's'}</h6>
  ${answers.map(a => { const au = userById(a.uid); return `<div class="cc-card answer ${a.accepted ? 'accepted' : ''}">
    <div class="d-flex gap-2 align-items-center mb-2">${avatar(au, 34)}<div class="flex-grow-1"><b>${userName(au)}</b> ${deptChip(au)}<div class="muted small">${a.time}</div></div>
     ${a.accepted ? '<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i>Accepted answer</span>' : (mine ? `<button class="btn btn-outline-success btn-sm" onclick="acceptAnswer(${x.id},${a.id})">Mark as accepted</button>` : '')}</div>
    <p class="mb-2">${nl2br(a.text)}</p>
    ${a.comments.map(commentHTML).join('')}
    <div class="d-flex gap-2 mt-2"><input id="ac${a.id}" class="form-control form-control-sm" placeholder="Add a comment..." onkeydown="if(event.key==='Enter')addAnsComment(${x.id},${a.id})"><button class="btn btn-light btn-sm border" onclick="addAnsComment(${x.id},${a.id})">Comment</button></div></div>`; }).join('')}
  <section class="cc-card"><h6>Your answer</h6><textarea id="ansText" class="form-control mb-2" rows="4" placeholder="Write a clear, helpful answer..."></textarea><button class="btn btn-primary" onclick="submitAnswer(${x.id})">Post Answer</button></section>`;
}
function acceptAnswer(qid, aid) { QUESTIONS.find(q => q.id === qid).answers.forEach(a => a.accepted = a.id === aid); Router.render(); toast('Answer marked as accepted.'); }
function submitAnswer(qid) {
  const v = val('ansText'); if (v.length < 5) return toast('Please write a longer answer.', 'error');
  QUESTIONS.find(q => q.id === qid).answers.push({ id: newId(), uid: App.me().id, time: 'Just now', accepted: false, text: v, comments: [] });
  Router.render(); toast('Answer posted.');
}
function addAnsComment(qid, aid) {
  const v = val('ac' + aid); if (!v) return toast('Write a comment first.', 'error');
  QUESTIONS.find(q => q.id === qid).answers.find(a => a.id === aid).comments.push({ uid: App.me().id, text: v }); Router.render();
}
