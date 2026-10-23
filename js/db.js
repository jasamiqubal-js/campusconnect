const PRESENCE = new Map(); // uid -> last time seen (ms)
const FOLLOWING = new Set(); // ids of the people I follow
/* db.js: loads and saves posts, comments and reactions in Firestore.
   The rest of the app works on in-memory arrays (POSTS, USERS); this file keeps them in sync with the database. */
const DB = {
  serverTs: () => firebase.firestore.FieldValue.serverTimestamp(),

  fmt(ts) {
    return ts && ts.toDate ? ts.toDate().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
  },

  // Called once at startup: users, then posts with their comments and reactions
  async loadAll() {
    const me = Auth.user;

    const uSnap = await fdb.collection('users').get();
    uSnap.forEach(d => {
      const u = d.data();
      const rec = { id: d.id, name: u.name || 'Student', role: u.role || 'student', dept: u.dept || '', sem: u.sem || 0, status: u.status || 'Active',
        bio: u.bio || '', skills: u.skills || [], interests: u.interests || [], batch: u.batch || '',
        cover: d.id === me.uid ? (u.cover || null) : null, avatar: u.avatar || null };
      const old = USERS.find(x => x.id === d.id);
      if (old) Object.assign(old, rec); else USERS.push(rec);
    });
    if (!USERS.find(x => x.id === me.uid))
      USERS.push({ id: me.uid, name: me.displayName || 'Student', role: 'student', dept: '', sem: 0, status: 'Active' });

    // People I follow
    const fSnap = await fdb.collection('users').doc(me.uid).collection('following').get();
    FOLLOWING.clear();
    fSnap.docs.forEach(d => FOLLOWING.add(d.id));

    // My notifications (newest 50)
    const nfSnap = await fdb.collection('users').doc(me.uid).collection('notifications')
      .orderBy('createdAt', 'desc').limit(50).get();
    NOTIFS.length = 0;
    NOTIFS.push(...nfSnap.docs.map(d => { const x = d.data(); return { id: x.id, icon: x.icon, color: x.color, text: x.text, read: !!x.read, time: this.fmt(x.createdAt), postId: x.postId || null, groupId: x.groupId || null }; }));

    // Reports: only admins can read them. Other users get an empty list here.
    const isAdminUser = (USERS.find(x => x.id === me.uid) || {}).role === 'admin';
    REPORTS.length = 0;
    if (isAdminUser) {
      const rpSnap = await fdb.collection('reports').get();
      REPORTS.push(...rpSnap.docs.map(d => d.data()).sort((a, b) => b.id - a.id));
    }

    // Notices and events (written only by teachers and admins, see the rules)
    const nSnap = await fdb.collection('notices').get();
    NOTICES.length = 0;
    NOTICES.push(...nSnap.docs.map(d => d.data()).sort((a, b) => b.id - a.id));

    const eSnap = await fdb.collection('events').get();
    const evs = await Promise.all(eSnap.docs.map(async d => {
      const x = d.data();
      const iSnap = await d.ref.collection('interests').get();
      return { ...x, icon: x.icon || 'calendar-days', color: x.color || '#2563EB',
        interested: iSnap.size, registered: iSnap.docs.some(i => i.id === me.uid) };
    }));
    EVENTS.length = 0;
    EVENTS.push(...evs.sort((a, b) => b.id - a.id));

    // Lost & Found items (pending ones are hidden by the page itself, admins see all)
    const amAdmin = (USERS.find(x => x.id === me.uid) || {}).role === 'admin';
    const lostDocs = amAdmin
      ? (await fdb.collection('lost').get()).docs
      : [...(await fdb.collection('lost').where('approved', '==', true).get()).docs,
         ...(await fdb.collection('lost').where('uid', '==', me.uid).get()).docs];
    const lostById = new Map();
    lostDocs.forEach(d => lostById.set(d.id, d.data()));
    LOST.length = 0;
    LOST.push(...[...lostById.values()].sort((a, b) => b.id - a.id));

    // Notes & resources (small files are kept inside the document, big ones are links)
    const rSnap = await fdb.collection('resources').get();
    RESOURCES.length = 0;
    RESOURCES.push(...rSnap.docs.map(d => { const x = d.data(); return { ...x, url: x.file || '' }; })
      .sort((a, b) => b.id - a.id));

    // Groups: the first user to sign in creates the demo groups in Firestore (that user becomes their owner)
    let gSnap = await fdb.collection('groups').get();
    if (gSnap.empty) {
      await Promise.all(GROUPS.map(g => {
        const ref = fdb.collection('groups').doc(String(g.id));
        const writes = [ref.set({ id: g.id, name: g.name, kind: g.kind, icon: g.icon, color: g.color, desc: g.desc,
          members: g.members, ownerUid: me.uid, createdAt: this.serverTs() })];
        if (g.joined) writes.push(ref.collection('members').doc(me.uid).set({ joinedAt: this.serverTs() }));
        return Promise.all(writes);
      }));
      gSnap = await fdb.collection('groups').get();
    }
    const groupsLoaded = await Promise.all(gSnap.docs.map(async d => {
      const x = d.data();
      const mSnap = await d.ref.collection('members').get();
      return { id: x.id, name: x.name, kind: x.kind, icon: x.icon, color: x.color, desc: x.desc,
        members: x.members || 0, ownerUid: x.ownerUid, joined: mSnap.docs.some(m => m.id === me.uid) };
    }));
    groupsLoaded.sort((a, b) => a.id - b.id);
    GROUPS.length = 0;
    GROUPS.push(...groupsLoaded);

    const pSnap = await fdb.collection('posts').orderBy('createdAt', 'desc').limit(40).get();
    POSTS.length = 0; // the demo posts are replaced by the real ones
    const loaded = await Promise.all(pSnap.docs.map(async d => {
      const x = d.data();
      const p = { id: x.id, uid: x.uid, groupId: x.groupId || null, time: this.fmt(x.createdAt), text: x.text || '',
        file: x.file || null, image: x.image || null, reacts: { like: 0, love: 0, haha: 0, wow: 0 }, myReact: null, reactors: {}, comments: [], open: false };
      const [cs, rs] = await Promise.all([
        d.ref.collection('comments').orderBy('createdAt').get(),
        d.ref.collection('reactions').get()
      ]);
      cs.forEach(c => { const y = c.data(); p.comments.push({ cid: c.id, uid: y.uid, text: y.text, time: this.fmt(y.createdAt) }); });
      rs.forEach(r => { const t = r.data().type; if (REACTIONS[t]) { p.reacts[t]++; p.reactors[r.id] = t; if (r.id === me.uid) p.myReact = t; } });
      return p;
    }));
    loaded.sort((a, b) => b.id - a.id); // newest first (ids grow with time)
    POSTS.push(...loaded);
  },

  // Every write goes through here: on failure, tell the user instead of failing silently
  save(promise) {
    return promise.catch(err => { console.error(err); toast('Could not save: ' + (err.message || err.code), 'error'); });
  },

  // Saves the editable profile fields. role and status are not included, so users cannot change them (the rules block it too)
  saveProfile(u) {
    return this.save(fdb.collection('users').doc(u.id).set({
      name: u.name, dept: u.dept || '', sem: u.sem || 0, bio: u.bio || '',
      skills: u.skills || [], interests: u.interests || [], batch: u.batch || ''
    }, { merge: true }));
  },

  // Turns a picked photo into a small JPEG data URL (a Firestore document can hold about 1 MB)
  shrink(file, maxW = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = maxW, out = '';
        const draw = () => {
          const scale = Math.min(1, w / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL('image/jpeg', quality);
          if (out.length > 600000 && w > 200) { w = Math.round(w * 0.75); draw(); }
        };
        draw();
        resolve(out);
      };
      img.onerror = () => reject(new Error('Could not read this image.'));
      img.src = URL.createObjectURL(file);
    });
  },
  saveImage(uid, field, dataUrl) {
    return this.save(fdb.collection('users').doc(uid).set({ [field]: dataUrl }, { merge: true }));
  },

  // Admin actions
  setUserStatus(uid, status) {
    return this.save(fdb.collection('users').doc(uid).update({ status }));
  },
  deleteGroup(gid) {
    return this.save(fdb.collection('groups').doc(String(gid)).delete());
  },

  saveNotice(n) {
    return this.save(fdb.collection('notices').doc(String(n.id)).set({
      id: n.id, cat: n.cat, date: n.date, uid: n.uid, title: n.title, desc: n.desc, createdAt: this.serverTs()
    }));
  },
  saveEvent(e) {
    return this.save(fdb.collection('events').doc(String(e.id)).set({
      id: e.id, day: e.day, mon: e.mon, title: e.title, desc: e.desc, time: e.time, location: e.location,
      organizer: e.organizer, registration: !!e.registration, color: e.color || '#2563EB',
      icon: e.icon || 'calendar-days', interested: 0, createdAt: this.serverTs()
    }));
  },
  // Students mark interest: one doc per user, and the event's count changes with it
  setInterest(eid, uid, on) {
    const eref = fdb.collection('events').doc(String(eid));
    return this.save(Promise.all([
      on ? eref.collection('interests').doc(uid).set({ at: this.serverTs() })
         : eref.collection('interests').doc(uid).delete(),
      eref.update({ interested: firebase.firestore.FieldValue.increment(on ? 1 : -1) })
    ]));
  },

  // Photo is shrunk to a small JPEG and kept in the item document
  async saveLost(item, file) {
    if (file) {
      try { item.image = await this.shrink(file, 900, 0.7); }
      catch (e) { item.image = ''; toast('The photo could not be saved, the item was listed without it.', 'error'); }
    }
    return this.save(fdb.collection('lost').doc(String(item.id)).set({
      id: item.id, status: item.status, title: item.title, desc: item.desc, cat: item.cat, date: item.date,
      location: item.location, contact: item.contact, uid: item.uid, approved: !!item.approved,
      image: item.image || '', createdAt: this.serverTs()
    }));
  },
  createGroup(g) {
    const ref = fdb.collection('groups').doc(String(g.id));
    return this.save(Promise.all([
      ref.set({ id: g.id, name: g.name, desc: g.desc, kind: g.kind, icon: g.icon, color: g.color,
        members: g.members, ownerUid: g.ownerUid, createdAt: this.serverTs() }),
      ref.collection('members').doc(g.ownerUid).set({ joinedAt: this.serverTs() })
    ]));
  },
  // ===== Admin powers =====
  setUserRole(uid, role) {
    return this.save(fdb.collection('users').doc(uid).update({ role }));
  },
  updateNotice(id, f) {
    return this.save(fdb.collection('notices').doc(String(id)).update({ title: f.title, desc: f.desc }));
  },
  deleteNotice(id) {
    return this.save(fdb.collection('notices').doc(String(id)).delete());
  },
  updateEvent(id, f) {
    return this.save(fdb.collection('events').doc(String(id)).update({ title: f.title, desc: f.desc, location: f.location }));
  },
  deleteEvent(id) {
    return this.save(fdb.collection('events').doc(String(id)).delete());
  },
  updateGroup(id, f) {
    return this.save(fdb.collection('groups').doc(String(id)).update({ name: f.name, desc: f.desc }));
  },
  deleteResource(id) {
    return this.save(fdb.collection('resources').doc(String(id)).delete());
  },
  deleteLost(id) {
    return this.save(fdb.collection('lost').doc(String(id)).delete());
  },
  setLostApproved(id, approved) {
    return this.save(fdb.collection('lost').doc(String(id)).update({ approved }));
  },

  // Reads a small file as a data URL so it can be stored in the document
  readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read this file.'));
      reader.readAsDataURL(file);
    });
  },
  async saveResource(r, file) {
    if (file) {
      try { r.url = await this.readAsDataUrl(file); }
      catch (e) { r.url = ''; toast('The file could not be saved.', 'error'); }
    }
    return this.save(fdb.collection('resources').doc(String(r.id)).set({
      id: r.id, title: r.title, subject: r.subject, type: r.type, dept: r.dept, sem: r.sem, cat: r.cat,
      uid: r.uid, date: r.date, size: r.size, link: r.link || '', fileName: r.fileName || '',
      file: r.url || '', createdAt: this.serverTs()
    }));
  },

  saveReport(r) {
    return this.save(fdb.collection('reports').doc(String(r.id)).set({
      id: r.id, postId: r.postId, by: r.by, reason: r.reason, status: r.status, createdAt: this.serverTs()
    }));
  },
  setReportStatus(id, status) {
    return this.save(fdb.collection('reports').doc(String(id)).update({ status }));
  },
  // When a reported post is removed, all reports about it are marked resolved
  resolveReportsFor(postId) {
    return this.save(fdb.collection('reports').where('postId', '==', postId).get()
      .then(snap => Promise.all(snap.docs.map(d => d.ref.update({ status: 'Resolved' })))));
  },

  // Tell the post owner about a comment or reaction (nobody is notified about their own action)
  notifyOwner(post, text, icon, color) {
    if (!post || post.uid === Auth.user.uid) return;
    const id = newPostId();
    return this.save(fdb.collection('users').doc(post.uid).collection('notifications').doc(String(id)).set({
      id, icon, color, text, from: Auth.user.uid, read: false, postId: post.id, groupId: post.groupId || null, createdAt: this.serverTs()
    }));
  },
  // Notice published: every other user gets a notification document in the database (not only in memory).
  // Firestore allows 500 writes per batch, so users are handled in groups of 400.
  async notifyAll(text, icon, color) {
    try {
      const me = Auth.user;
      text = String(text).slice(0, 250); // the rules accept notification text under 300 characters
      const snap = await fdb.collection('users').get();
      const uids = snap.docs.map(d => d.id).filter(id => id !== me.uid);
      for (let i = 0; i < uids.length; i += 400) {
        const batch = fdb.batch();
        uids.slice(i, i + 400).forEach(uid => {
          const id = newPostId();
          batch.set(fdb.collection('users').doc(uid).collection('notifications').doc(String(id)), {
            id, icon, color, text, from: me.uid, read: false, postId: null, groupId: null, createdAt: this.serverTs()
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error(err);
      toast('Notice published, but the notifications could not be sent: ' + (err.message || err.code), 'error');
    }
  },
  markNotifRead(id) {
    return this.save(fdb.collection('users').doc(Auth.user.uid).collection('notifications').doc(String(id)).update({ read: true }));
  },
  markAllNotifsRead(ids) {
    const col = fdb.collection('users').doc(Auth.user.uid).collection('notifications');
    return Promise.all(ids.map(id => this.save(col.doc(String(id)).update({ read: true }))));
  },

  // Online now: each signed-in user sends a small "I am here" every minute
  heartbeat() {
    return this.save(fdb.collection('presence').doc(Auth.user.uid).set({ at: this.serverTs() }));
  },
  listenPresence() {
    fdb.collection('presence').onSnapshot(snap => {
      snap.docChanges().forEach(ch => {
        const at = ch.doc.data().at;
        if (ch.type === 'removed') PRESENCE.delete(ch.doc.id);
        else PRESENCE.set(ch.doc.id, at && at.toMillis ? at.toMillis() : Date.now());
      });
      if (typeof updatePulse === 'function') updatePulse();
    });
  },

  // ===== Live groups: new groups, member counts, and my joined state update without refreshing =====
  listenGroups() {
    const me = Auth.user;
    this._gWatched = this._gWatched || new Set();
    fdb.collection('groups').onSnapshot(snap => {
      snap.docChanges().forEach(ch => {
        const x = ch.doc.data();
        if (ch.type === 'removed') {
          const i = GROUPS.findIndex(g => g.id === x.id);
          if (i >= 0) GROUPS.splice(i, 1);
          return;
        }
        let g = GROUPS.find(q => q.id === x.id);
        if (!g) {
          g = { id: x.id, joined: false };
          GROUPS.push(g);
          GROUPS.sort((a, b) => a.id - b.id);
        }
        Object.assign(g, { name: x.name, kind: x.kind, icon: x.icon, color: x.color, desc: x.desc,
          members: x.members || 0, ownerUid: x.ownerUid });

        // Watch whether I am a member of this group
        if (!this._gWatched.has(x.id)) {
          this._gWatched.add(x.id);
          ch.doc.ref.collection('members').onSnapshot(m => {
            const gg = GROUPS.find(q => q.id === x.id);
            if (!gg) return;
            gg.memberUids = m.docs.map(d => d.id);
            const joined = m.docs.some(d => d.id === me.uid);
            const changed = gg.joined !== joined;
            gg.joined = joined;
            if (Router.current.key === 'groups') Router.render();
            if (changed) refreshSide();
          });
        }
      });
      if (snap.docChanges().length) {
        refreshSide();
        if (Router.current.key === 'groups') Router.render();
      }
    });
  },

  // ===== Real-time updates: new posts, comments, reactions and notifications appear without refreshing =====
  isTyping(id) {
    return !!document.getElementById('cm' + id)?.value.trim();
  },

  listen() {
    const me = Auth.user;
    this._watched = this._watched || new Set();
    fdb.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot(snap => {
      snap.docChanges().forEach(ch => {
        const x = ch.doc.data();
        if (ch.type === 'removed') {
          const i = POSTS.findIndex(p => p.id === x.id);
          if (i >= 0) POSTS.splice(i, 1);
          $(`[data-post="${x.id}"]`)?.remove();
          return;
        }
        let p = POSTS.find(q => q.id === x.id);
        if (!p) {
          p = { id: x.id, uid: x.uid, groupId: x.groupId || null, time: this.fmt(x.createdAt), text: x.text || '',
            file: x.file || null, image: x.image || null, reacts: { like: 0, love: 0, haha: 0, wow: 0 }, myReact: null,
            reactors: {}, comments: [], open: false };
          POSTS.unshift(p);
          this.insertCard(p);
        } else if (ch.type === 'modified') {
          p.text = x.text || ''; p.image = x.image || null;
          if (!this.isTyping(p.id)) redrawPost(p.id);
        }
        this.watch(ch.doc.ref, p, me.uid);
      });
    });
  },

  // Puts a brand-new post at the top of the page that is showing it
  insertCard(p) {
    const feed = $('#feed');
    if (!feed) return;
    const show = (Router.current.key === 'home' && !p.groupId)
      || (Router.current.key === 'groups' && String(Router.current.param) === String(p.groupId));
    if (!show) return;
    feed.querySelector('.empty-state')?.closest('.cc-card')?.remove();
    feed.insertAdjacentHTML('afterbegin', postCard(p));
  },

  // Listens to one post's comments and reactions. The card is redrawn only when something really changed.
  watch(ref, p, meUid) {
    if (this._watched.has(p.id)) return;
    this._watched.add(p.id);
    p._csig = JSON.stringify(p.comments);
    p._rsig = JSON.stringify([p.reacts, p.reactors]);

    ref.collection('comments').orderBy('createdAt').onSnapshot(s => {
      const list = s.docs.map(d => { const y = d.data(); return { cid: d.id, uid: y.uid, text: y.text, time: this.fmt(y.createdAt) }; });
      const sig = JSON.stringify(list);
      if (sig === p._csig) return;
      p._csig = sig; p.comments = list;
      if (!this.isTyping(p.id)) redrawPost(p.id);
    });

    ref.collection('reactions').onSnapshot(s => {
      const reacts = { like: 0, love: 0, haha: 0, wow: 0 }, reactors = {};
      let mine = null;
      s.docs.forEach(d => {
        const t = d.data().type;
        if (REACTIONS[t]) { reacts[t]++; reactors[d.id] = t; if (d.id === meUid) mine = t; }
      });
      const sig = JSON.stringify([reacts, reactors]);
      if (sig === p._rsig) return;
      p._rsig = sig; p.reacts = reacts; p.reactors = reactors; p.myReact = mine;
      if (!this.isTyping(p.id)) redrawPost(p.id);
    });
  },

  // Live notifications: the bell updates at once, and a short message pops up for each new one
  listenNotifs() {
    const me = Auth.user;
    let ready = false;
    fdb.collection('users').doc(me.uid).collection('notifications')
      .orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
        snap.docChanges().forEach(ch => {
          const x = ch.doc.data();
          const ex = NOTIFS.find(n => n.id === x.id);
          if (ch.type === 'added' && !ex) {
            NOTIFS.unshift({ id: x.id, icon: x.icon, color: x.color, text: x.text, read: !!x.read,
              time: this.fmt(x.createdAt), postId: x.postId || null, groupId: x.groupId || null });
            if (ready) toast(x.text, 'info');
          } else if (ex) {
            ex.read = !!x.read;
          }
        });
        if (snap.docChanges().length) {
          updateBadges();
          if (Router.current.key === 'notifications') Router.render();
        }
        ready = true;
      });
  },

  removeMember(gid, uid) {
    const gref = fdb.collection('groups').doc(String(gid));
    return this.save(Promise.all([
      gref.collection('members').doc(String(uid)).delete(),
      gref.update({ members: firebase.firestore.FieldValue.increment(-1) })
    ]));
  },
  addMember(gid, uid) {
    const gref = fdb.collection('groups').doc(String(gid));
    return this.save(Promise.all([
      gref.collection('members').doc(uid).set({ joinedAt: this.serverTs(), addedBy: Auth.user.uid }),
      gref.update({ members: firebase.firestore.FieldValue.increment(1) })
    ]));
  },

  // Follow: saved on both sides (my "following" list and their "followers" list), and they get a notification
  follow(uid) {
    const me = Auth.user.uid;
    FOLLOWING.add(String(uid));
    const batch = fdb.batch();
    batch.set(fdb.collection('users').doc(me).collection('following').doc(String(uid)), { since: this.serverTs() });
    batch.set(fdb.collection('users').doc(String(uid)).collection('followers').doc(me), { since: this.serverTs() });
    const id = newPostId();
    const name = App.me().name;
    batch.set(fdb.collection('users').doc(String(uid)).collection('notifications').doc(String(id)),
      { id, icon: 'user-plus', color: '#2563EB', text: `${name} started following you`, from: me, read: false,
        postId: null, groupId: null, createdAt: this.serverTs() });
    return this.save(batch.commit());
  },
  unfollow(uid) {
    const me = Auth.user.uid;
    FOLLOWING.delete(String(uid));
    const batch = fdb.batch();
    batch.delete(fdb.collection('users').doc(me).collection('following').doc(String(uid)));
    batch.delete(fdb.collection('users').doc(String(uid)).collection('followers').doc(me));
    return this.save(batch.commit());
  },

  // When I post, everyone who follows me gets a notification
  async notifyFollowers(post) {
    const me = Auth.user.uid, name = App.me().name;
    const snap = await fdb.collection('users').doc(me).collection('followers').get();
    const chunks = [];
    snap.docs.map(d => d.id).forEach((uid, i, all) => { if (i % 400 === 0) chunks.push(all.slice(i, i + 400)); });
    for (const list of chunks) {
      const batch = fdb.batch();
      list.forEach(uid => {
        const id = newPostId();
        batch.set(fdb.collection('users').doc(uid).collection('notifications').doc(String(id)),
          { id, icon: 'pen', color: '#2563EB', text: `${name} shared a new post`, from: me, read: false,
            postId: post.id, groupId: post.groupId || null, createdAt: this.serverTs() });
      });
      await this.save(batch.commit());
    }
  },

  // Join or leave a group: the membership doc and the member count change together
  setGroupMembership(gid, uid, joined) {
    const gref = fdb.collection('groups').doc(String(gid));
    return this.save(Promise.all([
      joined ? gref.collection('members').doc(uid).set({ joinedAt: this.serverTs() })
             : gref.collection('members').doc(uid).delete(),
      gref.update({ members: firebase.firestore.FieldValue.increment(joined ? 1 : -1) })
    ]));
  },

  // Images and files are not uploaded yet (needs Firebase Storage), so only the text and file name are saved
  // Shrinks the chosen photo (if any) into the post, then saves the post
  async saveNewPost(p, imgFile) {
    if (imgFile) {
      try { p.image = await this.shrink(imgFile, 900, 0.7); }
      catch (e) { p.image = null; toast('The photo could not be saved, the text was posted.', 'error'); }
    } else {
      p.image = null;
    }
    return this.createPost(p);
  },
  createPost(p) {
    return this.save(fdb.collection('posts').doc(String(p.id)).set({
      id: p.id, uid: p.uid, groupId: p.groupId || null, text: p.text, file: p.file || null, image: p.image || null, createdAt: this.serverTs()
    }));
  },
  updatePost(id, text) {
    return this.save(fdb.collection('posts').doc(String(id)).update({ text }));
  },
  deletePost(id) {
    return this.save(fdb.collection('posts').doc(String(id)).delete());
  },
  addComment(postId, uid, text, cid) {
    return this.save(fdb.collection('posts').doc(String(postId)).collection('comments').doc(String(cid))
      .set({ uid, text, createdAt: this.serverTs() }));
  },
  updateComment(postId, cid, text) {
    return this.save(fdb.collection('posts').doc(String(postId)).collection('comments').doc(String(cid)).update({ text }));
  },
  deleteComment(postId, cid) {
    return this.save(fdb.collection('posts').doc(String(postId)).collection('comments').doc(String(cid)).delete());
  },
  // One reaction per user: the doc id is the user's id, so setting it again just replaces the old one
  setReaction(postId, uid, type) {
    const ref = fdb.collection('posts').doc(String(postId)).collection('reactions').doc(uid);
    return this.save(type ? ref.set({ type }) : ref.delete());
  }
};
