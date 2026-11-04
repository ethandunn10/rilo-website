/* Rilo — marketing site
   Plain JS, no build step. The App Store switch, the skin ladder,
   the waitlist, the themed world behind the page, and the scenes. */

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
  if (!APP_STORE_URL) return; /* leave the "join the waitlist" button alone */

  /* it's shipped — there's nothing to wait for any more */
  const section = document.getElementById('waitlist');
  if (section) section.hidden = true;
  document.querySelectorAll('.nav__wait').forEach((el) => el.remove());

  /* any copy that pointed at the waitlist needs its shipped wording */
  document.querySelectorAll('[data-shipped]').forEach((el) => {
    el.textContent = el.dataset.shipped;
  });

  if (!slot) return;

  const a = document.createElement('a');
  a.className = 'btn btn--lg';
  a.href = APP_STORE_URL;
  /* like every other link off the site: a new tab, so the page is
     still here when they come back */
  a.target = '_blank';
  a.rel = 'noopener';
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

/* ───────────────────────── the waitlist ─────────────────────────
   Posts straight to the "Rilo Waitlist" Google Form. mode:'no-cors'
   means the browser sends it but hands back an opaque response —
   the visitor never leaves the page, and we can't read a status
   code, so a completed request counts as sent. */

const WAITLIST_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSc6je1N1Jibhe63PQ7PoaXR2IuIu1c3qspHluXf7-0kaGcFuA/formResponse';
/* the form's one question: "Email" */
const WAITLIST_FIELD = 'entry.849613997';

/* deliberately loose — something@something.tld with no spaces.
   Anything stricter starts rejecting addresses that really work. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function wireWaitlist() {
  const form = document.getElementById('waitlist-form');
  if (!form) return;

  const input = document.getElementById('wait-email');
  const button = document.getElementById('wait-submit');
  const error = document.getElementById('wait-error');
  const done = document.getElementById('wait-done');

  const fail = (msg) => {
    error.textContent = msg;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  };

  const clear = () => {
    error.hidden = true;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  };

  input.addEventListener('input', clear);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();
    if (!email) return fail("looks like you left that blank — pop your email in.");
    if (!EMAIL.test(email)) return fail("that doesn't look like an email. mind checking it?");

    clear();
    button.disabled = true;
    button.textContent = 'sending…';

    const body = new URLSearchParams();
    body.append(WAITLIST_FIELD, email);

    try {
      await fetch(WAITLIST_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch (err) {
      /* only a genuinely dead network lands here */
      button.disabled = false;
      button.textContent = 'join the waitlist';
      return fail("couldn't reach the list just then. try again in a sec?");
    }

    form.hidden = true;
    done.hidden = false;
    return undefined;
  });
}

/* ───────────────────────── the world ─────────────────────────
   Rilo's app themes (lib/themes.js + components/Sky.jsx), rebuilt as
   page backgrounds. index.html has one .sky per theme with the sky
   gradient in CSS; this fills in what lives in each sky. */

const THEMES = {
  grass:  { color: '#A6DDF0', hills: ['#A8DCA0', '#4CC160', '#2E8B3E'], rilo: 'original-wave' },
  bamboo: { color: '#FFD7A3', hills: ['#A8DCA0', '#4CC160', '#2E8B3E'], rilo: 'bamboo-coach' },
  sakura: { color: '#FFD3E0', hills: ['#BFE3B0', '#7DCB7A', '#4E9E5A'], rilo: 'sakura-coach' },
  sunset: { color: '#FFB08A', hills: ['#B9C98E', '#6FA35E', '#3F7A4A'], rilo: 'cowboy-coach' },
  snow:   { color: '#C9E6FA', hills: ['#EEF5FA', '#8EADC4', '#62849E'], rilo: 'beanie-coach' },
};

const LEAF =
  '<svg width="22" height="12" viewBox="0 0 22 12"><path d="M1 6 C6 0 16 0 21 6 C16 12 6 12 1 6 Z" fill="#6DBA5E"/>' +
  '<path d="M3 6 L19 6" stroke="rgba(0,0,0,0.18)" stroke-width="1"/></svg>';
