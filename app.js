(function () {
  const C = window.INVITE;
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---- maps
  const q = (v) => encodeURIComponent(v.query);
  const mapsUrl = (v) => v.maps || `https://www.google.com/maps/search/?api=1&query=${q(v)}`;
  const dirUrl = (v) => `https://www.google.com/maps/dir/?api=1&destination=${q(v)}`;
  const embedUrl = (v) => v.embed || `https://www.google.com/maps?q=${q(v)}&output=embed`;

  const main = C.venues.main;
  $('#map-main').href = mapsUrl(main);
  $('#dir-main').href = dirUrl(main);
  $('#map-frame').src = embedUrl(main);

  // ---- countdown
  const start = new Date(C.start).getTime();
  const tick = () => {
    const ms = Math.max(0, start - Date.now());
    $('#cd-d').textContent = Math.floor(ms / 864e5);
    $('#cd-h').textContent = Math.floor((ms % 864e5) / 36e5);
    $('#cd-m').textContent = Math.floor((ms % 36e5) / 6e4);
  };
  tick();
  setInterval(tick, 30000);

  // ---- nav shadow
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- calendar files (all-day events, since times are not fixed yet)
  const ymd = (d) => d.replace(/-/g, '');
  const nextDay = (d) => {
    const x = new Date(d + 'T00:00:00Z');
    x.setUTCDate(x.getUTCDate() + 1);
    return x.toISOString().slice(0, 10).replace(/-/g, '');
  };
  const ics = (events) => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Paridhi and Pranjal//Wedding//EN', 'CALSCALE:GREGORIAN'];
    events.forEach((e, i) => {
      lines.push(
        'BEGIN:VEVENT',
        `UID:pp-wedding-${e.key}-${i}@invite`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        `DTSTART;VALUE=DATE:${ymd(e.date)}`,
        `DTEND;VALUE=DATE:${nextDay(e.date)}`,
        `SUMMARY:${e.name} (Paridhi & Pranjal)`.replace(/([,;])/g, '\\$1'),
        `LOCATION:${C.venues[e.venue].name}`.replace(/([,;])/g, '\\$1'),
        `DESCRIPTION:${e.part}. ${e.blurb} Timing to be confirmed.`.replace(/([,;])/g, '\\$1'),
        'END:VEVENT',
      );
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };
  const download = (name, text) => {
    const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/calendar' })), download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const dayEvents = (day) => day.functions.map((f) => ({ ...f, date: day.date }));

  // ---- schedule
  let activeDay = C.days[0];
  const list = $('#functions');
  const renderDay = () => {
    list.innerHTML = '';
    dayEvents(activeDay).forEach((f, i) => {
      const v = C.venues[f.venue];
      const card = el('article', { class: 'card', style: `animation-delay:${i * 60}ms` });
      card.innerHTML = `<div class="part">${esc(f.time || f.part)}</div><h3>${esc(f.name)}</h3><p>${esc(f.blurb)}</p>
        <p class="dress"><b>Dress:</b> ${esc(f.dress)}</p>
        <div class="row"><a class="link" target="_blank" rel="noopener" href="${mapsUrl(v)}">${esc(v.name)}</a>
        <button class="link" type="button">Add to calendar</button></div>`;
      $('button', card).addEventListener('click', () => download(`${f.key}.ics`, ics([f])));
      list.appendChild(card);
    });
  };
  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => {
        x.classList.toggle('is-on', x === t);
        x.setAttribute('aria-selected', x === t ? 'true' : 'false');
      });
      activeDay = C.days.find((d) => d.date === t.dataset.day);
      renderDay();
    }),
  );
  $('#day-ics').addEventListener('click', () => download(`wedding-${activeDay.date}.ics`, ics(dayEvents(activeDay))));
  renderDay();

  // ---- stay
  $('#stay-grid').innerHTML = C.stay
    .map((s) => {
      const v = C.venues[s.key];
      return `<article class="stay"><h3>${esc(s.name)}</h3><div class="tag">${esc(s.tag)}</div><p>${esc(s.note)}</p>
        <div><span class="pill">${s.lift ? 'Lift available' : 'No lift'}</span></div>
        <div class="row"><a class="link" target="_blank" rel="noopener" href="${mapsUrl(v)}">Map</a><a class="link" target="_blank" rel="noopener" href="${dirUrl(v)}">Directions</a></div></article>`;
    })
    .join('');

  // ---- themes
  $('#themes').innerHTML = C.themes
    .map(
      (t) => `<article class="theme"><div class="swatches" aria-hidden="true">${t.colours.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
      <div class="body"><h3>${esc(t.name)}</h3><div class="when">${esc(t.when)}</div><div class="mood">${esc(t.mood)}</div><p>${esc(t.text)}</p></div></article>`,
    )
    .join('');

  // ---- gallery (photos/manifest.json: { "photos": [{ "src": "photos/one.jpg", "alt": "…" }] })
  const gal = $('#gallery');
  // The section stays hidden until there are photos to show.
  fetch('photos/manifest.json')
    .then((r) => r.json())
    .then((m) => {
      if (!m.photos || !m.photos.length) return;
      gal.innerHTML = m.photos.map((p) => `<figure><img loading="lazy" src="${esc(p.src)}" alt="${esc(p.alt || 'Paridhi and Pranjal')}" /></figure>`).join('');
      $('#photos').hidden = false;
      $('#nav-photos').hidden = false;
    })
    .catch(() => {});

  // ---- rsvp
  const form = $('#rsvp-form');
  const msg = $('#rsvp-msg');
  const params = new URLSearchParams(location.search);
  const code = (params.get('code') || params.get('c') || '').trim();
  if (code) {
    $('#code').value = code;
    $('#code-help').textContent = 'Found your personal link.';
  }
  const sync = () => {
    form.querySelectorAll('.day').forEach((d) => {
      const n = d.dataset.day === '2027-02-14' ? 'd14' : 'd15';
      const v = (form.querySelector(`input[name=${n}]:checked`) || {}).value;
      d.classList.toggle('is-off', v === 'no');
    });
  };
  form.addEventListener('change', sync);

  const say = (text, kind) => {
    msg.textContent = text;
    msg.className = 'form-msg ' + (kind || '');
  };
  if (!C.rsvpEndpoint) say('RSVP opens soon. We will send your personal link when it does.', '');

  const NOT_FOUND = 'We could not open RSVP for this code. Please check it against your invitation, or tell a family member.';

  // With a personal link, ask the planner which days this household is invited to and how many it can bring, and
  // show only those days. Replies may still be closed; then the form says so.
  const lookup = async (c) => {
    if (!C.rsvpEndpoint || !c) return;
    try {
      const r = await fetch(C.rsvpEndpoint + '?code=' + encodeURIComponent(c.toUpperCase()));
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return say(j.error || 'We could not check your link just now.', 'err');
      if (!j.open) return say(NOT_FOUND, 'err');
      if (!j.days.length) return say('We could not find your invitation days. Please tell a family member.', 'err');
      // Start from the whole household, so nobody is left out by accident. They can lower the number.
      form.querySelectorAll('.day').forEach((d) => {
        d.hidden = !j.days.includes(d.dataset.day);
        const n = d.querySelector('input[type=number]');
        n.max = String(j.max);
        n.value = String(j.max);
      });
      say('', '');
    } catch {
      say('We could not check your link just now. You can still send the form.', '');
    }
  };
  lookup(code);
  $('#code').addEventListener('change', (e) => lookup(e.target.value.trim()));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!C.rsvpEndpoint) return say('RSVP is not open yet. Please check back when we send your personal link.', 'err');
    if (!form.code.value.trim()) return say('Please enter your invite code.', 'err');
    if (!form.name.value.trim()) return say('Please tell us your name.', 'err');
    const days = {};
    for (const d of form.querySelectorAll('.day')) {
      if (d.hidden) continue;
      const v = (d.querySelector('input[type=radio]:checked') || {}).value;
      if (!v) return say('Please answer for each day.', 'err');
      const people = v === 'no' ? 0 : +d.querySelector('input[type=number]').value || 0;
      if (v !== 'no' && people < 1) return say('Please tell us how many people are coming.', 'err');
      days[d.dataset.day] = { answer: v, people };
    }
    const arrive = form.arrive_on.value, leave = form.leave_on.value;
    if ((arrive && !leave) || (!arrive && leave)) return say('Please pick both the arriving and the leaving day, or neither.', 'err');
    if (arrive && leave && leave <= arrive) return say('The leaving day has to be after the arriving day.', 'err');
    const body = {
      code: form.code.value.trim().toUpperCase(),
      name: form.name.value.trim(),
      days,
      arrive_on: arrive || null,
      leave_on: leave || null,
      travel: form.travel.value.trim(),
      note: form.note.value.trim(),
      website: form.website.value,
    };
    const btn = $('#rsvp-submit');
    btn.disabled = true;
    say('Sending…', '');
    try {
      const r = await fetch(C.rsvpEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return say(j.error || 'Something went wrong. Please try again, or tell a family member.', 'err');
      if (j.open === false) return say(NOT_FOUND, 'err');
      say('Thank you! Your RSVP is in. You can send it again to change your answer.', 'ok');
    } catch {
      say('We could not send your RSVP. Please check your connection and try again, or tell a family member.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
