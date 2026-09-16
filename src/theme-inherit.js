/* ============================================================
   Bundle Configurator — theme inheritance
   "Copy the store's style" without copying the store's CSS.

   Reading a merchant's stylesheet is a trap: selectors collide, !important
   wars start, and a theme update silently breaks the widget. So instead of
   importing rules we read *computed values* off a handful of real elements
   already on the page, reduce them to ~8 numbers and strings, and feed those
   back in as our own tokens. The configurator keeps its own DOM and its own
   cascade; it just wears the store's colours, type and corner radius.

   API
   ---
   BundleConfigurator.sniffHost(doc?)      -> palette  { accent, ink, paper, font, radius, appearance }
   BundleConfigurator.tokensFrom(palette)  -> { --bcfg-… } ready for brand.inherited
   BundleConfigurator.inheritFromHost(doc?)-> tokens (sniff + derive in one call)
   ============================================================ */
(function (root) {
  'use strict';
  var API = root.BundleConfigurator;
  if (!API) return;

  /* ---------- colour maths ---------- */
  function parse(c) {
    if (!c) return null;
    c = String(c).trim();
    var m = c.match(/^rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3 || (p.length > 3 && p[3] === 0)) return null;   // transparent
      return { r: p[0], g: p[1], b: p[2] };
    }
    m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }
    return null;
  }
  function hex(c) {
    var t = function (n) { return ('0' + Math.round(Math.max(0, Math.min(255, n))).toString(16)).slice(-2); };
    return '#' + t(c.r) + t(c.g) + t(c.b);
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b);
  }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); }
  function mix(a, b, t) { return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }; }
  function sat(c) { var mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; }
  var WHITE = { r: 255, g: 255, b: 255 }, BLACK = { r: 0, g: 0, b: 0 };

  /* A usable accent has some chroma and isn't the page background. */
  function isCandidateAccent(c) { return c && sat(c) > .18 && lum(c) > .02 && lum(c) < .92; }

  function bgOf(el) {
    var n = el;
    while (n && n.nodeType === 1) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c) return c;
      n = n.parentElement;
    }
    return null;
  }

  /* ---------- sniff ---------- */
  var BTN_SEL = [
    '.shopify-payment-button__button', 'button[name="add"]', '.product-form__submit',
    '.btn--primary', '.button--primary', '.btn-primary', '.button--full-width',
    'button.btn', '.button', 'button[type="submit"]', 'button'
  ].join(',');

  API.sniffHost = function (doc) {
    doc = doc || root.document;
    var body = doc.body || doc.documentElement;
    var bodyCS = getComputedStyle(body);

    var paper = bgOf(body) || WHITE;
    var ink = parse(bodyCS.color) || { r: 26, g: 26, b: 26 };
    var font = bodyCS.fontFamily || '';

    // Accent: the most prominent coloured control on the page wins; a link's
    // colour is the fallback, because many themes style buttons black.
    var accent = null, radius = null, source = 'fallback';
    var buttons = [].slice.call(doc.querySelectorAll(BTN_SEL)).slice(0, 40);
    for (var i = 0; i < buttons.length; i++) {
      var cs = getComputedStyle(buttons[i]);
      var bg = parse(cs.backgroundColor);
      if (radius == null) {
        var r = parseFloat(cs.borderRadius);
        if (isFinite(r)) radius = r;
      }
      if (!accent && isCandidateAccent(bg)) {
        accent = bg; radius = parseFloat(cs.borderRadius) || radius;
        source = buttons[i].matches(PRIMARY_SEL) ? 'primary-button' : 'button';
      }
    }
    if (!accent) {
      var links = [].slice.call(doc.querySelectorAll('a')).slice(0, 60);
      for (var j = 0; j < links.length; j++) {
        var lc = parse(getComputedStyle(links[j]).color);
        if (isCandidateAccent(lc)) { accent = lc; source = 'link'; break; }
      }
    }
    // Last resort: a dark/black button theme — keep the store's neutral, it is
    // deliberate. Tint it very slightly so gradients have somewhere to go.
    if (!accent) { accent = buttons.length ? (parse(getComputedStyle(buttons[0]).backgroundColor) || ink) : ink; source = buttons.length ? 'neutral-button' : 'fallback'; }

    var p = {
      accent: hex(accent),
      ink: hex(ink),
      paper: hex(paper),
      font: font,
      radius: radius == null ? 12 : Math.round(radius),
      appearance: lum(paper) < .35 ? 'dark' : 'light'
    };
    p.confidence = API.confidence(p, { source: source, buttons: buttons.length, radiusFound: radius != null });
    return p;
  };

  /* ---------- confidence ----------
     The sniffer guesses. Say how good the guess is, in words a merchant can act
     on, so the admin can offer "use my colours instead" when it is weak. */
  var PRIMARY_SEL = '.shopify-payment-button__button, button[name="add"], .product-form__submit, .btn--primary, .button--primary, .btn-primary';
  var GENERIC_FONTS = /^(serif|sans-serif|times|times new roman|arial|system-ui|-apple-system)\b/i;
  API.confidence = function (p, ctx) {
    ctx = ctx || {};
    var score = 1, reasons = [];
    var accent = parse(p.accent), ink = parse(p.ink), paper = parse(p.paper);
    var srcScore = { 'primary-button': 1, button: .8, link: .6, 'neutral-button': .45, fallback: .2 }[ctx.source || 'fallback'];
    score = Math.min(score, srcScore == null ? .5 : srcScore);
    if (ctx.source === 'link') reasons.push('Accent taken from link colour, no coloured button found');
    if (ctx.source === 'neutral-button') reasons.push('Buttons are neutral, so the accent is a guess');
    if (ctx.source === 'fallback') reasons.push('No buttons found on the page');
    if (accent && ink && contrast(accent, WHITE) < 4.5 && contrast(accent, BLACK) < 4.5) { score -= .25; reasons.push('Text on the accent would be hard to read'); }
    if (ink && paper && contrast(ink, paper) < 4.5) { score -= .25; reasons.push('Page text and background are low contrast'); }
    if (!p.font || GENERIC_FONTS.test(p.font.replace(/["']/g, '').trim())) { score -= .1; reasons.push('No theme typeface detected'); }
    if (!ctx.radiusFound) { score -= .05; }
    score = Math.max(0, Math.min(1, score));
    return { score: Math.round(score * 100) / 100, level: score >= .8 ? 'high' : score >= .5 ? 'medium' : 'low', reasons: reasons, source: ctx.source || 'fallback' };
  };

  /* ---------- derive the full token set ---------- */
  API.tokensFrom = function (p) {
    p = p || {};
    var accent = parse(p.accent) || { r: 74, g: 108, b: 247 };
    var paper = parse(p.paper) || WHITE;
    var ink = parse(p.ink) || { r: 26, g: 26, b: 26 };
    var dark = (p.appearance || (lum(paper) < .35 ? 'dark' : 'light')) === 'dark';

    // Text on the accent: pick whichever of white/black actually reads.
    var accentInk = contrast(accent, WHITE) >= contrast(accent, BLACK) ? WHITE : BLACK;

    var t = {
      accent: hex(accent),
      'accent-dark': hex(mix(accent, BLACK, .18)),
      'accent-soft': hex(mix(accent, dark ? BLACK : WHITE, dark ? .86 : .94)),
      'accent-tint': hex(mix(accent, dark ? BLACK : WHITE, dark ? .78 : .88)),
      'accent-line': hex(mix(accent, dark ? BLACK : WHITE, dark ? .6 : .7)),
      'accent-ink': hex(accentInk),
      ink: hex(ink),
      'ink-2': hex(mix(ink, paper, .32)),
      muted: hex(mix(ink, paper, .55)),
      faint: hex(mix(ink, paper, .72)),
      paper: hex(paper),
      card: hex(dark ? mix(paper, WHITE, .07) : WHITE),
      well: hex(mix(paper, dark ? WHITE : ink, .03)),
      'well-2': hex(mix(paper, dark ? WHITE : ink, .05)),
      line: hex(mix(paper, ink, dark ? .18 : .1)),
      'line-2': hex(mix(paper, ink, dark ? .26 : .16)),
      dark: hex(dark ? mix(paper, BLACK, .5) : mix(ink, BLACK, .2)),
      'dark-2': hex(dark ? mix(paper, BLACK, .35) : mix(ink, BLACK, .05))
    };
    // The glass preset paints its own canvas; hand it the store's ground colour
    // so an inherited theme still reads as *that* store, not as our default.
    t['--g-canvas-1'] = hex(mix(paper, dark ? BLACK : WHITE, .06));
    t['--g-canvas-2'] = hex(mix(paper, dark ? WHITE : BLACK, .04));
    t['--g-ink'] = hex(ink);
    t['--g-ink-2'] = 'rgba(' + [ink.r, ink.g, ink.b].map(Math.round).join(',') + ',.66)';
    t['--g-ink-3'] = 'rgba(' + [ink.r, ink.g, ink.b].map(Math.round).join(',') + ',.6)';
    if (p.radius != null) {
      var r = Math.max(0, Math.min(28, Number(p.radius) || 0));
      t.radius = (r + 4) + 'px';
      t['radius-sm'] = Math.max(0, r - 2) + 'px';
      t['radius-pill'] = r + 'px';
    }
    if (p.font) t.font = p.font;
    return t;
  };

  API.inheritFromHost = function (doc) { return API.tokensFrom(API.sniffHost(doc)); };
  API.colorUtils = { parse: parse, hex: hex, lum: lum, contrast: contrast, mix: mix };
})(typeof window !== 'undefined' ? window : this);
