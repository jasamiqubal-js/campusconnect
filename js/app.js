/* app.js: boot the app. Show the login page if nobody is signed in, otherwise the app. */
document.addEventListener('input', e => { if (e.target.id === 'globalSearch') { App.query = e.target.value.trim(); Router.search(); } });

async function boot() {
  const user = await Auth.init();
  if (!user) { renderAuthPage('login'); return; }
  // Clear the demo data first: only real data from Firestore should show
  [NOTIFS, POSTS, NOTICES, EVENTS, LOST, RESOURCES, GROUPS, REPORTS].forEach(a => a.length = 0);
  renderShell();
  Router.start();
  initBot();
  try { await DB.loadAll(); refreshHeader(); Router.render(); if (Auth.user && !App.me().dept) completeProfile(); }
  catch (e) { console.error(e); toast('Could not load data: ' + e.message, 'error'); }
  try { DB.listen(); DB.listenNotifs(); DB.listenGroups(); listenChats(); listenUnread(); DB.listenPresence(); DB.heartbeat(); setInterval(() => DB.heartbeat(), 60000); } catch (e) { console.error(e); }
}
boot();