const PETAL =
  '<svg width="16" height="14" viewBox="0 0 14 12"><path d="M7 11 C2 8 0 3 3 1 C5 0 6 2 7 3 C8 2 9 0 11 1 C14 3 12 8 7 11 Z" ' +
  'fill="#FFB3CB" stroke="#E98AAB" stroke-width="0.8"/></svg>';
const FLAKE =
  '<svg width="13" height="13" viewBox="0 0 12 12"><g stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round">' +
  '<path d="M6 1 L6 11 M1.7 3.5 L10.3 8.5 M1.7 8.5 L10.3 3.5"/></g><circle cx="6" cy="6" r="1.4" fill="#BFE0F5"/></svg>';

const butterfly = (c) =>
  '<svg width="22" height="16" viewBox="0 0 22 16"><g>' +
  ['M11 8 C6 0 0 1 1 6 C2 10 7 10 11 8 Z', 'M11 8 C16 0 22 1 21 6 C20 10 15 10 11 8 Z',
   'M11 8 C7 12 4 15 6 16 C9 16 10 12 11 8 Z', 'M11 8 C15 12 18 15 16 16 C13 16 12 12 11 8 Z']
    .map((d) => '<path d="' + d + '" fill="' + c + '" stroke="#12301A" stroke-width="1.2"/>').join('') +
  '</g><path d="M11 4 L11 13" stroke="#12301A" stroke-width="1.6" stroke-linecap="round"/></svg>';

const sun = (style, core, glow) =>
  '<div class="w-sun' + (style.startsWith('top') ? ' w-sun--top' : '') + '" style="' + style + ';--core:' + core + ';--glow:' + glow + '"></div>';

/* one bamboo stalk: segments and two leaf sprigs, swaying from its base */
function bamboo(side, h, dur) {
  const top = 0, H = 800, x = 30, w = 12;
  const dir = side === 'left' ? 1 : -1;
  let nodes = '';
  for (let y = top + 60; y < H; y += 74) {
    nodes += '<rect x="' + (x - w / 2 - 1) + '" y="' + y + '" width="' + (w + 2) + '" height="3.5" rx="1.75" fill="#5FA552"/>';
  }
  const sprig = (y, a, b, c) =>
    '<path d="M' + x + ' ' + y + ' C' + (x + 14 * dir) + ' ' + (y - 16) + ' ' + (x + a * dir) + ' ' + (y - 20) + ' ' +
    (x + b * dir) + ' ' + (y - 16) + ' C' + (x + c * dir) + ' ' + (y - 6) + ' ' + (x + 14 * dir) + ' ' + y + ' ' + x + ' ' + y + ' Z" fill="#6DBA5E"/>';
  return (
    '<div class="w-bamboo" style="' + side + ':' + (side === 'left' ? '-6px' : '-6px') + ';height:' + h + '">' +
    '<svg class="w-sway" style="--d:' + dur + ';height:100%;width:auto;overflow:visible" viewBox="0 0 60 ' + H + '" preserveAspectRatio="xMidYMax meet">' +
    '<rect x="' + (x - w / 2) + '" y="' + top + '" width="' + w + '" height="' + H + '" rx="' + w / 2 + '" fill="#8CCB78"/>' +
    nodes + sprig(top + 120, 30, 40, 28) + sprig(top + 260, 26, 36, 26) + sprig(top + 430, 30, 40, 28) +
    '</svg></div>'
  );
}

function blossom(x, y, s) {
  const pts = [[0, -6], [5.7, -1.9], [3.5, 4.9], [-3.5, 4.9], [-5.7, -1.9]];
  return (
    '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
    pts.map(([dx, dy]) => '<circle cx="' + dx + '" cy="' + dy + '" r="4.6" fill="#FFC2D6" stroke="#E98AAB" stroke-width="0.9"/>').join('') +
    '<circle cx="0" cy="0" r="2.4" fill="#FF8FB4"/></g>'
  );
}

