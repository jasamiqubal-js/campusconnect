/* pages/admin.js: Admin Panel (UI only; real permissions are enforced by the backend in Phase 5) */
let aTab = 'overview';
const rowText = r => Object.values(r).filter(v => typeof v !== 'object').join(' ').toLowerCase();
const stBadge = s => `<span class="badge ${s === 'Active' || s === 'Approved' || s === 'Resolved' ? 'bg-success' : s === 'Open' || s === 'Pending' ? 'bg-warning text-dark' : 'bg-secondary'}">${s}</span>`;
const snip = (t, n = 60) => esc(t.length > n ? t.slice(0, n) + '…' : t);
const done = m => { toast(m); Router.render(); };

const AD = {
  users: { label: 'Users', icon: 'users', rows: () => USERS,
    cols: [['Name', u => `<span class="d-flex align-items-center gap-2">${avatar(u, 28)}${userName(u)}</span>`], ['Role', u => `<span class="text-capitalize">${esc(u.role)}</span>`], ['Department', u => u.dept || '—'], ['Status', u => stBadge(u.status)]],
    acts: u => u.id === 8 ? [] : [[u.status === 'Active' ? 'Suspend' : 'Activate', 'outline-warning', 'toggle'], ['Remove', 'outline-danger', 'remove']],
    run: {
      toggle: id => { const u = userById(id); confirmAction(`${u.status === 'Active' ? 'Suspend' : 'Activate'} ${u.name}?`, () => { u.status = u.status === 'Active' ? 'Suspended' : 'Active'; DB.setUserStatus(u.id, u.status); done('User status updated.'); }, 'Confirm'); },
      remove: id => confirmAction(`Remove ${userById(id).name} and all their posts?`, () => { USERS.splice(USERS.findIndex(u => u.id === id), 1); POSTS = POSTS.filter(p => p.uid !== id); done('User removed.'); })
    } },
  posts: { label: 'Posts', icon: 'newspaper', rows: () => POSTS,
    cols: [['Author', p => esc(userById(p.uid).name)], ['Post', p => snip(p.text)], ['Where', p => p.groupId ? esc(groupById(p.groupId)?.name || 'Group') : 'Home feed'], ['Posted', p => esc(p.time)]],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: { del: id => confirmAction('Delete this post permanently?', () => { DB.deletePost(id); POSTS = POSTS.filter(p => p.id !== id); DB.resolveReportsFor(id); REPORTS.forEach(r => { if (r.postId === id) r.status = 'Resolved'; }); done('Post deleted.'); }) } },
  groups: { label: 'Groups', icon: 'user-group', rows: () => GROUPS,
    cols: [['Group', g => esc(g.name)], ['Type', g => g.kind], ['Members', g => fmtN(g.members)], ['Owner', g => esc(userById(g.ownerUid).name)]],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: { del: id => confirmAction('Delete this group and all its posts?', () => { DB.deleteGroup(id); GROUPS.splice(GROUPS.findIndex(g => g.id === id), 1); POSTS = POSTS.filter(p => p.groupId !== id); refreshSide(); done('Group deleted.'); }) } },
  notices: { label: 'Notices', icon: 'bullhorn', rows: () => NOTICES, head: '<button class="btn btn-primary btn-sm" onclick="openNoticeForm()">Publish Notice</button>',
    cols: [['Title', n => snip(n.title)], ['Category', n => catBadge(n.cat, true)], ['Date', n => n.date], ['Author', n => esc(userById(n.uid).name)]],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: { del: id => confirmAction('Delete this notice?', () => { NOTICES.splice(NOTICES.findIndex(n => n.id === id), 1); done('Notice deleted.'); }) } },
  events: { label: 'Events', icon: 'calendar-days', rows: () => EVENTS, head: '<button class="btn btn-primary btn-sm" onclick="openEventForm()">Create Event</button>',
    cols: [['Event', e => snip(e.title)], ['Date', e => `${e.day} ${e.mon}`], ['Location', e => esc(e.location)], ['Organizer', e => esc(e.organizer)]],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: { del: id => confirmAction('Delete this event?', () => { EVENTS.splice(EVENTS.findIndex(e => e.id === id), 1); done('Event deleted.'); }) } },
  reports: { label: 'Reports', icon: 'flag', rows: () => REPORTS,
    cols: [['Reported post', r => snip(postById(r.postId)?.text || '(post already removed)')], ['Reason', r => esc(r.reason)], ['Reported by', r => esc(userById(r.by).name)], ['Status', r => stBadge(r.status)]],
    acts: r => r.status === 'Open' ? [['Remove post', 'outline-danger', 'remove'], ['Dismiss', 'outline-secondary', 'dismiss']] : [],
    run: {
      remove: id => { const r = REPORTS.find(x => x.id === id); confirmAction('Remove the reported post?', () => { DB.deletePost(r.postId); DB.resolveReportsFor(r.postId); POSTS = POSTS.filter(p => p.id !== r.postId); REPORTS.forEach(x => { if (x.postId === r.postId) x.status = 'Resolved'; }); done('Post removed and report resolved.'); }, 'Remove post'); },
      dismiss: id => { REPORTS.find(x => x.id === id).status = 'Dismissed'; DB.setReportStatus(id, 'Dismissed'); done('Report dismissed.'); }
    } },
  lost: { label: 'Lost & Found', icon: 'magnifying-glass-location', rows: () => LOST,
    cols: [['Item', l => snip(l.title)], ['Type', l => l.status], ['Category', l => esc(l.cat)], ['Review', l => stBadge(l.approved ? 'Approved' : 'Pending')]],
    acts: l => [...(l.approved ? [] : [['Approve', 'outline-success', 'ok']]), ['Remove', 'outline-danger', 'del']],
    run: { ok: id => { LOST.find(l => l.id === id).approved = true; DB.setLostApproved(id, true); done('Listing approved.'); }, del: id => confirmAction('Remove this listing?', () => { DB.deleteLost(id); LOST.splice(LOST.findIndex(l => l.id === id), 1); done('Listing removed.'); }) } }
};
const admAct = (tab, act, id) => AD[tab].run[act](id);

