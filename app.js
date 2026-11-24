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
  let start = new Date(C.start).getTime();
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
  // A timed event once the planner shows the time (India time, written as UTC), otherwise an all-day event.
  const utc = (date, hhmm, addDays = 0) => {
    const x = new Date(`${date}T${hhmm}:00+05:30`);
    x.setUTCDate(x.getUTCDate() + addDays);
    return x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  };
  const when = (e) => {
    if (!e.start) return [`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${nextDay(e.date)}`];
    const endAt = e.end || `${String(Math.min(23, +e.start.slice(0, 2) + 2)).padStart(2, '0')}${e.start.slice(2)}`;
    return [`DTSTART:${utc(e.date, e.start)}`, `DTEND:${utc(e.date, endAt, endAt <= e.start ? 1 : 0)}`];
  };
  const ics = (events) => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pranjal and Paridhi//Wedding//EN', 'CALSCALE:GREGORIAN'];
    events.forEach((e, i) => {
      lines.push(
        'BEGIN:VEVENT',
        `UID:pp-wedding-${e.key}-${i}@invite`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        ...when(e),
        `SUMMARY:${e.name} (Pranjal & Paridhi)`.replace(/([,;])/g, '\\$1'),
        `LOCATION:${venueOf(e).name}`.replace(/([,;])/g, '\\$1'),
        `DESCRIPTION:${e.time || e.part}. ${e.blurb}${e.start ? '' : ' Timing to be confirmed.'}`.replace(/([,;])/g, '\\$1'),
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
  // With a personal link, the page shows only what that household is invited to. 'wedding' is 15 Feb from the Baraat.
  let kind = null;
  const shownFns = (day) => (kind === 'wedding' && day.date === '2027-02-15' ? day.functions.filter((f) => f.key === 'shaadi') : day.functions);
  const dayEvents = (day) => shownFns(day).map((f) => ({ ...f, date: day.date }));
  // A function's venue is a key into config.js (the built-in copy) or a venue object from the planner.
  const venueOf = (f) => (typeof f.venue === 'string' ? C.venues[f.venue] : f.venue) || C.venues.main;

  // ---- schedule
  let activeDay = C.days[0];
  const list = $('#functions');
  const renderDay = () => {
    list.innerHTML = '';
    dayEvents(activeDay).forEach((f, i) => {
      const v = venueOf(f);
      const card = el('article', { class: 'card', style: `animation-delay:${i * 60}ms` });
      card.innerHTML = `<div class="part">${esc(f.time || f.part)}</div><h3>${esc(f.name)}</h3><p>${esc(f.blurb)}</p>
        <p class="dress"><b>Dress:</b> ${esc(f.dress)}</p>
        <div class="row"><a class="link" target="_blank" rel="noopener" href="${mapsUrl(v)}">${esc(v.name)}</a>
        <button class="link" type="button">Add to calendar</button></div>`;
      $('button', card).addEventListener('click', () => download(`${f.key}.ics`, ics([f])));
      list.appendChild(card);
    });
  };
  const pickDay = (t) => {
    document.querySelectorAll('.tab').forEach((x) => {
      x.classList.toggle('is-on', x === t);
      x.setAttribute('aria-selected', x === t ? 'true' : 'false');
    });
    activeDay = C.days.find((d) => d.date === t.dataset.day);
    renderDay();
  };
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => pickDay(t)));
  $('#day-ics').addEventListener('click', () => download(`wedding-${activeDay.date}.ics`, ics(dayEvents(activeDay))));
  renderDay();

  // The schedule lives in the planner. config.js keeps a copy, shown first and kept if the planner cannot be reached.
  if (C.scheduleEndpoint) {
    fetch(C.scheduleEndpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        let changed = false;
        for (const d of j.days || []) {
          const day = C.days.find((x) => x.date === d.date);
          if (day && Array.isArray(d.functions) && d.functions.length) {
            day.functions = d.functions;
            changed = true;
          }
        }
        if (changed) renderDay();
      })
      .catch(() => {});
  }

  // ---- stay
  $('#stay-grid').innerHTML = C.stay
    .map((s) => {
      const v = C.venues[s.key];
      return `<article class="stay"><h3>${esc(s.name)}</h3><div class="tag">${esc(s.tag)}</div><p>${esc(s.note)}</p>
        <div><span class="pill">${s.lift ? 'Lift available' : 'No lift'}</span></div>
        <div class="row"><a class="link" target="_blank" rel="noopener" href="${mapsUrl(v)}">Map</a><a class="link" target="_blank" rel="noopener" href="${dirUrl(v)}">Directions</a></div></article>`;
    })
    .join('');

  // ---- themes (a 15 Feb invite skips the Sangeet; wedding only skips the Haldi too)
  const renderThemes = () =>
    ($('#themes').innerHTML = C.themes
      .filter((t) => !((kind === 'day2' || kind === 'wedding') && t.name === 'Sangeet') && !(kind === 'wedding' && t.name === 'Haldi'))
      .map(
      (t) => `<article class="theme"><div class="swatches" aria-hidden="true">${t.colours.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
      <div class="body"><h3>${esc(t.name)}</h3><div class="when">${esc(t.when)}</div><div class="mood">${esc(t.mood)}</div><p>${esc(t.text)}</p></div></article>`,
    )
    .join(''));
  renderThemes();

  // Narrow the schedule, themes and form to this household's card.
  const personalise = (k) => {
    kind = k;
    const oneDay = k === 'day2' || k === 'wedding';
    const t14 = $('.tab[data-day="2027-02-14"]');
    t14.hidden = oneDay;
    pickDay(oneDay ? $('.tab[data-day="2027-02-15"]') : $('.tab.is-on') || t14);
    renderThemes();
    $('#legend-15').textContent = k === 'wedding' ? 'Baraat, Varmala, Mandap (from the evening)' : 'Haldi, Baraat, Varmala, Mandap';
    // Wedding-only guests are local and drive back: no rooms or stay options are offered to them.
    if (k === 'wedding') {
      $('section#stay').hidden = true;
      $('#nav-stay').hidden = true;
      document.querySelectorAll('.stay-fact').forEach((li) => (li.hidden = true));
    }
    if (oneDay) {
      $('#hero-date').textContent = '15 February 2027';
      $('#venue-when').innerHTML = k === 'wedding' ? '<span>Wedding</span> 15 February 2027, from the evening' : '<span>Wedding day</span> 15 February 2027';
      form.travel.placeholder = 'e.g. by car, afternoon of 15 Feb';
      start = new Date('2027-02-15T00:00:00+05:30').getTime();
      tick();
    }
  };

  // ---- gallery (photos/manifest.json: { "photos": [{ "src": "photos/one.jpg", "alt": "…" }] })
  const gal = $('#gallery');
  // The section stays hidden until there are photos to show.
  fetch('photos/manifest.json')
    .then((r) => r.json())
    .then((m) => {
      if (!m.photos || !m.photos.length) return;
      gal.innerHTML = m.photos.map((p) => `<figure><img loading="lazy" src="${esc(p.src)}" alt="${esc(p.alt || 'Pranjal and Paridhi')}" /></figure>`).join('');
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
  // Pranjal's friends get a plain room question instead of the arriving / leaving pickers (the planner says which).
  let askRoom = false;
  let roomNights = ['2027-02-14', '2027-02-15'];
  const dayFields = () => [...form.querySelectorAll('.day[data-day]')];
  const answerOf = (d) => (d.querySelector('input[type=radio]:checked') || {}).value;
  const sync = () => {
    dayFields().forEach((d) => d.classList.toggle('is-off', answerOf(d) === 'no'));
    if (!askRoom) return;
    const coming = dayFields().filter((d) => !d.hidden && answerOf(d) !== 'no');
    const room = $('#room');
    // Nobody to put up if they can't come on any day; otherwise wait until at least one day is answered.
    room.hidden = coming.length === 0 || !dayFields().some((d) => !d.hidden && answerOf(d));
    const need = (form.querySelector('input[name=room]:checked') || {}).value;
    $('#nights').hidden = need !== 'yes';
    const days = coming.map((d) => d.dataset.day).filter((d) => roomNights.includes(d));
    room.hidden = room.hidden || days.length === 0;
    const ticks = [...form.querySelectorAll('.tick[data-night]')];
    ticks.forEach((t) => {
      t.hidden = !days.includes(t.dataset.night);
      if (t.hidden) t.querySelector('input').checked = false;
    });
    // One possible night: saying yes means that night.
    const open = ticks.filter((t) => !t.hidden);
    if (open.length === 1 && need === 'yes') open[0].querySelector('input').checked = true;
    const alone = coming.length > 0 && coming.every((d) => +d.querySelector('input[type=number]').value === 1);
    $('#share-wrap').hidden = !alone;
  };
  form.addEventListener('change', sync);
  form.addEventListener('input', sync);

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
      askRoom = !!j.room;
      if (Array.isArray(j.nights)) roomNights = j.nights;
      if (j.kind) personalise(j.kind);
      $('#stay-dates').hidden = askRoom;
      $('#room').hidden = true;
      dayFields().forEach((d) => {
        d.hidden = !j.days.includes(d.dataset.day);
        const n = d.querySelector('input[type=number]');
        n.max = String(j.max);
        n.value = String(j.max);
      });
      sync();
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
    for (const d of dayFields()) {
      if (d.hidden) continue;
      const v = (d.querySelector('input[type=radio]:checked') || {}).value;
      if (!v) return say('Please answer for each day.', 'err');
      const people = v === 'no' ? 0 : +d.querySelector('input[type=number]').value || 0;
      if (v !== 'no' && people < 1) return say('Please tell us how many people are coming.', 'err');
      days[d.dataset.day] = { answer: v, people };
    }
    let room;
    if (askRoom && !$('#room').hidden) {
      const need = (form.querySelector('input[name=room]:checked') || {}).value;
      if (!need) return say('Please tell us if you need a room.', 'err');
      const nights = [...form.querySelectorAll('.tick[data-night]:not([hidden]) input:checked')].map((i) => i.value);
      if (need === 'yes' && !nights.length) return say('Please pick the nights you need a room.', 'err');
      room = { need, nights: need === 'yes' ? nights : [], share: need === 'yes' && !$('#share-wrap').hidden && form.share.checked };
    }
    const arrive = askRoom ? '' : form.arrive_on.value, leave = askRoom ? '' : form.leave_on.value;
    if ((arrive && !leave) || (!arrive && leave)) return say('Please pick both the arriving and the leaving day, or neither.', 'err');
    if (arrive && leave && leave <= arrive) return say('The leaving day has to be after the arriving day.', 'err');
    const body = {
      code: form.code.value.trim().toUpperCase(),
      name: form.name.value.trim(),
      days,
      arrive_on: arrive || null,
      leave_on: leave || null,
      room,
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