const BRANCH =
  '<div class="w-branch"><svg viewBox="-12 14 222 116" class="w-sway" style="--d:9s;transform-origin:0 40px">' +
  '<path d="M-10 36 C40 40 90 58 150 92 C170 104 186 110 200 108" fill="none" stroke="#7A4E3A" stroke-width="7" stroke-linecap="round"/>' +
  '<path d="M70 52 C84 34 100 28 116 30" fill="none" stroke="#7A4E3A" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M120 78 C128 92 128 106 122 118" fill="none" stroke="#7A4E3A" stroke-width="3.5" stroke-linecap="round"/>' +
  [[30, 34, 1.1], [58, 50, 1], [96, 30, 1.05], [118, 28, 0.9], [110, 70, 1.15], [150, 88, 1], [122, 116, 0.9], [186, 106, 1.05]]
    .map(([x, y, s]) => blossom(x, y, s)).join('') +
  '</svg></div>';

const BIRDS =
  '<svg class="w-birds" viewBox="40 100 260 90" fill="none" stroke="#7A4A3A" stroke-width="2.4" stroke-linecap="round">' +
  '<g><animateTransform attributeName="transform" type="translate" values="0 0;30 -6;0 0" dur="9s" repeatCount="indefinite"/>' +
  '<path d="M60 150 Q66 144 72 150 Q78 144 84 150"/><path d="M96 172 Q101 167 106 172 Q111 167 116 172"/></g>' +
  '<g><animateTransform attributeName="transform" type="translate" values="0 0;-24 4;0 0" dur="11s" repeatCount="indefinite"/>' +
  '<path d="M250 120 Q256 114 262 120 Q268 114 274 120"/></g></svg>';

function falling(svg, spots) {
  return spots.map(([left, delay, dur]) =>
    '<div class="w-fall" style="left:' + left + ';--delay:' + delay + ';--d:' + dur + '">' + svg + '</div>'
  ).join('');
}
const FALL = [['8%', '0s', '13s'], ['30%', '6s', '16s'], ['52%', '3s', '14s'], ['74%', '9s', '15s'], ['90%', '4.5s', '12s']];
const SNOWFALL = [['5%', '0s', '11s'], ['16%', '6s', '14s'], ['27%', '3s', '12s'], ['39%', '8.5s', '15s'], ['50%', '1.5s', '13s'],
  ['61%', '5s', '11s'], ['72%', '9s', '14s'], ['83%', '2.5s', '16s'], ['94%', '7s', '12s']];

const DECOR = {
  grass:
    sun('top:84px;right:7%;--s:clamp(70px,9vw,110px)', '#FFEDA3', 'rgba(255,248,216,.6)') +
    '<div class="w-fly" style="left:12%;top:36%">' + butterfly('#FFD43B') + '</div>' +
    '<div class="w-fly" style="left:70%;top:52%;--d:17s;--delay:3s;animation-direction:reverse">' + butterfly('#FFFFFF') + '</div>',
  bamboo:
    sun('top:84px;right:12%;--s:clamp(80px,10vw,120px)', '#FFE7A0', 'rgba(255,241,201,.6)') +
    bamboo('left', '82vh', '7s') + bamboo('right', '72vh', '8.5s') +
    falling(LEAF, FALL),
  sakura:
    sun('top:96px;left:8%;--s:clamp(56px,7vw,84px)', '#FFF0E2', 'rgba(255,246,240,.7)') +
    BRANCH + falling(PETAL, FALL),
  sunset:
    sun('bottom:calc(var(--hills) * .35);right:14%;--s:clamp(150px,19vw,250px)', '#FF8E5E', 'rgba(255,199,158,.55)') +
    BIRDS,
  snow:
    sun('top:90px;right:10%;--s:clamp(60px,7vw,90px)', '#FDFBEF', 'rgba(255,255,255,.7)') +
    falling(FLAKE, SNOWFALL),
};

