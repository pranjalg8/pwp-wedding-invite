# Paridhi & Pranjal: wedding invite site

A static, no-build website for GitHub Pages. 14 and 15 February 2027, Royal Pepper, Bawal.

Everything here is public. Never add keys, PINs, guest lists, phone numbers or bills.

## Edit the content

All text lives in `config.js`: functions per day, dress hints, stay options, themes and venue map links.

- **Exact map pins:** open each place in Google Maps, press Share, and paste the short link as `maps` (and the embed `src` as `embed`) in `config.js`. Until then the buttons use a Google Maps search.
- **Timings:** add `time: '7:00 pm'` to a function once confirmed. The calendar files are all-day events until then.
- **Photos:** drop images in `photos/` and list them in `photos/manifest.json` as `{ "photos": [{ "src": "photos/one.jpg", "alt": "…" }] }`. Keep each under about 300 KB.
- **Share preview:** `og.png` (1200 x 630). After the site URL is known, change `og:image` in `index.html` to the full URL, because WhatsApp needs an absolute link.

## Run locally

```bash
python3 -m http.server 8123
```

Open http://localhost:8123.

## RSVP

Each invited household gets a personal link from the planner (Guests > Replies). The form sends answers to the planner's `invite-rsvp` function. They wait in the planner until they are reviewed, and nothing reaches the guest list before that.

## Publish on GitHub Pages

1. Create a public repository named `pwp-wedding-invite` and push `main` to it.
2. In the repository, open **Settings > Pages**, choose **Deploy from a branch**, then `main` and `/ (root)`.
3. In the planner, open **Guests > Replies** and enter `https://pranjalg8.github.io/pwp-wedding-invite/` as the invite site address.

The share preview in `index.html` uses that address. If the repository gets another name, update `og:url` and `og:image` too.
