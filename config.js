// Everything on this page is public. Never put keys, PINs or guest data here.
window.INVITE = {
  // Wedding starts on this date (IST).
  start: '2027-02-14T00:00:00+05:30',

  // Map links are search links until the exact pins are pasted in. To use an exact pin, open the place in Google Maps,
  // press Share, and paste the short link as `maps` (and `embed` from Share > Embed a map, the src="" value).
  venues: {
    main: { name: 'Royal Pepper, Kathuwas', query: 'Royal Pepper Bawal Haryana', maps: '', embed: '' },
    shrikanth: { name: 'Shri Kanth Hotel, Bawal', query: 'Shri Kanth Hotel Bawal Haryana', maps: '', embed: '' },
    sai: { name: 'Hotel Sai, Bawal', query: 'Hotel Sai Bawal Haryana', maps: '', embed: '' },
  },

  // The built-in copy of the schedule. The live one comes from the planner (scheduleEndpoint below), where times are
  // added under Functions and shown here once "Show the time on the invite" is on.
  days: [
    {
      date: '2027-02-14',
      label: 'Sunday 14 February',
      functions: [
        { key: 'tilak', name: 'Tilak', part: 'Daytime', venue: 'main', blurb: 'A traditional ceremony that begins the celebrations.', dress: 'Festive Indian wear' },
        { key: 'mehndi', name: 'Mehndi', part: 'Daytime', venue: 'main', blurb: 'Henna and festivities with relatives and friends.', dress: 'Festive Indian wear' },
        { key: 'sagai', name: 'Sagai', part: 'Evening', venue: 'main', blurb: 'The ring ceremony, with a few games between the two families.', dress: 'Festive Indian wear' },
        { key: 'sangeet', name: 'Sangeet', part: 'Evening', venue: 'main', blurb: 'An evening of performances, music and dancing.', dress: 'Glitz & Glamour: indo-western, bling' },
      ],
    },
    {
      date: '2027-02-15',
      label: 'Monday 15 February',
      functions: [
        { key: 'haldi', name: 'Haldi', part: 'Daytime', venue: 'main', blurb: 'The haldi ceremony, in yellow and marigold.', dress: 'Yellow & marigold' },
        { key: 'shaadi', name: 'Baraat, Varmala & Mandap', part: 'Evening to midnight', venue: 'main', blurb: 'The baraat arrives, the garlands are exchanged and the wedding rituals take place.', dress: 'Wear whatever you love' },
      ],
    },
  ],

  stay: [
    { key: 'main', name: 'Royal Pepper', tag: 'At the venue', lift: true, note: 'Our main venue, with rooms on site for both nights. Check out on 16 February.' },
    { key: 'shrikanth', name: 'Shri Kanth Hotel', tag: '1 km · about 5 minutes', lift: false, note: 'Roomy family rooms, available 13, 14 and 15 February. There is no lift, so we will place elders elsewhere.' },
    { key: 'sai', name: 'Hotel Sai', tag: '10 km · about 11 minutes', lift: true, note: 'A comfortable hotel in Bawal for 14 and 15 February, with a lift. Check out on 16 February.' },
  ],

  themes: [
    { name: 'Haldi', when: '15 February, daytime', mood: 'Yellow & marigold', colours: ['#fff3b0', '#ffd84d', '#f6b73c', '#e8921a', '#c96f0a'], text: 'Yellow is the only theme. Think turmeric, mustard, lemon and marigold, and please skip other colours.' },
    { name: 'Sangeet', when: '14 February, evening', mood: 'Glitz & Glamour', colours: ['#1b1b1f', '#c9a24b', '#7a1f2e', '#e8d8b5', '#b8b8c2'], text: 'Indo-western with plenty of bling. Sequins, sparkle, and a dancing-ready outfit.' },
    { name: 'The wedding', when: '15 February, evening', mood: 'Wear what you love', colours: ['#7a1f2e', '#f3e7d3', '#c9a24b', '#fffaf2', '#a62e4d'], text: 'No dress code. The couple will be in deep red and ivory, so you are welcome to match or contrast.' },
  ],

  // Where the reply form sends answers. Replies are only accepted while they are switched open in the planner
  // (Guests > Replies), and they wait there until they are reviewed.
  rsvpEndpoint: 'https://qutawbofxpcqxkxrzebv.supabase.co/functions/v1/invite-rsvp',

  // The schedule (names, part of the day, times once switched on, venues, dress codes) comes from the planner. The
  // `days` above are the copy shown until it loads, or if it cannot be reached.
  scheduleEndpoint: 'https://qutawbofxpcqxkxrzebv.supabase.co/functions/v1/invite-schedule',
};
