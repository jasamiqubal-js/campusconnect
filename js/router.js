/* router.js: tiny hash router. #/qa/3 -> route "qa" with param "3" */
const Router = {
  routes: {}, current: { key: 'home', param: null }, lastKey: null,
  add(key, def) { this.routes[key] = def; },
  start() { addEventListener('hashchange', () => this.render()); this.render(); },
  render() {
    const [, k = 'home', param] = location.hash.slice(1).split('/');
    const key = this.routes[k] ? k : 'home', def = this.routes[key];
    this.current = { key, def, param: param ? decodeURIComponent(param) : null };
    if (this.lastKey !== key) { App.query = ''; const s = $('#globalSearch'); if (s) s.value = ''; window.scrollTo(0, 0); }
    this.lastKey = key;
    setActiveNav(key);
    document.title = def.title + ' • CampusConnect';
    $('.cc-wrap').classList.toggle('no-right', !def.right);
    $('#rightCol').hidden = !def.right; if (def.right) renderRight();
    const view = $('#view');
    if (def.admin && App.role !== 'admin') view.innerHTML = emptyState('lock', 'Access restricted', 'Only administrators can open the Admin Panel.');
    else def.render(view, this.current.param);
    bootstrap.Offcanvas.getInstance($('#mobileMenu'))?.hide();
    if (typeof updateChatBadge === 'function') updateChatBadge();
  },
  search() { const d = this.current.def; d.onSearch ? d.onSearch(App.query) : this.render(); }
};
