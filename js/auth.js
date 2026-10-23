/* auth.js: sign up, sign in, sign out, and the login/register page (Firebase) */
const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email or password is wrong.',
  'auth/wrong-password': 'Email or password is wrong.',
  'auth/user-not-found': 'Email or password is wrong.',
  'auth/email-already-in-use': 'This email is already registered. Please sign in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection.'
};

const Auth = {
  user: null,

  // Wait until Firebase knows whether someone is signed in
  init() {
    return new Promise(resolve => {
      const stop = fbAuth.onAuthStateChanged(u => { stop(); this.user = u; resolve(u); });
    });
  },
  async signUp(name, email, password, extra = {}) {
    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    // Matching profile document, the Firestore version of the "profiles" table
    await fdb.collection('users').doc(cred.user.uid).set({
      name, role: 'student', dept: extra.dept || '', sem: extra.sem || 0, roll: extra.roll || '', status: 'Active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return cred.user;
  },
  signIn(email, password) {
    return fbAuth.signInWithEmailAndPassword(email, password);
  },
  async signInWithGoogle() {
    const cred = await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    const ref = fdb.collection('users').doc(cred.user.uid);
    const snap = await ref.get();
    // First Google login: create the profile. Later logins: keep the existing one.
    if (!snap.exists) {
      await ref.set({
        name: cred.user.displayName || 'Student', role: 'student', dept: '', sem: 0, status: 'Active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    return cred.user;
  },
  async signOut() {
    await fbAuth.signOut();
    location.hash = '';
    location.reload();
  }
};

// Login / register page, shown when nobody is signed in
function renderAuthPage(mode = 'login') {
  const isReg = mode === 'register';
  document.getElementById('app').innerHTML = `
  <div class="auth-wrap">
    <aside class="auth-hero" aria-hidden="true">
      <div class="auth-hero-inner">
        <span class="auth-badge"><i class="fa-solid fa-graduation-cap"></i> For polytechnic students</span>
        <h2 class="auth-hero-title">Learn Together.<br><span>Grow Together.</span></h2>
        <p class="auth-hero-text">Share notes, ask questions, join study groups and never miss a campus notice.</p>
        <ul class="auth-features">
          <li><i class="fa-solid fa-book-open"></i>Notes and resources, shared by students</li>
          <li><i class="fa-solid fa-circle-question"></i>Q&amp;A with classmates and teachers</li>
          <li><i class="fa-solid fa-users"></i>Study groups for every subject</li>
          <li><i class="fa-solid fa-bullhorn"></i>Official notices in one place</li>
        </ul>
      </div>
    </aside>

    <main class="auth-main">
      <div class="auth-card">
        <div class="auth-brand">
          <img class="auth-logo" src="icons/logo.png" alt="CampusConnect logo" width="56" height="56">
          <span class="auth-brand-name">Campus<em>Connect</em></span>
        </div>

        <h1 class="auth-title">${isReg ? 'Create your account' : 'Welcome back'}</h1>
        <p class="auth-sub">${isReg ? 'Join your campus community in a minute.' : 'Sign in to continue to CampusConnect.'}</p>

        <div class="alert alert-danger py-2 d-none" id="authErr" role="alert"></div>

        <form id="authForm" novalidate>
          ${isReg ? `
          <div class="auth-field">
            <label for="authName">Full name</label>
            <div class="auth-input"><i class="fa-regular fa-user"></i>
              <input id="authName" autocomplete="name" placeholder="e.g. Rafiul Islam"></div>
          </div>
          <div class="auth-field">
            <label for="authDept">Department</label>
            <div class="auth-input"><i class="fa-solid fa-building-columns"></i>
              <select id="authDept"><option value="">Select your department</option>${DEPTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
          </div>
          <div class="auth-field">
            <label for="authSem">Semester</label>
            <div class="auth-input"><i class="fa-solid fa-layer-group"></i>
              <select id="authSem"><option value="">Select your semester</option>${[1,2,3,4,5,6,7,8].map(n => `<option value="${n}">${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} semester</option>`).join('')}</select></div>
          </div>
          <div class="auth-field">
            <label for="authRoll">Student ID / roll <span class="muted">(optional)</span></label>
            <div class="auth-input"><i class="fa-regular fa-id-card"></i><input id="authRoll" placeholder="e.g. 2301045"></div>
          </div>` : ''}

          <div class="auth-field">
            <label for="authEmail">Email</label>
            <div class="auth-input"><i class="fa-regular fa-envelope"></i>
              <input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com" required></div>
          </div>

          <div class="auth-field">
            <label for="authPass">Password</label>
            <div class="auth-input"><i class="fa-solid fa-lock"></i>
              <input id="authPass" type="password" minlength="6" required
                autocomplete="${isReg ? 'new-password' : 'current-password'}" placeholder="At least 6 characters">
              <button type="button" class="auth-eye" id="authEye" aria-label="Show password"><i class="fa-regular fa-eye"></i></button>
            </div>
          </div>

          <button id="authBtn" class="btn auth-submit w-100" type="submit">
            ${isReg ? 'Create account' : 'Sign in'} <i class="fa-solid fa-arrow-right ms-1"></i>
          </button>
        </form>

        <div class="auth-divider"><span>or</span></div>

        <button id="googleBtn" class="btn auth-google w-100" type="button">
          <i class="fa-brands fa-google me-2"></i>Continue with Google
        </button>

        <p class="auth-switch">
          ${isReg ? 'Already have an account?' : 'New to CampusConnect?'}
          <button class="link-btn" id="authSwitch" type="button">${isReg ? 'Sign in' : 'Create an account'}</button>
        </p>
      </div>
    </main>
  </div>`;

  const err = document.getElementById('authErr');
  const btn = document.getElementById('authBtn');
  const showErr = msg => { err.textContent = msg; err.classList.remove('d-none'); };

  document.getElementById('authSwitch').addEventListener('click', () => renderAuthPage(isReg ? 'login' : 'register'));

  // Show / hide password
  document.getElementById('authEye').addEventListener('click', e => {
    const inp = document.getElementById('authPass');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    e.currentTarget.querySelector('i').className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  document.getElementById('googleBtn').addEventListener('click', async () => {
    err.classList.add('d-none');
    const gBtn = document.getElementById('googleBtn');
    gBtn.disabled = true;
    try {
      await Auth.signInWithGoogle();
      location.reload();
    } catch (ex) {
      if (ex.code !== 'auth/popup-closed-by-user' && ex.code !== 'auth/cancelled-popup-request') {
        showErr(ex.code === 'auth/unauthorized-domain'
          ? 'This domain is not allowed for Google login. Open the app via localhost or your Firebase Hosting address.'
          : (AUTH_ERRORS[ex.code] || ex.message));
      }
      gBtn.disabled = false;
    }
  });

    document.querySelectorAll('.auth-input select').forEach(sel => {
      const paint = () => { sel.style.color = sel.value ? '#0F172A' : '#94A3B8'; };
      sel.addEventListener('change', paint); paint();
    });
  document.getElementById('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    err.classList.add('d-none');
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value;
    const name = isReg ? document.getElementById('authName').value.trim() : '';

    if (isReg && name.length < 3) return showErr('Please enter your full name (at least 3 characters).');
    const dept = isReg ? document.getElementById('authDept').value : '';
    const sem = isReg ? Number(document.getElementById('authSem').value) : 0;
    const roll = isReg ? document.getElementById('authRoll').value.trim() : '';
    if (isReg && !dept) return showErr('Please choose your department.');
    if (isReg && !sem) return showErr('Please choose your semester.');
    if (!email || pass.length < 6) return showErr('Enter a valid email and a password of at least 6 characters.');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…';
    try {
      if (isReg) await Auth.signUp(name, email, pass, { dept, sem, roll });
      else await Auth.signIn(email, pass);
      location.reload(); // the app boots again, now with a signed-in user
    } catch (ex) {
      showErr(AUTH_ERRORS[ex.code] || ex.message);
      btn.disabled = false;
      btn.innerHTML = `${isReg ? 'Create account' : 'Sign in'} <i class="fa-solid fa-arrow-right ms-1"></i>`;
    }
  });
}


// After a Google sign-in, ask for the details the account does not have yet (name, department, semester, ID)
function completeProfile() {
  const me = App.me();
  const opts = (list, fmt) => list.map(x => `<option value="${x}">${fmt(x)}</option>`).join('');
  const body = `
    <div class="mb-3"><label class="form-label" for="cpName">Full name</label>
      <input id="cpName" class="form-control" value="${esc(me.name || '')}"></div>
    <div class="row g-2 mb-3">
      <div class="col-6"><label class="form-label" for="cpDept">Department</label>
        <select id="cpDept" class="form-select"><option value="">Choose</option>${opts(DEPTS, d => d)}</select></div>
      <div class="col-6"><label class="form-label" for="cpSem">Semester</label>
        <select id="cpSem" class="form-select"><option value="">Choose</option>${opts([1,2,3,4,5,6,7,8], n => n + ' semester')}</select></div>
    </div>
    <div><label class="form-label" for="cpRoll">Student ID / roll <span class="muted">(optional)</span></label>
      <input id="cpRoll" class="form-control" placeholder="e.g. 2301045"></div>`;
  openModal({
    title: 'Complete your profile', body, okText: 'Save and continue',
    onOk() {
      const name = val('cpName'), dept = val('cpDept'), sem = Number(val('cpSem')), roll = val('cpRoll');
      if (name.length < 3) return 'Please enter your full name (at least 3 characters).';
      if (!dept) return 'Please choose your department.';
      if (!sem) return 'Please choose your semester.';
      fdb.collection('users').doc(String(me.id)).set({ name, dept, sem, roll }, { merge: true })
        .then(() => location.reload())
        .catch(e => toast('Could not save: ' + e.message, 'error'));
      return '';
    }
  });
}
