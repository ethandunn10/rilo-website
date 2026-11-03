/* Rilo — marketing site
   Plain JS, no build step. Three jobs: the App Store switch, the
   skin ladder, and the fade-in-on-scroll. */

/* ──────────────────────────────────────────────────────────
   THE APP STORE SWITCH
   Rilo isn't on the App Store yet, so this stays null and the
   hero shows a plain "coming soon to iPhone" note.
   Put the real link here and that note becomes a working
   "Download on the App Store" button. Nothing else to change.
   ────────────────────────────────────────────────────────── */
const APP_STORE_URL = null;

/* ───────────────────────── the badge ───────────────────────── */

function wireAppStore() {
  const slot = document.getElementById('app-store-slot');
  if (!slot || !APP_STORE_URL) return; /* leave the "coming soon" note alone */

  const a = document.createElement('a');
  a.className = 'btn btn--lg';
  a.href = APP_STORE_URL;
  a.innerHTML =
    '<svg width="20" height="24" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">' +
    '<path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>' +
    '</svg><span>Download on the App Store</span>';
  slot.replaceWith(a);
}

/* ───────────────────────── the skin ladder ─────────────────────────
   The real ladder from the app (lib/levels.js SKIN_LADDER), ending
   with the samurai at level 100. */

const SKINS = [
  ['original',   'original',       1],
  ['proband',    'pro band',       2],
  ['bamboo',     'bamboo',         3],
  ['shades',     'shades',         4],
  ['beanie',     'beanie',         5],
  ['sakura',     'sakura',         6],
  ['studio',     'studio',         7],
  ['redpanda',   'red panda',      8],
  ['pinkpanda',  'pink panda',     9],
  ['gold',       'gold',          10],
  ['hoops',      'hoops',         15],
  ['dimsum',     'dim sum',       20],
  ['astro',      'astronaut',     25],
  ['cowboy',     'cowboy',        30],
  ['ninja',      'ninja',         35],
  ['chef',       'chef',          40],
  ['gamer',      'gamer',         45],
  ['ronin',      'ronin',         50],
  ['lunar',      'lunar',         60],
  ['bambooking', 'bamboo warrior',70],
  ['shadow',     'shadow',        80],
  ['sensei',     'sensei',        90],
  ['samurai',    'samurai',      100],
];

function buildSkins() {
  const row = document.getElementById('skins');
  if (!row) return;

  const html = SKINS.map(([id, name, level]) => {
    const max = level === 100 ? ' class="is-max"' : '';
    return (
      '<li' + max + '>' +
        '<img src="img/rilo/' + id + '-coach.svg" alt="' + name + ' rilo" ' +
             'width="208" height="182" loading="lazy" decoding="async">' +
        '<b>' + name + '</b>' +
        '<small>level ' + level + '</small>' +
      '</li>'
    );
  }).join('');

  row.innerHTML = html;
}

/* ───────────────────── fade / slide in on scroll ───────────────────── */

function wireReveals() {
  const items = document.querySelectorAll('.reveal');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* no observer, or motion is unwelcome: just show everything */
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target); /* once is enough */
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  items.forEach((el) => io.observe(el));
}

/* ───────────────────────── go ───────────────────────── */

wireAppStore();
buildSkins();
wireReveals();
