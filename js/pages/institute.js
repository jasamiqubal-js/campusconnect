/* pages/institute.js: Institute information page.
   EDIT ONLY THE INSTITUTE OBJECT BELOW. Everything on the page is generated from it. */
const INSTITUTE = {
  name: 'Moulvibazar Government Polytechnic Institute',
  shortName: 'Moulvibazar Polytechnic',
  tagline: 'A government polytechnic in the heart of Sylhet division, offering diploma-level engineering education',
  photo: 'images/institute.jpg',          // add your campus photo here
  established: '2010',
  affiliation: 'Directorate of Technical Education, Govt. of Bangladesh',
  students: '1,000+',                     // official site says "more than one thousand"; another source says 3,200, please confirm
  teachers: '',                           // not confirmed yet; leave empty to hide
  address: 'Matarcapon, Moulvibazar Sadar, Moulvibazar, Sylhet Division, Bangladesh',
  phone: '01313910200 (Cell), 02998818215 (Tel)',
  email: 'moulvibazarpolytechnic@gmail.com',
  website: 'https://mpi.moulvibazar.gov.bd',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Moulvibazar+Government+Polytechnic+Institute',
  about: [
    'Moulvibazar Government Polytechnic Institute was established in 2010 as a residential public polytechnic. It is run directly under the supervision of the Directorate of Technical Education, which is part of the Ministry of Education.',
    'The institute is located on about four acres in Matarcapon, a few kilometres east of Chowmuhani, the main hub of Moulvibazar town. Its campus is quiet and surrounded by greenery, and it is well connected by road to nearby districts and to the Dhaka–Sylhet highway.',
    'Students study a four-year Diploma in Engineering across four departments, supported by well-equipped laboratories. A second-shift programme is also run for additional students.'
  ],
  departments: ['Computer Technology', 'Electronics Technology', 'Food Technology', 'Refrigeration & Air Conditioning Technology'],
  highlights: [
    { icon: 'graduation-cap', title: 'Four-Year Diploma', text: 'A full diploma in engineering across four departments.' },
    { icon: 'flask', title: 'Laboratories', text: 'Practical training in well-equipped laboratories.' },
    { icon: 'road', title: 'Easy to Reach', text: 'Located in Moulvibazar town and well connected by road.' }
  ],
  facilities: ['Well-equipped laboratories', 'Second-shift programme'],
  leadership: []                          // principal changes over time; add the current name when confirmed
};

// Shown in place of the photo when images/institute.jpg is missing
const INST_FALLBACK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#14437F"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" fill="#fff" font-size="64" font-family="sans-serif">🎓</text></svg>');

// If the photo file is missing, swap in the placeholder instead of showing a broken image
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG' && e.target.dataset.fallback === 'institute') e.target.src = INST_FALLBACK;
}, true);

const instInfo = (icon, label, value) => value ? `
  <li class="d-flex gap-3 py-2 border-bottom"><span class="g-tile" style="background:#2563EB;width:36px;height:36px"><i class="fa-solid fa-${esc(icon)}"></i></span>
  <div class="min-w-0"><div class="muted small">${esc(label)}</div><div class="fw-semibold text-break">${esc(value)}</div></div></li>` : '';

Router.add('institute', {
  title: 'Institute Info',
  render(view) {
    const I = INSTITUTE;
    view.innerHTML = `
    <section class="cc-card p-0 overflow-hidden mb-3">
      <img src="${esc(I.photo)}" data-fallback="institute" class="w-100" alt="${esc(I.name)} campus" style="max-height:320px;object-fit:cover">
      <div class="p-3 p-md-4">
        <h3 class="mb-1" style="color:var(--navy)">${esc(I.name)}</h3>
        <p class="muted mb-3">${esc(I.tagline)}</p>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge bg-primary-subtle text-primary-emphasis"><i class="fa-solid fa-calendar me-1"></i>Established ${esc(I.established)}</span>
          <span class="badge bg-primary-subtle text-primary-emphasis"><i class="fa-solid fa-certificate me-1"></i>${esc(I.affiliation)}</span>
          <span class="badge bg-primary-subtle text-primary-emphasis"><i class="fa-solid fa-users me-1"></i>${esc(I.students)} students</span>
          ${I.teachers ? `<span class="badge bg-primary-subtle text-primary-emphasis"><i class="fa-solid fa-chalkboard-user me-1"></i>${esc(I.teachers)} teachers</span>` : ''}
        </div>
      </div>
    </section>

    <div class="row g-3">
      <div class="col-lg-8">
        <section class="cc-card">
          <h5 class="mb-3">About us</h5>
          ${I.about.map(p => `<p>${esc(p)}</p>`).join('')}
        </section>

        <section class="cc-card">
          <h5 class="mb-3">Why ${esc(I.shortName)}?</h5>
          <div class="row g-3">${I.highlights.map(h => `
            <div class="col-md-4"><div class="h-100 p-3 rounded-3" style="background:var(--surface-2, #f1f5f9)">
              <i class="fa-solid fa-${esc(h.icon)} fs-4 mb-2 d-block" style="color:var(--blue, #2563EB)"></i>
              <h6>${esc(h.title)}</h6><p class="muted small mb-0">${esc(h.text)}</p></div></div>`).join('')}
          </div>
        </section>

        <section class="cc-card">
          <h5 class="mb-3">Departments</h5>
          <div class="d-flex flex-wrap gap-2">${I.departments.map(d => `<span class="tagx">${esc(d)}</span>`).join('')}</div>
        </section>

        <section class="cc-card">
          <h5 class="mb-3">Facilities</h5>
          <div class="d-flex flex-wrap gap-2">${I.facilities.map(f => `<span class="tagx">${esc(f)}</span>`).join('')}</div>
        </section>

        ${I.leadership.length ? `<section class="cc-card"><h5 class="mb-3">Leadership</h5><div class="row g-2">${I.leadership.map(l => `<div class="col-sm-6"><div class="muted small">${esc(l.role)}</div><div class="fw-semibold">${esc(l.name)}</div></div>`).join('')}</div></section>` : ''}
      </div>

      <div class="col-lg-4">
        <section class="cc-card">
          <h5 class="mb-2">Contact & location</h5>
          <ul class="list-unstyled mb-3">
            ${instInfo('location-dot', 'Address', I.address)}
            ${instInfo('phone', 'Phone', I.phone)}
            ${instInfo('envelope', 'Email', I.email)}
            ${instInfo('globe', 'Website', I.website)}
          </ul>
          <div class="d-grid gap-2">
            ${I.mapUrl ? `<a class="btn btn-outline-primary" href="${esc(I.mapUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-map-location-dot me-1"></i>Open in Maps</a>` : ''}
            ${I.website ? `<a class="btn btn-primary" href="${esc(I.website)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i>Visit website</a>` : ''}
          </div>
        </section>
      </div>
    </div>`;
  }
});
