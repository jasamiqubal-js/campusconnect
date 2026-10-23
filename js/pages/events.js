/* pages/events.js: campus events */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
Router.add('events', {
  title: 'Events',
  onSearch() { Router.render(); },
  render(view) {
    const q = App.query.toLowerCase(), list = EVENTS.filter(e => !q || (e.title + e.desc + e.location).toLowerCase().includes(q));
    view.innerHTML = `${pageHead('Events', 'Discover campus programs, seminars and competitions.', App.isStaff() ? '<button class="btn btn-primary" onclick="openEventForm()"><i class="fa-solid fa-plus me-1"></i>Create Event</button>' : '')}
    ${list.length ? `<div class="row g-3">${list.map(e => `<div class="col-md-6"><div class="cc-card h-100 mb-0">
      <div class="event-top" style="background:${esc(e.color)}"><i class="fa-solid fa-${esc(e.icon)}"></i></div>
      <div class="d-flex gap-3"><div class="date-box">${e.day}<small>${e.mon}</small></div><div class="min-w-0"><h6 class="mb-1">${esc(e.title)}</h6>
       <div class="muted small"><i class="fa-regular fa-clock me-1"></i>${esc(e.time)}</div><div class="muted small"><i class="fa-solid fa-location-dot me-1"></i>${esc(e.location)}</div><div class="muted small">Organizer: ${esc(e.organizer)}</div></div></div>
      <div class="d-flex gap-2 mt-3"><button class="btn btn-outline-primary btn-sm" onclick="eventDetails(${e.id})">View Details</button>
       ${e.registration ? `<button class="btn btn-sm ${e.registered ? 'btn-light border' : 'btn-primary'}" onclick="toggleInterest(${e.id})">${e.registered ? 'Interested ✓' : 'Register Interest'}</button>` : '<span class="muted small align-self-center">No registration needed</span>'}</div></div></div>`).join('')}</div>`
      : emptyState('calendar-days', 'No events found', 'Check back soon for upcoming programs.')}`;
  }
});
function eventDetails(id) {
  const e = EVENTS.find(x => x.id === id);
  openModal({ title: e.title, hideOk: true, body: `<p>${esc(e.desc)}</p><ul class="list-unstyled mb-0"><li><b>Date:</b> ${e.day} ${e.mon} 2026</li><li><b>Time:</b> ${esc(e.time)}</li><li><b>Location:</b> ${esc(e.location)}</li><li><b>Organizer:</b> ${esc(e.organizer)}</li><li><b>Registration:</b> ${e.registration ? 'Register your interest from the events page' : 'Not required'}</li><li><b>Interested students:</b> ${e.interested}</li></ul>` });
}
function toggleInterest(id) { const e = EVENTS.find(x => x.id === id); e.registered = !e.registered; e.interested += e.registered ? 1 : -1; DB.setInterest(e.id, App.me().id, e.registered); Router.render(); toast(e.registered ? 'Your interest is registered.' : 'Registration removed.'); }
function openEventForm() {
  if (!App.isStaff()) return toast('Only teachers and administrators can create events.', 'error');
  openModal({ title: 'Create event', okText: 'Create event', body: `
   <div class="mb-3"><label class="form-label">Title</label><input id="evTitle" class="form-control"></div>
   <div class="mb-3"><label class="form-label">Description</label><textarea id="evDesc" class="form-control" rows="3"></textarea></div>
   <div class="row g-2 mb-3"><div class="col"><label class="form-label">Date</label><input id="evDate" type="date" class="form-control"></div><div class="col"><label class="form-label">Time</label><input id="evTime" class="form-control" placeholder="10:00 AM - 01:00 PM"></div></div>
   <div class="row g-2 mb-3"><div class="col"><label class="form-label">Location</label><input id="evLoc" class="form-control"></div><div class="col"><label class="form-label">Organizer</label><input id="evOrg" class="form-control"></div></div>
   <div class="form-check"><input id="evReg" type="checkbox" class="form-check-input" checked><label class="form-check-label" for="evReg">Students can register interest</label></div>`,
    onOk() {
      if (val('evTitle').length < 5 || val('evDesc').length < 10) return 'Please add a title and description.';
      if (!val('evDate') || !val('evTime') || !val('evLoc') || !val('evOrg')) return 'Please fill in date, time, location and organizer.';
      const d = val('evDate').split('-');
      EVENTS.unshift({ id: newPostId(), day: d[2], mon: MONTHS[+d[1] - 1], title: val('evTitle'), desc: val('evDesc'), time: val('evTime'), location: val('evLoc'), organizer: val('evOrg'), registration: $('#evReg').checked, registered: false, interested: 0, color: '#2563EB', icon: 'calendar-check' });
      DB.saveEvent(EVENTS[0]); Router.render(); toast('Event created.');
    } });
}
