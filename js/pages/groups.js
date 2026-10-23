/* pages/groups.js: group list + group detail */
let gTab = 'mine';
Router.add('groups', {
  title: 'My Groups',
  render(view, param) { param ? groupDetail(view, +param) : groupList(view); },
  onSearch() { Router.render(); }
});
// Any student, teacher or admin can start a group; the creator joins it automatically
const GROUP_ICONS = ['user-group', 'code', 'laptop-code', 'book', 'flask', 'calculator', 'mug-hot', 'futbol', 'camera', 'graduation-cap'];
const GROUP_COLORS = ['#123B70', '#0D9488', '#2563EB', '#1E3A8A', '#DC2626', '#D97706', '#16A34A', '#7C3AED'];

function createGroupModal() {
  const body = `
    <div class="mb-3"><label class="form-label" for="cgName">Group name</label>
      <input id="cgName" class="form-control" maxlength="60" placeholder="e.g. CST 3rd Semester Notes"></div>
    <div class="mb-3"><label class="form-label" for="cgDesc">Description</label>
      <textarea id="cgDesc" class="form-control" rows="3" maxlength="300" placeholder="What is this group for?"></textarea></div>
    <div class="row g-2 mb-3">
      <div class="col-6"><label class="form-label" for="cgKind">Type</label>
        <select id="cgKind" class="form-select">
          ${['Semester', 'Department', 'Interest', 'Club', 'Other'].map(k => `<option>${k}</option>`).join('')}
        </select></div>
      <div class="col-6"><label class="form-label" for="cgIcon">Icon</label>
        <select id="cgIcon" class="form-select">
          ${GROUP_ICONS.map(i => `<option value="${i}">${i}</option>`).join('')}
        </select></div>
    </div>
    <div><label class="form-label d-block">Color</label>
      ${GROUP_COLORS.map((c, i) => `<label class="me-2" style="cursor:pointer">
        <input type="radio" name="cgColor" value="${c}" ${i === 0 ? 'checked' : ''} class="visually-hidden">
        <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:${c};outline:${i === 0 ? '3px solid #94a3b8' : 'none'};outline-offset:2px"></span></label>`).join('')}
    </div>`;
  openModal({
    title: 'Create a group', body, okText: 'Create group',
    onOk() {
      const name = val('cgName'), desc = val('cgDesc');
      if (name.length < 3) return 'Group name must be at least 3 characters.';
      if (desc.length < 5) return 'Please write a short description (at least 5 characters).';
      const color = document.querySelector('input[name="cgColor"]:checked')?.value || GROUP_COLORS[0];
      const g = { id: newPostId(), name, desc, kind: val('cgKind'), icon: val('cgIcon'), color,
        members: 1, joined: true, ownerUid: App.me().id };
      GROUPS.unshift(g);
      DB.createGroup(g);
      Router.render();
      toast('Group created. You have joined it.');
    }
  });
}

function groupList(view) {
  const q = App.query.toLowerCase();
  const list = GROUPS.filter(g => (gTab === 'mine' ? g.joined : !g.joined) && (!q || (g.name + g.desc).toLowerCase().includes(q)));
  view.innerHTML = `${pageHead('Groups', 'Join academic communities for your department, semester or interests.', '<button class="btn btn-primary" onclick="createGroupModal()"><i class="fa-solid fa-plus me-1"></i>Create group</button>')}
  <div class="cc-pills"><button class="${gTab === 'mine' ? 'active' : ''}" onclick="gTab='mine';Router.render()">My Groups (${GROUPS.filter(g => g.joined).length})</button><button class="${gTab === 'all' ? 'active' : ''}" onclick="gTab='all';Router.render()">Discover</button></div>
  ${list.length ? `<div class="row g-3">${list.map(g => `<div class="col-md-6"><div class="cc-card h-100 mb-0">
    <div class="d-flex gap-3 align-items-center"><span class="g-tile" style="background:${g.color};width:48px;height:48px"><i class="fa-solid fa-${g.icon}"></i></span>
     <div class="min-w-0"><a class="fw-semibold" href="#/groups/${g.id}">${esc(g.name)}</a><div class="muted small">${fmtN(g.members)} members • ${esc(g.kind)}</div></div></div>
    <p class="muted mt-3">${esc(g.desc)}</p>
    <div class="d-flex gap-2"><a class="btn btn-outline-primary btn-sm" href="#/groups/${g.id}">Open</a><button class="btn btn-sm ${g.joined ? 'btn-light border' : 'btn-primary'}" onclick="toggleGroup(${g.id})">${g.joined ? 'Leave' : 'Join'}</button></div></div></div>`).join('')}</div>`
    : emptyState('user-group', gTab === 'mine' ? 'No groups yet' : 'No groups found', gTab === 'mine' ? 'Open the Discover tab to find a group to join.' : 'Try a different search keyword.')}`;
}
function groupDetail(view, id) {
  const g = groupById(id);
  if (!g) { view.innerHTML = emptyState('circle-exclamation', 'Group not found', 'This group may have been removed.'); return; }
  const me = App.me(), mod = g.ownerUid === me.id || App.role === 'admin';
  const posts = POSTS.filter(p => p.groupId === id);
  view.innerHTML = `<a href="#/groups" class="link-btn d-inline-block mb-3"><i class="fa-solid fa-arrow-left"></i> All groups</a>
  <section class="cc-card"><div class="d-flex gap-3 align-items-center flex-wrap"><span class="g-tile" style="background:${g.color};width:60px;height:60px;font-size:24px"><i class="fa-solid fa-${g.icon}"></i></span>
   <div class="flex-grow-1"><h4 class="mb-0">${esc(g.name)}</h4><div class="muted">${fmtN(g.members)} members • ${esc(g.kind)} • Owner: ${esc(userById(g.ownerUid).name)}${mod ? ' <span class="badge bg-primary ms-1">Moderator</span>' : ''}</div></div>
   <button class="btn ${g.joined ? 'btn-light border' : 'btn-primary'}" onclick="toggleGroup(${g.id})">${g.joined ? 'Leave Group' : 'Join Group'}</button></div>
   <p class="mt-3 mb-0">${esc(g.desc)}</p>
  <div class="mt-3 d-flex flex-wrap gap-2 align-items-center">${(g.memberUids || []).map(uid => { const u = userById(uid); return u ? `<span class="tagx d-inline-flex align-items-center gap-1">${avatar(u, 20)}${esc(u.name)}${roleBadge(u)}${mod && uid !== g.ownerUid ? ` <button class="link-btn text-danger" onclick="removeMemberAsk('${uid}', ${g.id})" aria-label="Remove member">✕</button>` : ''}</span>` : ''; }).join('')}${mod ? `<button class="btn btn-outline-primary btn-sm" onclick="addMemberModal(${g.id})"><i class="fa-solid fa-user-plus me-1"></i>Add member</button>` : ''}</div></section>
  ${g.joined ? composerHTML(id) : '<div class="cc-card muted text-center">Join this group to post and comment.</div>'}
  <div id="feed">${posts.length ? posts.map(postCard).join('') : emptyState('newspaper', 'No group posts yet', 'Start the conversation in this group.')}</div>`;
  if (g.joined) bindComposer();
}


// Owner or admin adds a registered user to the group
function addMemberModal(gid) {
  const g = groupById(gid);
  if (!g) return;
  const inGroup = new Set((g.memberUids || []).map(String));
  const candidates = USERS.filter(u => typeof u.id === 'string' && !inGroup.has(String(u.id)));
  if (!candidates.length) return toast('Everyone is already in this group.', 'info');
  const body = `<label class="form-label" for="amUser">Choose a user</label>
    <select id="amUser" class="form-select">${candidates.map(u => `<option value="${esc(u.id)}">${esc(u.name)} (${esc(u.role)})</option>`).join('')}</select>`;
  openModal({
    title: 'Add member', body, okText: 'Add to group',
    onOk() {
      const uid = document.getElementById('amUser').value;
      const u = userById(uid);
      DB.addMember(gid, uid);
      g.memberUids = [...(g.memberUids || []), uid];
      g.members += 1;
      done(`${u.name} was added to the group.`);
    }
  });
}


// Owner or admin removes a member from the group
function removeMemberAsk(uid, gid) {
  const g = groupById(gid);
  const u = userById(uid);
  if (!g || !u) return;
  confirmAction(`Remove ${u.name} from this group?`, () => {
    g.memberUids = (g.memberUids || []).filter(x => String(x) !== String(uid));
    g.members = Math.max(0, g.members - 1);
    DB.removeMember(gid, uid);
    done(`${u.name} was removed from the group.`);
  }, 'Remove');
}