Router.add('admin', {
  title: 'Admin Panel', admin: true,
  onSearch() { Router.render(); },
  render(view) {
    const tabs = [['overview', 'Overview', 'chart-pie'], ...Object.entries(AD).map(([k, v]) => [k, v.label, v.icon])];
    let body;
    if (aTab === 'overview') {
      const stats = [['Users', USERS.length, 'users', '#2563EB'], ['Posts', POSTS.length, 'newspaper', '#16A34A'], ['Groups', GROUPS.length, 'user-group', '#D97706'], ['Notices', NOTICES.length, 'bullhorn', '#DC2626'],
        ['Events', EVENTS.length, 'calendar-days', '#9333EA'], ['Open reports', REPORTS.filter(r => r.status === 'Open').length, 'flag', '#EF4444'], ['Pending Lost & Found', LOST.filter(l => !l.approved).length, 'magnifying-glass-location', '#0D9488'], ['Resources', RESOURCES.length, 'book-open', '#475569']];
      const byDept = DEPTS.map(d => [d, USERS.filter(u => u.dept === d).length]), max = Math.max(1, ...byDept.map(x => x[1]));
      body = `<div class="row g-3 mb-3">${stats.map(s => `<div class="col-6 col-xl-3"><div class="cc-card stat-card mb-0"><span class="g-tile" style="background:${s[3]}"><i class="fa-solid fa-${s[2]}"></i></span><div><b>${s[1]}</b><span class="muted small">${s[0]}</span></div></div></div>`).join('')}</div>
      <div class="cc-card"><h6 class="mb-3">Users by department</h6>${byDept.map(d => `<div class="bar-row"><span class="l">${d[0]}</span><div class="bar" style="width:${Math.max(2, d[1] / max * 70)}%"></div><b>${d[1]}</b></div>`).join('')}</div>`;
    } else {
      const t = AD[aTab], q = App.query.toLowerCase(), rows = t.rows().filter(r => !q || rowText(r).includes(q));
      body = `<div class="cc-card"><div class="d-flex justify-content-between align-items-center mb-2"><h6 class="mb-0">${t.label} (${rows.length})</h6>${t.head || ''}</div>
       ${rows.length ? `<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr>${t.cols.map(c => `<th>${c[0]}</th>`).join('')}<th class="text-end">Actions</th></tr></thead><tbody>
        ${rows.map(r => `<tr>${t.cols.map(c => `<td>${c[1](r)}</td>`).join('')}<td class="text-end text-nowrap">${t.acts(r).map(a => `<button class="btn btn-sm btn-${a[1]} ms-1" onclick="admAct('${aTab}','${a[2]}',${r.id})">${a[0]}</button>`).join('') || '<span class="muted small">—</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><p class="mb-0">Nothing to show here.</p></div>'}</div>`;
    }
    view.innerHTML = `${pageHead('Admin Panel', 'Manage users, content and reports.')}
    <div class="cc-pills">${tabs.map(t => `<button class="${aTab === t[0] ? 'active' : ''}" onclick="aTab='${t[0]}';Router.render()"><i class="fa-solid fa-${t[2]} me-1"></i>${t[1]}</button>`).join('')}</div>${body}`;
  }
});


/* ===== Admin powers: manage users, posts, groups, notices and events from this panel ===== */
(function () {
  const me = () => App.me();

  // Generic edit popup: fields = [{ key, label, value, multi, min }]
  function editModal(title, fields, onSave) {
    const body = fields.map(f => `<div class="mb-3"><label class="form-label" for="ed_${f.key}">${f.label}</label>
      ${f.multi ? `<textarea id="ed_${f.key}" class="form-control" rows="4">${esc(f.value)}</textarea>`
                : `<input id="ed_${f.key}" class="form-control" value="${esc(f.value)}">`}</div>`).join('');
    openModal({
      title, body, okText: 'Save changes',
      onOk() {
        const v = {};
        for (const f of fields) {
          v[f.key] = val('ed_' + f.key);
          if (f.min && v[f.key].length < f.min) return `${f.label} must be at least ${f.min} characters.`;
        }
        onSave(v);
        done('Saved.');
      }
    });
  }

  // ----- Users: make teacher / admin / student -----
  const changeRole = (id, role) => {
    const u = userById(id);
    confirmAction(`Make ${u.name} a ${role}?`, () => {
      u.role = role; DB.setUserRole(u.id, role); done(`${u.name} is now a ${role}.`);
    }, 'Confirm');
  };
  AD.users.run.mkT = id => changeRole(id, 'teacher');
  AD.users.run.mkA = id => changeRole(id, 'admin');
  AD.users.run.mkS = id => changeRole(id, 'student');
  AD.users.acts = u => (String(u.id) === String(me().id) || u.id === 8) ? [] : [
    ...(u.role !== 'teacher' ? [['Make teacher', 'outline-primary', 'mkT']] : []),
    ...(u.role !== 'admin' ? [['Make admin', 'outline-dark', 'mkA']] : []),
    ...(u.role !== 'student' ? [['Make student', 'outline-secondary', 'mkS']] : []),
    [u.status === 'Active' ? 'Suspend' : 'Activate', 'outline-warning', 'toggle'],
    ['Remove', 'outline-danger', 'remove']
  ];

  // ----- Posts: edit text -----
  AD.posts.acts = () => [['Edit', 'outline-primary', 'edit'], ['Delete', 'outline-danger', 'del']];
  AD.posts.run.edit = id => {
    const p = POSTS.find(x => x.id === id);
    editModal('Edit post', [{ key: 'text', label: 'Post text', value: p.text, multi: true, min: 1 }],
      v => { p.text = v.text; DB.updatePost(id, v.text); });
  };

  // ----- Groups: edit name and description -----
  AD.groups.acts = () => [['Edit', 'outline-primary', 'edit'], ['Delete', 'outline-danger', 'del']];
  AD.groups.run.edit = id => {
    const g = GROUPS.find(x => x.id === id);
    editModal('Edit group', [
      { key: 'name', label: 'Group name', value: g.name, min: 3 },
      { key: 'desc', label: 'Description', value: g.desc, multi: true, min: 5 }
    ], v => { g.name = v.name; g.desc = v.desc; DB.updateGroup(id, v); refreshSide(); });
  };

  // ----- Notices: edit and delete -----
  AD.notices.acts = () => [['Edit', 'outline-primary', 'edit'], ['Delete', 'outline-danger', 'del']];
  AD.notices.run.edit = id => {
    const n = NOTICES.find(x => x.id === id);
    editModal('Edit notice', [
      { key: 'title', label: 'Title', value: n.title, min: 3 },
      { key: 'desc', label: 'Details', value: n.desc, multi: true, min: 3 }
    ], v => { n.title = v.title; n.desc = v.desc; DB.updateNotice(id, v); });
  };
  AD.notices.run.del = id => confirmAction('Delete this notice?', () => {
    NOTICES.splice(NOTICES.findIndex(n => n.id === id), 1); DB.deleteNotice(id); done('Notice deleted.');
  });

  // ----- Events: edit and delete -----
  AD.events.acts = () => [['Edit', 'outline-primary', 'edit'], ['Delete', 'outline-danger', 'del']];
  AD.events.run.edit = id => {
    const e = EVENTS.find(x => x.id === id);
    editModal('Edit event', [
      { key: 'title', label: 'Title', value: e.title, min: 3 },
      { key: 'desc', label: 'Details', value: e.desc, multi: true, min: 3 },
      { key: 'location', label: 'Location', value: e.location, min: 2 }
    ], v => { e.title = v.title; e.desc = v.desc; e.location = v.location; DB.updateEvent(id, v); });
  };
  AD.events.run.del = id => confirmAction('Delete this event?', () => {
    EVENTS.splice(EVENTS.findIndex(e => e.id === id), 1); DB.deleteEvent(id); done('Event deleted.');
  });
})();


/* ===== Admin: comments tab ===== */
(function () {
  const allComments = () => POSTS.flatMap(p => p.comments.filter(c => c.cid).map(c => ({ id: String(c.cid), pid: p.id, uid: c.uid, text: c.text, time: c.time })));
  AD.comments = {
    label: 'Comments', icon: 'comment', rows: allComments,
    cols: [
      ['Comment', r => snip(r.text)],
      ['By', r => esc(userById(r.uid).name)],
      ['On post', r => snip(postById(r.pid)?.text || '(post removed)')],
      ['Time', r => esc(r.time)]
    ],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: {
      del: id => confirmAction('Delete this comment?', () => {
        const row = allComments().find(r => r.id === String(id));
        if (row) removeComment(row.pid, row.id);
        done('Comment deleted.');
      })
    }
  };
})();


/* ===== Admin: resources tab (see every uploaded note and remove any of them) ===== */
(function () {
  AD.resources = {
    label: 'Resources', icon: 'book-open', rows: () => RESOURCES,
    cols: [
      ['Title', r => snip(r.title || '')],
      ['Category', r => esc(r.cat || '—')],
      ['Dept / Sem', r => esc((r.dept || '—') + (r.sem ? ' • ' + ordinal(r.sem) : ''))],
      ['Uploaded by', r => esc(userById(r.uid).name)],
      ['Date', r => esc(r.date || '')]
    ],
    acts: () => [['Delete', 'outline-danger', 'del']],
    run: {
      del: id => confirmAction('Delete this resource permanently?', () => {
        const i = RESOURCES.findIndex(r => String(r.id) === String(id));
        if (i >= 0) RESOURCES.splice(i, 1);
        DB.deleteResource(id);
        done('Resource deleted.');
      })
    }
  };
})();
