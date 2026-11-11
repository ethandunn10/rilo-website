/* Rilo — the optional "help shape rilo?" survey.
   Plain JS, no build step. One question per screen. It lives in two places:
     • the homepage, right after someone joins the waitlist (we already
       have their email, so it's sent along hidden), and
     • /survey, for people who joined earlier (it asks for their email first).
   Nothing is sent until they tap "send" on the last screen. If they quit
   partway or tap "no thanks", nothing goes anywhere, and their waitlist
   signup still counts. */

(function () {
  'use strict';

  /* ───────────────── where the answers go ─────────────────
     The "Rilo Survey" Google Form (not the waitlist one). Posted the same
     way the waitlist is: mode:'no-cors', so the visitor never leaves the
     page and a completed request counts as sent. */
  const SURVEY_ACTION =
    'https://docs.google.com/forms/d/e/1FAIpQLSfq_Gvx62MZ_U31vLH5Ah53t_iCiMhM3yq1aHhWrvMdYoEUzQ/formResponse';

  /* each answer → its question on the form (matched by the question's
     wording on the form, not just its position). null = the form has no
     question for it, so that answer is shown on the site but not saved.
     To save it: add a short-answer question to the form, open a pre-filled
     link, and put its entry.NUMBER here. */
  const FIELDS = {
    email:    'entry.264385067',  // what email did you join with?
    age:      'entry.1844060317', // how old are you?
    screen:   'entry.2137789071', // how much screen time a day?
    app:      'entry.1525790648', // which app steals the most time?
    tried:    null,               // what have you already tried? (not on the form yet)
    stick:    'entry.426354316',  // what would make you stick with it?
    price:    'entry.987062364',  // would you get rilo pro?
    oneThing: 'entry.2020723063', // one thing rilo HAS to do
    chat:     'entry.1759449717', // down for a 10-min chat? yes / no
  };

  /* Three questions on the form are multiple choice, not short answer, and
     Google turns away any answer that isn't one of its choices word for
     word. So these map what the site shows → the form's exact wording.
     If you rename a choice on the form, rename it here too. */
  const FORM_CHOICES = {
    stick: {
      "strict blocking i can't skip": "Strict blocking I can't skip",
      'a buddy that checks in on me': 'A buddy that checks in on me',
      'ideas for what to do instead': 'Ideas for what to do instead',
      'friends keeping me accountable': 'Friends keeping me accountable',
      'rewards': 'Getting rewards (like Rilo skins) when you stay off your blocked apps',
      'unlocking rilo skins': 'Getting rewards (like Rilo skins) when you stay off your blocked apps',
    },
    price: {
      "yes, i'd pay myself": "Yes, I'd pay myself",
      'my parents would pay': 'My parents would pay',
      'only if i tried it free first': 'Only if I tried it free first',
      'probably not': 'Probably not',
    },
  };

  /* same deliberately loose check the waitlist uses */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ───────────────── the questions ─────────────────
     one: pick one, moves on by itself.
     many: pick any (or up to `max`), then "next". */
  const QUESTIONS = [
    { id: 'age', type: 'one', q: 'how old are you?',
      options: ['13–15', '16–18', '19–24', '25+', "i'm a parent of a teen"] },
    { id: 'screen', type: 'one', q: 'be honest… how much screen time do you have a day?',
      options: ['under 3h', '3–5h', '5–7h', '7h+', 'no idea'] },
    { id: 'app', type: 'many', q: 'which app steals the most of your time?',
      hint: 'pick any',
      options: ['tiktok', 'instagram', 'youtube', 'snapchat', 'games', 'other'] },
    { id: 'tried', type: 'many', q: 'what have you already tried to cut back?',
      hint: 'pick any',
      options: ['iphone screen time limits', 'opal', 'screenzen', 'one sec', 'nothing yet', 'other'],
      only: 'nothing yet' /* picking this clears the rest, and the other way round */ },
    { id: 'stick', type: 'many', max: 2, q: 'what would make you actually stick with a screen-time app?',
      hint: 'pick up to 2',
      options: ["strict blocking i can't skip", 'a buddy that checks in on me', 'ideas for what to do instead',
                'friends keeping me accountable', 'rewards', 'unlocking rilo skins'] },
    { id: 'price', type: 'one', q: 'rilo pro will be around $5/mo or $40/yr (not final). would you get it?',
      note: "pricing isn't final and may change before launch.",
      options: ["yes, i'd pay myself", 'my parents would pay', 'only if i tried it free first', 'probably not'] },
    { id: 'last', type: 'last' },
  ];

  const BACK_ICON =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const TICK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ───────────────── one survey, rendered into `root` ─────────────────
     opts.email   the email they just signed up with (homepage)
                  — leave it out and the first screen asks for it (/survey)
     opts.onExit  called when they tap back on the very first screen */
  function createSurvey(root, opts) {
    const steps = (opts.email ? [] : [{ id: 'email', type: 'email' }]).concat(QUESTIONS);
    const answers = { email: opts.email || '', oneThing: '', chat: false };
    let at = 0;
    let busy = false; /* true while a pick is animating out or a send is in flight */

    root.innerHTML =
      '<div class="sv" role="region" aria-label="help shape rilo">' +
        '<div class="sv__top">' +
          '<button type="button" class="sv__back" aria-label="back">' + BACK_ICON + '</button>' +
          '<div class="sv__bar" role="progressbar" aria-label="survey progress" aria-valuemin="0" aria-valuemax="100">' +
            '<span></span></div>' +
        '</div>' +
        '<div class="sv__screen"></div>' +
        '<button type="button" class="sv__skip">skip</button>' +
      '</div>';

    const card = root.querySelector('.sv');
    const back = card.querySelector('.sv__back');
    const bar = card.querySelector('.sv__bar');
    const fill = bar.querySelector('span');
    const screen = card.querySelector('.sv__screen');
    const skip = card.querySelector('.sv__skip');

    back.addEventListener('click', () => {
      if (busy) return;
      if (at === 0) { if (opts.onExit) opts.onExit(); return; }
      go(at - 1, 'back');
    });
    skip.addEventListener('click', () => {
      if (busy) return;
      const step = steps[at];
      if (step.type === 'last') {
        /* skipping the last screen still sends everything they did answer */
        answers.oneThing = '';
        answers.chat = false;
        send();
        return;
      }
      delete answers[step.id];
      go(at + 1, 'fwd');
    });

    function go(n, dir) {
      at = n;
      render(dir);
    }

    function setProgress(frac) {
      const pct = Math.round(frac * 100);
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(pct));
    }

    function render(dir) {
      const step = steps[at];
      busy = false;
      setProgress(at / steps.length);

      /* /survey's email screen has nowhere to go back to, and can't be skipped */
      back.hidden = at === 0 && !opts.onExit;
      skip.hidden = step.type === 'email';
      skip.textContent = 'skip';

      let html = '';
      if (step.type === 'email') html = emailHTML();
      else if (step.type === 'last') html = lastHTML();
      else html = questionHTML(step);

      screen.innerHTML = '<div class="sv__in' + (dir ? ' sv__in--' + dir : '') + '">' + html + '</div>';

      if (step.type === 'email') wireEmail();
      else if (step.type === 'last') wireLast();
      else wireQuestion(step);

      /* screen readers hear the new question; nobody gets scrolled around */
      const h = screen.querySelector('.sv__q');
      if (h && dir) h.focus({ preventScroll: true });

      /* if the card's top has slid up under the nav, bring it back */
      if (dir) {
        const top = card.getBoundingClientRect().top;
        if (top < 70) card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    }

    /* ── a pick-one or pick-many question ── */
    function questionHTML(step) {
      const picked = answers[step.id];
      const isOn = (o) => (step.type === 'many' ? (picked || []).includes(o) : picked === o);
      return (
        '<h3 class="sv__q" tabindex="-1">' + esc(step.q) + '</h3>' +
        (step.note ? '<p class="sv__note">' + esc(step.note) + '</p>' : '') +
        (step.hint ? '<p class="sv__hint" aria-live="polite">' + esc(step.hint) + '</p>' : '') +
        '<div class="sv__opts' + (step.type === 'many' ? ' sv__opts--many' : '') + '" role="group" aria-label="' + esc(step.q) + '">' +
        step.options.map((o) =>
          '<button type="button" class="sv__opt' + (isOn(o) ? ' is-on' : '') + '" aria-pressed="' + isOn(o) + '" data-v="' + esc(o) + '">' +
            (step.type === 'many' ? '<span class="sv__tick">' + TICK + '</span>' : '') +
            '<span>' + esc(o) + '</span>' +
          '</button>'
        ).join('') +
        '</div>' +
        (step.options.includes('other')
          ? '<input type="text" class="sv__other" maxlength="100" placeholder="type what other is…" ' +
            'aria-label="other: type it here"' + (isOn('other') ? '' : ' hidden') + '>'
          : '') +
        (step.max ? '<p class="sv__warn" aria-live="assertive"></p>' : '') +
        (step.type === 'many'
          ? '<button type="button" class="btn btn--lg sv__next"' + ((picked || []).length ? '' : ' disabled') + '>next</button>'
          : '')
      );
    }

    function wireQuestion(step) {
      const btns = [...screen.querySelectorAll('.sv__opt')];
      const next = screen.querySelector('.sv__next');
      const warn = screen.querySelector('.sv__warn');
      const other = screen.querySelector('.sv__other');
      const otherKey = step.id + 'Other';
      if (other) {
        other.value = answers[otherKey] || '';
        other.addEventListener('input', () => { answers[otherKey] = other.value; });
        /* "return" on the iPhone keyboard just closes it */
        other.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); other.blur(); } });
      }

      const paint = () => {
        const picked = step.type === 'many' ? answers[step.id] || [] : [answers[step.id]];
        btns.forEach((b) => {
          const on = picked.includes(b.dataset.v);
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        if (next) next.disabled = !(answers[step.id] || []).length;
        if (other) {
          const show = picked.includes('other');
          if (show && other.hidden) { other.hidden = false; other.focus({ preventScroll: true }); }
          if (!show) other.hidden = true;
        }
      };

      btns.forEach((b) => b.addEventListener('click', () => {
        if (busy) return;
        const v = b.dataset.v;

        if (step.type === 'one') {
          answers[step.id] = v;
          paint();
          busy = true; /* a beat to see the pick land, then on to the next one */
          setTimeout(() => go(at + 1, 'fwd'), reduced ? 80 : 260);
          return;
        }

        let picked = (answers[step.id] || []).slice();
        if (picked.includes(v)) {
          picked = picked.filter((x) => x !== v);
        } else {
          if (step.only) {
            picked = v === step.only ? [] : picked.filter((x) => x !== step.only);
          }
          if (step.max && picked.length >= step.max) {
            /* a third pick is blocked: say so, and give the button a little shake */
            warn.textContent = 'only 2. tap one of yours to swap it out.';
            b.classList.remove('is-nope');
            void b.offsetWidth;
            b.classList.add('is-nope');
            return;
          }
          picked.push(v);
        }
        if (warn) warn.textContent = '';
        if (picked.length) answers[step.id] = picked;
        else delete answers[step.id];
        paint();
      }));

      if (next) next.addEventListener('click', () => go(at + 1, 'fwd'));
    }

    /* ── /survey's first screen: which email did you join with? ── */
    function emailHTML() {
      return (
        '<h3 class="sv__q" tabindex="-1"><label for="sv-email">what email did you join with?</label></h3>' +
        '<form class="sv__email" novalidate>' +
          '<input id="sv-email" type="email" inputmode="email" autocomplete="email" ' +
                 'placeholder="you@email.com" aria-describedby="sv-email-err" required>' +
          '<p class="sv__err" id="sv-email-err" role="alert" hidden></p>' +
          '<button class="btn btn--lg sv__next" type="submit">next</button>' +
        '</form>'
      );
    }

    function wireEmail() {
      const form = screen.querySelector('form');
      const input = form.querySelector('input');
      const err = form.querySelector('.sv__err');
      input.value = answers.email;

      const fail = (msg) => {
        err.textContent = msg;
        err.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      };
      input.addEventListener('input', () => {
        err.hidden = true;
        input.removeAttribute('aria-invalid');
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email) return fail('pop in the email you joined the waitlist with.');
        if (!EMAIL.test(email)) return fail("that doesn't look like an email. mind checking it?");
        answers.email = email;
        input.blur(); /* drops the iPhone keyboard */
        go(at + 1, 'fwd');
        return undefined;
      });
    }

    /* ── the last screen: one thing + the chat checkbox + send ── */
    function lastHTML() {
      return (
        '<h3 class="sv__q" tabindex="-1"><label for="sv-one">what\'s one thing rilo HAS to do for you to open it every day?</label></h3>' +
        '<p class="sv__hint">optional</p>' +
        '<textarea id="sv-one" class="sv__text" rows="3" maxlength="500" placeholder="type it here…"></textarea>' +
        '<label class="sv__check">' +
          '<input type="checkbox" id="sv-chat">' +
          '<span class="sv__box">' + TICK + '</span>' +
          '<span>down for a quick 10-min chat about rilo?</span>' +
        '</label>' +
        '<p class="sv__err" role="alert" hidden></p>' +
        '<button type="button" class="btn btn--lg sv__next sv__send">send</button>'
      );
    }

    function wireLast() {
      const text = screen.querySelector('#sv-one');
      const chat = screen.querySelector('#sv-chat');
      text.value = answers.oneThing;
      chat.checked = answers.chat;
      text.addEventListener('input', () => { answers.oneThing = text.value; });
      chat.addEventListener('change', () => { answers.chat = chat.checked; });
      screen.querySelector('.sv__send').addEventListener('click', send);
    }

    /* ── the one and only submission ── */
    async function send() {
      if (busy) return;
      busy = true;

      const sendBtn = screen.querySelector('.sv__send');
      const err = screen.querySelector('.sv__err');
      if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'sending…'; }
      if (err) err.hidden = true;

      const join = (v) => (Array.isArray(v) ? v.join(', ') : (v || '').trim());
      /* "other" becomes "other: whatever they typed" (or just "other" if they typed nothing) */
      const withOther = (id) => join((answers[id] || []).map((v) => {
        const typed = (answers[id + 'Other'] || '').trim();
        return v === 'other' && typed ? 'other: ' + typed : v;
      }));
      const values = {
        email: answers.email,
        age: join(answers.age),
        screen: join(answers.screen),
        app: withOther('app'),
        tried: withOther('tried'),
        price: FORM_CHOICES.price[answers.price] || '',
        oneThing: join(answers.oneThing),
        chat: answers.chat ? 'Yes' : 'No',
      };

      const body = new URLSearchParams();
      Object.keys(values).forEach((k) => {
        /* blank answers are left out, which shows up as an empty cell */
        if (FIELDS[k] && values[k]) body.append(FIELDS[k], values[k]);
      });

      /* "what makes you stick" is a pick-one question on the form. One pick
         (or rewards + skins, which the form counts as one choice) goes in as
         the form's own choice; two different picks go in its "Other" box,
         joined with ", ". */
      const stick = answers.stick || [];
      const asChoices = [...new Set(stick.map((v) => FORM_CHOICES.stick[v]))];
      if (asChoices.length === 1) {
        body.append(FIELDS.stick, asChoices[0]);
      } else if (stick.length) {
        body.append(FIELDS.stick, '__other_option__');
        body.append(FIELDS.stick + '.other_option_response', join(stick));
      }

      try {
        await fetch(SURVEY_ACTION, { method: 'POST', mode: 'no-cors', body });
      } catch (e) {
        /* only a genuinely dead network lands here */
        busy = false;
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'send'; }
        if (err) { err.textContent = "couldn't send that just then. try again in a sec?"; err.hidden = false; }
        return;
      }
      done();
    }

    function done() {
      setProgress(1);
      back.hidden = true;
      skip.hidden = true;
      screen.innerHTML =
        '<div class="sv__in sv__in--fwd sv__end">' +
          '<img src="/img/rilo/original-proud.svg" alt="" width="208" height="182">' +
          '<h3 class="sv__q" tabindex="-1">thanks, you just helped build rilo 🐼</h3>' +
          (opts.homeLink ? '<a class="btn btn--lg btn--ghost" href="/">back to rilo.one</a>' : '') +
        '</div>';
      screen.querySelector('.sv__q').focus({ preventScroll: true });
    }

    render(null);
  }

  /* ───────────────── homepage: offer it after a signup ───────────────── */
  function wireHome() {
    const invite = document.getElementById('sv-invite');
    const box = document.getElementById('survey');
    if (!invite || !box) return;

    const bye = document.getElementById('sv-bye');
    let email = '';

    /* js/main.js fires this once the waitlist signup has gone through */
    document.addEventListener('waitlist:joined', (e) => { email = e.detail.email; });

    document.getElementById('sv-go').addEventListener('click', () => {
      invite.hidden = true;
      box.hidden = false;
      createSurvey(box, {
        email,
        onExit() {
          /* back from the first question: nothing sent, offer it again */
          box.hidden = true;
          box.innerHTML = '';
          invite.hidden = false;
        },
      });
      const top = box.getBoundingClientRect().top;
      if (top < 70 || top > window.innerHeight * 0.5) {
        box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    });

    document.getElementById('sv-no').addEventListener('click', () => {
      invite.hidden = true;
      bye.hidden = false;
    });
  }

  /* ───────────────── /survey: the standalone page ───────────────── */
  function wireStandalone() {
    const box = document.getElementById('survey-page');
    if (box) createSurvey(box, { homeLink: true });
  }

  wireHome();
  wireStandalone();
})();
