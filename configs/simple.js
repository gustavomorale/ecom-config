/* ============================================================
   Simple setup (1.0): products, a few questions, and a grid of ticks.

   A simple setup is stored on the config as `simple`:
     mode:      'finder' (one product per shopper) | 'bundle' (main product + extras)
     products:  [{ key, role: 'main'|'extra', variantId, productTitle, image, price,
                   handle, productType, tags }]  -- only products the store sells
     questions: [{ id, field, title, sub, multi, target: 'main'|'extra',
                   answers: [{ value, label, icon, desc }] }]
     grid:      { 'field:value': [productKey, ...] }  -- which products an answer points to

   compile() turns it into the engine's full config: steps, one scored
   "bundle" per main product (most ticks wins, cfg.match = 'score'), one
   accessory and add-on rule per extra. Every name, picture and price comes
   from the linked product; the template only supplies questions and wording.
   Plain ES5 on window, loaded by the storefront demo and, in a vm, by the
   app server (config.server.js).
   ============================================================ */
(function (root) {
  'use strict';

  var MAX_QUESTIONS = 4;
  var MAX_ANSWERS = 6;

  function clone(o) { return JSON.parse(JSON.stringify(o || {})); }

  /* Questions come from the category template: its single and multiple
     choice steps, wording and icons included. Finder: up to three, all about
     the main product. Bundle: up to two for the main product, plus one
     multiple-choice question that picks the extras. */
  function fromTemplate(tpl, mode) {
    var steps = (tpl.steps || []).filter(function (s) {
      return (s.type === 'choice' || s.type === 'multi') && s.field && (s.options || []).length >= 2;
    });
    var pick = [], extra = null;
    if (mode === 'bundle') {
      var multis = steps.filter(function (s) { return s.type === 'multi'; });
      extra = multis.length ? multis[multis.length - 1] : null;
      pick = steps.filter(function (s) { return s !== extra; }).slice(0, 2);
    } else {
      pick = steps.slice(0, 3);
    }
    var toQ = function (s, target) {
      return {
        id: s.field, field: s.field, title: s.question || '', sub: s.sub || '',
        multi: s.type === 'multi', target: target,
        answers: (s.options || []).slice(0, MAX_ANSWERS).map(function (o) {
          return { value: String(o.value), label: o.label || String(o.value), icon: o.icon || '', desc: o.desc || '' };
        })
      };
    };
    var questions = pick.map(function (s) { return toQ(s, 'main'); });
    if (extra) {
      var q = toQ(extra, 'extra');
      q.title = q.title || 'Anything to go with it?';
      questions.push(q);
    }
    // Yes/no extras ("Gift wrap it", "Add a card") become one more extras question.
    if (mode === 'bundle') {
      (tpl.steps || []).filter(function (s) { return s.type === 'toggles' && (s.toggles || []).length; }).forEach(function (s) {
        if (questions.length >= MAX_QUESTIONS) return;
        questions.push({
          id: s.id || 'extras', field: s.id || 'extras', title: s.question || 'Anything else?', sub: s.sub || '',
          multi: true, target: 'extra',
          answers: s.toggles.slice(0, MAX_ANSWERS).map(function (t) { return { value: t.field, label: t.label, icon: t.icon || '', desc: '' }; })
        });
      });
    }
    if (!questions.length) {
      questions.push({ id: 'need', field: 'need', title: 'What are you looking for?', sub: '', multi: false, target: 'main',
        answers: [{ value: 'a', label: 'Option A', icon: '', desc: '' }, { value: 'b', label: 'Option B', icon: '', desc: '' }] });
    }
    return { mode: mode === 'bundle' ? 'bundle' : 'finder', products: [], questions: questions, grid: {} };
  }

  /* ---------- suggested ticks ---------- */
  var STOP = { the: 1, and: 1, for: 1, with: 1, you: 1, your: 1, are: 1, not: 1, from: 1, that: 1, this: 1, set: 1, one: 1, all: 1 };
  function words(str) {
    return String(str || '').toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').split(/[^a-z0-9]+/)
      .filter(function (w) { return w.length >= 3 && !STOP[w]; })
      .map(function (w) {
        w = w.replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1');
        return w.length > 5 ? w.replace(/(ing|ion|ed|er)$/, '') : w;   // hydrating, hydration -> hydrat
      });
  }
  function overlap(a, b) { for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) > -1) return true; return false; }

  function key(q, a) { return q.field + ':' + a.value; }

  /* "Under £25", "£25 to £50", "£50-£100", "Over £100", "£100+": the price band
     an answer names, or null. */
  function priceBand(label) {
    var t = String(label || '').toLowerCase().replace(/,/g, '');
    var n = (t.match(/\d+(\.\d+)?/g) || []).map(Number);
    if (!n.length) return null;
    if (/under|below|less than|up to/.test(t)) return { lo: 0, hi: n[0] };
    if (/over|above|more than|\+/.test(t)) return { lo: n[0], hi: Infinity };
    if (n.length >= 2 && /to|-|\u2013/.test(t)) return { lo: n[0], hi: n[1] };
    return null;
  }
  function productsFor(simple, q) {
    var role = simple.mode === 'finder' ? null : q.target;
    return (simple.products || []).filter(function (p) {
      return role ? (p.role || 'main') === role : (p.role || 'main') === 'main';
    });
  }

  /* Ticks an answer to the products whose title, type or tags share a word
     with it. A question none of whose answers matched anything is spread
     across the products in order, so every product can be reached and the quiz
     works before the merchant touches the grid. Existing ticks are kept. */
  function suggestGrid(simple) {
    tidy(simple);
    var grid = simple.grid || {};
    (simple.questions || []).forEach(function (q) {
      var ps = productsFor(simple, q);
      if (!ps.length) return;
      var pw = ps.map(function (p) {
        var parts = (p.components || []).map(function (c) { return c.productTitle || c.title || ''; });
        return words([p.productTitle, p.productType, (p.tags || []).join(' ')].concat(parts).join(' '));
      });
      var any = q.answers.some(function (a) { return (grid[key(q, a)] || []).length; });
      if (any) return;                                   // the merchant already decided this question
      var matchedSomething = false;
      // A budget question: tick by price, the most reliable signal there is.
      var bands = q.answers.map(function (a) { return priceBand(a.label); });
      if (bands.every(Boolean) && ps.some(function (p) { return Number(p.price) > 0; })) {
        q.answers.forEach(function (a, i) {
          var hits = ps.filter(function (p) { var pr = Number(p.price) || 0; return pr > 0 && pr >= bands[i].lo && pr <= bands[i].hi; }).map(function (p) { return p.key; });
          if (hits.length) grid[key(q, a)] = hits;
        });
        return;
      }
      q.answers.forEach(function (a) {
        var aw = words(a.label + ' ' + (a.desc || ''));
        var hits = ps.filter(function (p, i) { return overlap(aw, pw[i]); }).map(function (p) { return p.key; });
        if (hits.length) { grid[key(q, a)] = hits; matchedSomething = true; }
      });
      if (!matchedSomething && (q.target === 'main' || simple.mode === 'finder')) {
        q.answers.forEach(function (a, i) { grid[key(q, a)] = [ps[i % ps.length].key]; });
      }
      // Extras are optional: with no word in common, leave them for the merchant to tick.
    });
    simple.grid = grid;
    return simple;
  }

  /* Drop ticks that point at products or answers that no longer exist. */
  function tidy(simple) {
    var keys = {}, cells = {}, grid = {};
    (simple.products || []).forEach(function (p) { keys[p.key] = 1; });
    (simple.questions || []).forEach(function (q) { q.answers.forEach(function (a) { cells[key(q, a)] = 1; }); });
    Object.keys(simple.grid || {}).forEach(function (k) {
      if (!cells[k]) return;
      var list = (simple.grid[k] || []).filter(function (pk, i, arr) { return keys[pk] && arr.indexOf(pk) === i; });
      if (list.length) grid[k] = list;
    });
    simple.grid = grid;
    if (simple.mode === 'finder') (simple.products || []).forEach(function (p) { p.role = 'main'; });
    return simple;
  }

  /* ---------- compile to the engine's config ---------- */
  /* Wording set once, when a simple setup starts. Recompiles never touch copy,
     so whatever the merchant writes in Copy & cart stays. */
  var STARTER_COPY = {
    priceSuffix: '', whyTitle: 'Why this pick?', shareLabel: 'Copy a link to this result',
    recommendationBadge: 'Our pick for you', cartHint: 'Opens your cart with everything in it.'
  };
  var FINDER_COPY = { finishLabel: 'See my pick', ctaLabel: 'Add to cart', resultSubtitle: 'Picked from your answers.' };
  var BUNDLE_COPY = { addonsTitle: 'Goes with it' };
  function starterCopy(copy, mode) {
    var out = clone(copy);
    [STARTER_COPY, mode === 'finder' ? FINDER_COPY : BUNDLE_COPY].forEach(function (set) {
      Object.keys(set).forEach(function (k) { out[k] = set[k]; });
    });
    delete out.includesNote;
    return out;
  }

  function compile(simple, base) {
    simple = tidy(clone(simple));
    var cfg = clone(base);
    var finder = simple.mode === 'finder';
    var labelOf = function (q, value) {
      var a = q.answers.filter(function (x) { return x.value === value; })[0];
      return a ? a.label : value;
    };

    cfg.steps = simple.questions.map(function (q) {
      var st = {
        id: q.id, type: q.multi ? 'multi' : 'choice', field: q.field, required: true,
        question: q.title, sub: q.sub || '',
        options: q.answers.map(function (a) {
          var o = { value: a.value, label: a.label };
          if (a.icon) o.icon = a.icon;
          if (a.desc) o.desc = a.desc;
          if (a.image) o.image = a.image;
          return o;
        })
      };
      if (q.multi) { st.columns = 2; st.required = q.target !== 'extra'; }
      if (q.display === 'cards') st.display = 'cards';
      return st;
    });

    var mains = simple.products.filter(function (p) { return finder || (p.role || 'main') === 'main'; });
    var extras = finder ? [] : simple.products.filter(function (p) { return p.role === 'extra'; });
    var cellsFor = function (p, target) {
      var out = [];
      simple.questions.forEach(function (q) {
        if (!finder && q.target !== target) return;
        q.answers.forEach(function (a) {
          if ((simple.grid[key(q, a)] || []).indexOf(p.key) > -1) out.push({ q: q, a: a });
        });
      });
      return out;
    };

    cfg.match = 'score';
    cfg.bundles = mains.map(function (p) {
      var b = {
        id: p.key, title: '', productTitle: p.productTitle || '', subtitle: '',
        price: Number(p.price) || 0, image: p.image || '', variantId: p.variantId || '',
        points: cellsFor(p, 'main').map(function (c) { return { field: c.q.field, value: c.a.value }; }),
        why: '', contents: []
      };
      if (p.handle) b.handle = p.handle;
      if (p.components && p.components.length) { b.components = clone(p.components); b.variantId = ''; }
      return b;
    });

    cfg.accessories = {};
    cfg.addonRules = [];
    extras.forEach(function (p) {
      cfg.accessories[p.key] = { variantId: p.variantId || '', price: Number(p.price) || 0, title: '', productTitle: p.productTitle || '', image: p.image || '' };
      var cells = cellsFor(p, 'extra');
      if (!cells.length) return;
      cfg.addonRules.push({
        id: p.key, accessory: p.key,
        when: { any: cells.map(function (c) { return { field: c.q.field, op: c.q.multi ? 'includes' : 'eq', value: c.a.value }; }) },
        text: '',
        reason: ((base.copy || {}).becauseLabel || 'Because you chose') + ': ' + cells.map(function (c) { return labelOf(c.q, c.a.value); }).join(', ')
      });
    });

    // Summary, chips and answers on the result: built from the questions, so no
    // template row can refer to a field that is no longer asked.
    var oldScene = (base.scene && base.scene.options) || {};
    cfg.scene = { type: 'summary', title: ((base.meta || {}).schema === 3 && base.scene && base.scene.title) || 'Your answers so far',
      options: {
        emptyTitle: oldScene.emptyTitle || 'Answer the first question', emptySub: oldScene.emptySub || 'to see your pick take shape',
        rows: simple.questions.map(function (q, i) {
          return { icon: '&#x2713;', label: '{' + q.field + '_label}', when: { field: 'step', op: 'gt', value: i } };
        })
      } };
    cfg.chips = simple.questions.filter(function (q) { return !q.multi; }).map(function (q) { return { field: q.field }; });
    cfg.profileChips = [];
    cfg.callouts = [];
    cfg.derived = {};
    cfg.copy = cfg.copy || {};
    cfg.mode = simple.mode;
    cfg.meta = cfg.meta || {};
    cfg.meta.schema = 3;
    cfg.meta.engine = '1.3';
    cfg.simple = simple;
    return cfg;
  }

  /* Short check for the admin: what still stops a shopper getting a result. */
  function problems(simple) {
    var out = [];
    var mains = (simple.products || []).filter(function (p) { return simple.mode === 'finder' || (p.role || 'main') === 'main'; });
    if (!mains.length) out.push(simple.mode === 'finder' ? 'Pick at least one product.' : 'Pick at least one main product.');
    mains.forEach(function (p) {
      var reached = Object.keys(simple.grid || {}).some(function (k) { return (simple.grid[k] || []).indexOf(p.key) > -1; });
      if (!reached && mains.length > 1) out.push('No answer points to ' + (p.productTitle || 'a product') + ' yet.');
    });
    return out;
  }

  root.BCFG_SIMPLE = { fromTemplate: fromTemplate, starterCopy: starterCopy, suggestGrid: suggestGrid, tidy: tidy, compile: compile, problems: problems, cellKey: key, MAX_QUESTIONS: MAX_QUESTIONS, MAX_ANSWERS: MAX_ANSWERS };
})(typeof window !== 'undefined' ? window : this);