function hills([a, b, c], rilo) {
  return (
    '<div class="w-hills">' +
    '<img class="w-rilo" src="img/rilo/' + rilo + '.svg" alt="" width="208" height="182">' +
    '<svg viewBox="0 0 1440 220" preserveAspectRatio="none">' +
    '<path fill="' + a + '" d="M0 96c180-46 340 24 520 22S900 58 1080 60s260 40 360 52v108H0z"/>' +
    '<path fill="' + b + '" d="M0 136c200-40 360 10 560 16s420-44 620-38 180 28 260 40v66H0z"/>' +
    '<path fill="' + c + '" d="M0 180c240-28 420 12 660 14s460-30 780-18v44H0z"/>' +
    '</svg></div>'
  );
}

function buildWorld() {
  document.querySelectorAll('.sky').forEach((sky) => {
    const id = sky.dataset.theme;
    const t = THEMES[id];
    sky.innerHTML = '<div class="deco" style="position:absolute;inset:0">' + DECOR[id] + '</div>' + hills(t.hills, t.rilo);
  });
}

let currentTheme = 'grass';
function setTheme(id) {
  if (!THEMES[id] || id === currentTheme) return;
  currentTheme = id;
  document.querySelectorAll('.sky').forEach((s) => s.classList.toggle('is-on', s.dataset.theme === id));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEMES[id].color;
}

/* ───────────────────── phones that cycle screens ─────────────────────
   A [data-cycle] block has tabs (button[data-i]) and screens (.scr[data-i]).
   While its scene is on screen it steps through them; tapping a tab jumps. */

const CYCLE_MS = 4200;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeCycle(root) {
  const tabs = [...root.querySelectorAll('.tab')];
  const scrs = [...root.querySelectorAll('.scr')];
  let i = 0;
  let timer = null;
  let running = false;

  root.style.setProperty('--cycle', CYCLE_MS + 'ms');

  function show(n) {
    i = (n + tabs.length) % tabs.length;
    tabs.forEach((t, k) => {
      t.classList.toggle('is-on', k === i);
      t.setAttribute('aria-pressed', String(k === i));
      t.classList.remove('is-timing');
    });
    scrs.forEach((s, k) => s.classList.toggle('is-on', k === i));
    if (running) {
      void tabs[i].offsetWidth; /* restart the progress line */
      tabs[i].classList.add('is-timing');
      clearTimeout(timer);
      timer = setTimeout(() => show(i + 1), CYCLE_MS);
    }
  }

  tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  show(0);

  return {
    start() {
      if (running || reduced) return;
      running = true;
      show(i);
    },
    stop() {
      running = false;
      clearTimeout(timer);
      tabs.forEach((t) => t.classList.remove('is-timing'));
    },
  };
}

/* ───────────────────────── the scenes ─────────────────────────
   Two watchers: one fades a scene's content in when it's well on
   screen (and back out when it leaves), the other picks the theme
   from whichever scene is crossing the middle of the screen. */

function wireScenes() {
  const scenes = [...document.querySelectorAll('.scene')];
  const cycles = new Map(scenes.map((s) => [s, [...s.querySelectorAll('[data-cycle]')].map(makeCycle)]));

  const dots = document.getElementById('dots');
  if (dots) {
    dots.innerHTML = scenes.map((s) =>
      '<a href="#' + s.id + '" aria-label="' + s.dataset.name + '" title="' + s.dataset.name + '"></a>'
    ).join('');
  }
  const markDot = (scene) => {
    if (!dots) return;
    [...dots.children].forEach((a, k) => a.classList.toggle('is-on', scenes[k] === scene));
  };

  if (!('IntersectionObserver' in window)) {
    scenes.forEach((s) => { s.classList.add('is-in'); cycles.get(s).forEach((c) => c.start()); });
    return;
  }

  const fade = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      e.target.classList.toggle('is-in', e.isIntersecting);
      cycles.get(e.target).forEach((c) => (e.isIntersecting ? c.start() : c.stop()));
    });
  }, { rootMargin: '-12% 0px -12% 0px' });

  const theme = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      setTheme(e.target.dataset.theme);
      markDot(e.target);
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  scenes.forEach((s) => { fade.observe(s); theme.observe(s); });
}

/* ───────────────────────── go ───────────────────────── */

wireAppStore();
buildSkins();
wireWaitlist();
buildWorld();
wireScenes();
