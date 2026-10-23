/* pages/profile.js: My Profile (view + edit with Cover & Avatar upload) */
let profTab = 'posts';

// Built-in placeholders: no external image file needed for the defaults
const svgURI = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const DEFAULT_COVER = svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#14437F"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>');
const DEFAULT_AVATAR = svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#DBE5F1"/><circle cx="100" cy="78" r="36" fill="#64748B"/><path d="M36 190c8-42 36-62 64-62s56 20 64 62z" fill="#64748B"/></svg>');

Router.add('profile', {
  title: 'My Profile',
  render(view) {
    const me = App.me(), student = me.role === 'student';
    const chips = a => a.length ? a.map(x => `<span class="tagx">${esc(x)}</span>`).join('') : '<span class="muted">Not added yet</span>';
    const posts = POSTS.filter(p => p.uid === me.id && !p.groupId), res = RESOURCES.filter(r => r.uid === me.id);

    view.innerHTML = `
      ${pageHead('My Profile', 'Your public profile on CampusConnect.')}
      
      <div class="card border-0 shadow-sm overflow-hidden rounded-4 mb-4">
        <!-- Cover Photo Section -->
        <div class="profile-cover-wrap position-relative bg-light" style="height: 260px;">
          <img id="coverPreview" src="${me.cover || DEFAULT_COVER}" class="w-100 h-100" style="object-fit: cover;" alt="Cover Photo">
          <label for="coverInput" class="btn btn-sm btn-light position-absolute bottom-0 end-0 m-3 shadow-sm fw-semibold">
            <i class="fa-solid fa-camera me-1"></i> Edit Cover
          </label>
          <input type="file" id="coverInput" accept="image/*" class="d-none">
        </div>

        <!-- Profile Header Section -->
        <div class="px-4 pb-4">
          <div class="d-flex flex-column flex-md-row align-items-center align-items-md-end justify-content-between gap-3">
            
            <div class="d-flex flex-column flex-md-row align-items-center align-items-md-end gap-3 text-center text-md-start">
              <!-- Avatar Section -->
              <div class="position-relative" style="width: 130px; height: 130px; margin-top: -65px;">
                <img id="avatarPreview" src="${me.avatar || DEFAULT_AVATAR}" class="w-100 h-100 rounded-circle border border-4 border-white shadow bg-white" style="object-fit: cover;" alt="Profile Picture">
                <label for="avatarInput" class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style="width: 36px; height: 36px; cursor: pointer; border: 2px solid #fff;" title="Change Profile Picture">
                  <i class="fa-solid fa-camera fa-sm"></i>
                </label>
                <input type="file" id="avatarInput" accept="image/*" class="d-none">
              </div>

              <!-- User Details -->
              <div class="mt-2 mt-md-0">
                <h3 class="fw-bold mb-1" id="profileNameDisplay">${userName(me)}</h3>
                <p class="text-muted mb-0">${esc(userMeta(me))}${student ? ' • Batch ' + me.batch : ''}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <button class="btn btn-primary rounded-pill px-3" onclick="editProfile()">
                <i class="fa-regular fa-pen-to-square me-1"></i> Edit Profile
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Bio, Dept & Info Section -->
      <section class="cc-card mb-4">
        ${me.bio ? `<p class="mb-3">${esc(me.bio)}</p>` : ''}
        <div class="row g-3">
          <div class="col-md-4"><div class="muted small">Department</div><b>${esc(me.dept || '—')}</b></div>
          <div class="col-md-4"><div class="muted small">Semester</div><b>${student ? ordinal(me.sem) : '—'}</b></div>
          <div class="col-md-4"><div class="muted small">Batch</div><b>${student ? me.batch : '—'}</b></div>
        </div>
        <hr>
        <div class="mb-2 fw-semibold">Skills</div>${chips(me.skills)}
        <div class="mt-3 mb-2 fw-semibold">Interests</div>${chips(me.interests)}
      </section>

      <!-- Profile Tabs -->
      <div class="cc-pills mb-3">
        <button class="${profTab === 'posts' ? 'active' : ''}" onclick="profTab='posts';Router.render()">Posts (${posts.length})</button>
        <button class="${profTab === 'res' ? 'active' : ''}" onclick="profTab='res';Router.render()">Shared Resources (${res.length})</button>
      </div>

      ${profTab === 'posts' 
        ? (posts.length ? posts.map(postCard).join('') : emptyState('newspaper', 'No posts yet', 'Share something from the Home page and it will appear here.'))
        : (res.length ? `<div class="cc-card">${res.map(resRow).join('')}</div>` : emptyState('folder-open', 'No shared resources', 'Upload notes from Notes & Resources to see them here.'))}
    `;

    // পেজ রেন্ডার হওয়ার সাথে সাথেই ফাইল আপলোডের ইভেন্টগুলো ইনিশিয়ালাইজ করা হচ্ছে
    setTimeout(initProfileEvents, 50);
  }
});

// মূল এডিট প্রফাইল মোডাল ফাংশন
function editProfile() {
  const me = App.me(), student = me.role === 'student';
  openModal({ title: 'Edit profile', okText: 'Save changes', body: `
   <div class="mb-3"><label class="form-label">Full name</label><input id="pfName" class="form-control" value="${esc(me.name)}"></div>
   ${student ? `<div class="row g-2 mb-3"><div class="col"><label class="form-label">Department</label><select id="pfDept" class="form-select">${DEPTS.map(d => `<option ${d === me.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
    <div class="col"><label class="form-label">Semester</label><select id="pfSem" class="form-select">${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}" ${s === me.sem ? 'selected' : ''}>${ordinal(s)}</option>`).join('')}</select></div>
    <div class="col"><label class="form-label">Batch</label><input id="pfBatch" class="form-control" value="${esc(me.batch)}"></div></div>` : ''}
   <div class="mb-3"><label class="form-label">Short bio</label><textarea id="pfBio" class="form-control" rows="2">${esc(me.bio || '')}</textarea></div>
   <div class="mb-3"><label class="form-label">Skills (comma separated)</label><input id="pfSkills" class="form-control" value="${esc(me.skills.join(', '))}"></div>
   <div><label class="form-label">Interests (comma separated)</label><input id="pfInt" class="form-control" value="${esc(me.interests.join(', '))}"></div>`,
    onOk() {
      if (val('pfName').length < 3) return 'Please enter your full name.';
      const list = s => s.split(',').map(x => x.trim()).filter(Boolean).slice(0, 12);
      me.name = val('pfName'); me.bio = val('pfBio'); me.skills = list(val('pfSkills')); me.interests = list(val('pfInt'));
      if (student) { me.dept = val('pfDept'); me.sem = +val('pfSem'); me.batch = val('pfBatch') || me.batch; }
      DB.saveProfile(me); // keep the profile in Firestore too
      refreshHeader(); Router.render(); toast('Profile updated (demo: resets on refresh).');
    } 
  });
}

// কভার এবং অবতার লাইভ প্রিভিউ হ্যান্ডলার
function initProfileEvents() {
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const me = App.me();

  if (coverInput && coverPreview) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        DB.shrink(file, 1200, 0.75).then(url => { coverPreview.src = url; me.cover = url; DB.saveImage(me.id, 'cover', url); })
          .catch(err => toast(err.message, 'error'));
      }
    });
  }

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        DB.shrink(file, 300, 0.8).then(url => { avatarPreview.src = url; me.avatar = url; DB.saveImage(me.id, 'avatar', url); refreshHeader(); })
          .catch(err => toast(err.message, 'error'));
      }
    });
  }
}