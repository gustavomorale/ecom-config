/* ============================================================
   Bundle Configurator — core engine (white-label, vendor-neutral)

   Zero hard-coded brand, copy, product or pricing data. Everything
   comes from the config object passed to BundleConfigurator.mount().

   Public API
   ----------
   BundleConfigurator.mount(el, config)  -> instance
   BundleConfigurator.registerScene(name, renderFn)
   instance.destroy()  /  instance.getState()  /  instance.on(evt, fn)

   Events: 'step', 'answer', 'result', 'addtocart'
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- tiny helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var isNum = function (n) { return typeof n === 'number' && isFinite(n); };

  /* ---------- safe expression evaluator ----------
     Config may arrive from a merchant-editable admin, so expressions are
     token-whitelisted before being compiled. Allowed: numbers, the scope's
     own field names, + - * / % ( ) , and min/max/round/floor/ceil/abs.     */
  var EXPR_FNS = { min: Math.min, max: Math.max, round: Math.round, floor: Math.floor, ceil: Math.ceil, abs: Math.abs };
  var exprCache = {};
  function safeExpr(src, scope) {
    if (isNum(src)) return src;
    if (typeof src !== 'string') return 0;
    var key = src;
    if (!(key in exprCache)) {
      var tokens = src.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/%(),]|\s+/g);
      var rebuilt = tokens ? tokens.join('') : '';
      if (!tokens || rebuilt !== src) { exprCache[key] = null; }
      else {
        var bad = tokens.some(function (t) {
          if (/^[\s+\-*/%(),]+$/.test(t) || /^\d/.test(t)) return false;
          return !(t in EXPR_FNS) && !(t in scope);
        });
        exprCache[key] = bad ? null : new Function('s', 'f', 'with (f) { with (s) { return (' + src + '); } }');
      }
    }
    var fn = exprCache[key];
    if (!fn) { if (root.console) console.warn('[bcfg] rejected expression:', src); return 0; }
    try { return fn(scope, EXPR_FNS); } catch (e) { return 0; }
  }
  function num(v, scope) {
    if (v == null) return 0;
    if (isNum(v)) return v;
    if (typeof v === 'object' && 'expr' in v) return safeExpr(v.expr, scope);
    return safeExpr(v, scope);
  }

  /* ---------- declarative conditions ----------
     { all:[…] } { any:[…] } { not:{…} }
     leaf: { field:'doors', op:'gte', value:3 }  or  { expr:'doors + windows', op:'lte', value:6 } */
  var OPS = {
    eq: function (a, b) { return a === b; },
    ne: function (a, b) { return a !== b; },
    gt: function (a, b) { return a > b; },
    gte: function (a, b) { return a >= b; },
    lt: function (a, b) { return a < b; },
    lte: function (a, b) { return a <= b; },
    'in': function (a, b) { return Array.isArray(b) && b.indexOf(a) > -1; },
    includes: function (a, b) { return Array.isArray(a) && a.indexOf(b) > -1; },
    truthy: function (a) { return !!a; },
    falsy: function (a) { return !a; }
  };
  function test(cond, scope) {
    if (cond == null) return true;
    if (typeof cond === 'boolean') return cond;
    if (Array.isArray(cond)) return cond.every(function (c) { return test(c, scope); });
    if (cond.all) return cond.all.every(function (c) { return test(c, scope); });
    if (cond.any) return cond.any.some(function (c) { return test(c, scope); });
    if (cond.not) return !test(cond.not, scope);
    var left = 'expr' in cond ? safeExpr(cond.expr, scope) : scope[cond.field];
    var op = OPS[cond.op || 'truthy'] || OPS.truthy;
    return !!op(left, cond.value);
  }

  /* ---------- money ---------- */
  function makeMoney(cfg) {
    var c = (cfg && cfg.cart) || {};
    var symbol = c.currencySymbol != null ? c.currencySymbol : '£';
    var locale = c.locale || 'en-GB';
    var code = c.currency || 'GBP';
    return function (n) {
      if (!isNum(n)) n = 0;
      if (c.useIntl) {
        try { return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(n); } catch (e) { /* fall through */ }
      }
      return symbol + n.toFixed(2);
    };
  }

  /* ---------- scene registry ---------- */
  var SCENES = {};
  function registerScene(name, fn) { SCENES[name] = fn; }

  /* ============================================================
     Instance
     ============================================================ */
  function Configurator(el, cfg) {
    this.el = el;
    this.cfg = cfg || {};
    this.money = makeMoney(this.cfg);
    this.listeners = {};
    this.sceneCollapsed = true;
    this.stock = {};        // variantId -> boolean (true = available)
    this.stockPending = {};
    this.removed = {};      // addon key -> true
    this.state = this._initialState();
    this._onClick = this._handleClick.bind(this);
    this._onKey = this._handleKey.bind(this);
    this._focusTo = null;    // where focus should land after the next render
    this._announce = '';     // text for the live region after the next render
    el.classList.add('bcfg');
    this._applyTheme();
    el.addEventListener('click', this._onClick);
    el.addEventListener('keydown', this._onKey);
    this.render();
  }

  Configurator.prototype._initialState = function () {
    var s = { step: 0 };
    (this.cfg.steps || []).forEach(function (st) {
      if (st.field && !(st.field in s)) s[st.field] = st.defaultValue !== undefined ? st.defaultValue : (st.type === 'multi' ? [] : null);
      (st.counters || []).forEach(function (c) { s[c.field] = c.defaultValue !== undefined ? c.defaultValue : (c.min || 0); });
      (st.toggles || []).forEach(function (t) { s[t.field] = !!t.defaultValue; });
      if (st.followUp && st.followUp.field) s[st.followUp.field] = st.followUp.defaultValue !== undefined ? st.followUp.defaultValue : null;
    });
    Object.keys(this.cfg.initialState || {}).forEach(function (k) { s[k] = this.cfg.initialState[k]; }, this);
    return s;
  };

  /* scope = answers + derived values, used by conditions and expressions */
  Configurator.prototype._scope = function () {
    var s = {}, k;
    for (k in this.state) if (Object.prototype.hasOwnProperty.call(this.state, k)) {
      var v = this.state[k];
      s[k] = v === null ? (typeof v === 'boolean' ? v : v) : v;
    }
    // booleans/nulls normalised for arithmetic
    for (k in s) if (s[k] === null || s[k] === undefined) s[k] = 0;
    for (k in s) if (typeof s[k] === 'boolean') s[k + '_n'] = s[k] ? 1 : 0;
    var derived = this.cfg.derived || {};
    Object.keys(derived).forEach(function (name) { s[name] = safeExpr(derived[name], s); });
    return s;
  };

  /* Theme = three layers, applied in order:
       1. preset   — a named skin class (.bcfg-theme-glass), ships with the app
       2. inherited— tokens sniffed from the host storefront (theme-inherit.js)
       3. brand    — the merchant's explicit overrides, always last word          */
  Configurator.prototype._applyTheme = function () {
    var b = this.cfg.brand || {};

    // 1. preset skin
    var preset = b.preset || 'base';
    if (this._preset && this._preset !== preset) this.el.classList.remove('bcfg-theme-' + this._preset);
    this._preset = preset;
    if (preset && preset !== 'base') this.el.classList.add('bcfg-theme-' + preset);

    // appearance: 'light' | 'dark' | 'auto' (follows the visitor's OS setting)
    var app = b.appearance || 'auto';
    if (app === 'auto') {
      var dark = false;
      try { dark = !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) { }
      app = dark ? 'dark' : 'light';
    }
    this.el.setAttribute('data-appearance', app);

    // 2. inherited tokens, 3. explicit brand tokens
    var apply = function (obj) {
      Object.keys(obj || {}).forEach(function (k) {
        if (k === 'preset' || k === 'appearance') return;
        this.el.style.setProperty(k.indexOf('--') === 0 ? k : '--bcfg-' + k, obj[k]);
      }, this);
    }.bind(this);
    apply(b.inherited);
    apply(b.theme);
  };

  /* Live re-theme without losing answers — used by the admin preview. */
  Configurator.prototype.setBrand = function (patch) {
    var b = this.cfg.brand = this.cfg.brand || {};
    Object.keys(patch || {}).forEach(function (k) {
      if (k === 'theme' || k === 'inherited') { b[k] = Object.assign({}, b[k], patch[k]); }
      else b[k] = patch[k];
    });
    this._applyTheme();
    return this;
  };

  Configurator.prototype.on = function (evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn); return this;
  };
  Configurator.prototype._emit = function (evt, payload) {
    (this.listeners[evt] || []).forEach(function (fn) { try { fn(payload, this); } catch (e) { } }, this);
  };
  Configurator.prototype.getState = function () { var o = {}; for (var k in this.state) o[k] = this.state[k]; return o; };
  Configurator.prototype.destroy = function () { this.el.removeEventListener('click', this._onClick); this.el.removeEventListener('keydown', this._onKey); this.el.innerHTML = ''; this.el.classList.remove('bcfg'); if (this._preset && this._preset !== 'base') this.el.classList.remove('bcfg-theme-' + this._preset); this.el.removeAttribute('data-appearance'); this.el.removeAttribute('style'); };

  /* ---------- stock ---------- */
  Configurator.prototype._isOOS = function (variantId) {
    var watch = this.cfg.stockWatch || {};
    if (!(variantId in watch)) return false;          // unwatched = assume sellable
    if (variantId in this.stock) return !this.stock[variantId];
    return true;                                       // watched, unconfirmed = fail safe
  };
  Configurator.prototype._checkStock = function () {
    var watch = this.cfg.stockWatch || {}, self = this;
    var base = (this.cfg.cart && this.cfg.cart.storeUrl) || '';
    if (typeof fetch !== 'function') return;
    Object.keys(watch).forEach(function (vid) {
      if (vid in self.stock || self.stockPending[vid]) return;
      self.stockPending[vid] = true;
      fetch(base + '/products/' + watch[vid] + '.js', { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (p) {
          delete self.stockPending[vid];
          if (!p || !p.variants) return;
          var v = p.variants.filter(function (x) { return String(x.id) === String(vid); })[0];
          if (!v) return;
          var was = self._isOOS(vid);
          self.stock[vid] = !!v.available;
          if (self._isOOS(vid) !== was && self._isDone()) self.render();
        })
        .catch(function () { delete self.stockPending[vid]; });
    });
  };

  /* ---------- promo ---------- */
  Configurator.prototype._promoActive = function () {
    var p = this.cfg.promo;
    if (!p || !p.code || !(p.pct > 0)) return false;
    if (p.startsAt && Date.now() < new Date(p.startsAt).getTime()) return false;
    if (p.endsAt && Date.now() > new Date(p.endsAt).getTime()) return false;
    return true;
  };
  Configurator.prototype._promoQuery = function () {
    return this._promoActive() ? '?discount=' + encodeURIComponent(this.cfg.promo.code) : '';
  };
  Configurator.prototype._discounted = function (p) {
    return this._promoActive() ? p * (1 - this.cfg.promo.pct / 100) : p;
  };

  /* ============================================================
     Recommendation engine
     ============================================================ */
  Configurator.prototype.recommend = function () {
    var scope = this._scope(), self = this;
    var bundles = this.cfg.bundles || [];
    var chosen = null;
    for (var i = 0; i < bundles.length; i++) {
      if (!('when' in bundles[i]) || test(bundles[i].when, scope)) { chosen = bundles[i]; break; }
    }
    if (!chosen) chosen = bundles[bundles.length - 1] || { id: 'none', title: '', price: 0, contents: [] };

    var catalog = this.cfg.accessories || {};
    var addons = [];
    (this.cfg.addonRules || []).forEach(function (rule, idx) {
      var ruleScope = {}; for (var k in scope) ruleScope[k] = scope[k];
      ruleScope.bundleId = chosen.id;
      // bundle can declare how many of an accessory it already contains
      var included = (chosen.includes || {})[rule.accessory] || 0;
      ruleScope.included = included;
      if (!test(rule.when, ruleScope)) return;
      var qty = rule.qty === undefined ? 1 : Math.floor(num(rule.qty, ruleScope));
      if (rule.accessory && qty <= 0) return;
      var acc = catalog[rule.accessory] || {};
      var tokens = { qty: qty, s: qty === 1 ? '' : 's', included: included };
      for (var f in ruleScope) if (typeof ruleScope[f] !== 'object') tokens[f] = ruleScope[f];
      addons.push({
        key: rule.id || ('rule' + idx),
        image: rule.image || acc.image || '',
        text: interpolate(rule.text, tokens),
        reason: interpolate(rule.reason, tokens),
        variantId: rule.advisory ? null : (acc.variantId || null),
        price: acc.price || 0,
        qty: qty,
        oosText: rule.oosText || (self.cfg.copy && self.cfg.copy.oosReason) || 'Add it once back in stock'
      });
    });

    addons.forEach(function (a) { a.oos = a.variantId ? self._isOOS(a.variantId) : false; });

    var lines = {}, order = [];
    addons.forEach(function (a) {
      if (self.removed[a.key] || !a.variantId || a.oos || a.qty <= 0) return;
      if (!(a.variantId in lines)) { lines[a.variantId] = 0; order.push(a.variantId); }
      lines[a.variantId] += a.qty;
    });
    var cartLines = order.map(function (v) { return { variantId: v, qty: lines[v] }; });

    var bundlePrice = Number(chosen.price) || 0;
    var addonsTotal = cartLines.reduce(function (sum, l) {
      var acc = null;
      for (var k in catalog) if (String(catalog[k].variantId) === String(l.variantId)) { acc = catalog[k]; break; }
      return sum + ((acc && acc.price) || 0) * l.qty;
    }, 0);

    return {
      bundle: chosen,
      contents: chosen.contents || [],
      addons: addons,
      cartLines: cartLines,
      addonCount: cartLines.length,
      bundlePrice: bundlePrice,
      addonsTotal: addonsTotal,
      orderTotal: bundlePrice + addonsTotal,
      cartUrl: this.buildCartUrl(chosen, cartLines),
      why: interpolate(chosen.why, this._scope())
    };
  };

  function interpolate(str, tokens) {
    if (!str) return '';
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return k in tokens ? tokens[k] : m; });
  }

  Configurator.prototype.buildCartUrl = function (bundle, lines) {
    var c = this.cfg.cart || {};
    var base = (c.storeUrl || '').replace(/\/$/, '');
    var items = [];
    if (bundle && bundle.variantId) items.push(bundle.variantId + ':' + (bundle.qty || 1));
    lines.forEach(function (l) { items.push(l.variantId + ':' + l.qty); });
    if (!items.length) return base + '/cart';
    return base + '/cart/' + items.join(',') + this._promoQuery();
  };

  /* ============================================================
     Rendering
     ============================================================ */
  Configurator.prototype._isDone = function () { return this.state.step >= (this.cfg.steps || []).length; };
  Configurator.prototype._isMobile = function () { return root.innerWidth <= 820; };

  /* Every render replaces innerHTML, which drops keyboard focus on the floor.
     Callers set _focusTo before rendering; otherwise we put focus back on the
     control that had it, matched by its data-* identity. */
  Configurator.prototype._rememberFocus = function () {
    var a = document.activeElement;
    if (!a || !this.el.contains(a)) return null;
    return { action: a.getAttribute('data-action'), field: a.getAttribute('data-field'), value: a.getAttribute('data-value'), delta: a.getAttribute('data-delta'), key: a.getAttribute('data-key') };
  };
  Configurator.prototype._restoreFocus = function (want) {
    if (!want) return;
    var target = null;
    if (want.selector) target = this.el.querySelector(want.selector);
    else if (want.action) {
      var all = this.el.querySelectorAll('[data-action="' + want.action + '"]');
      for (var i = 0; i < all.length; i++) {
        var c = all[i];
        if (c.getAttribute('data-field') === want.field && c.getAttribute('data-value') === want.value &&
            c.getAttribute('data-delta') === want.delta && c.getAttribute('data-key') === want.key) { target = c; break; }
      }
      if (!target && all.length) target = all[0];
    }
    if (target && !target.disabled) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
  };

  Configurator.prototype.render = function () {
    var copy = this.cfg.copy || {};
    var done = this._isDone();
    var want = this._focusTo || this._rememberFocus();
    this._focusTo = null;
    if (done) this.sceneCollapsed = false;
    var sceneHtml = this._renderScene();
    var body = done ? this._renderResult() : (this._renderProgress() + this._renderStep());
    var title = copy.title || '';
    if (copy.titleHighlight) title = title.replace(copy.titleHighlight, '<span>' + esc(copy.titleHighlight) + '</span>');

    this.el.innerHTML =
      '<div class="app-shell">' +
        '<div class="hero"><h1>' + title + '</h1>' +
          '<p>' + esc(done ? (copy.resultSubtitle || copy.subtitle || '') : (copy.subtitle || '')) + '</p></div>' +
        '<div class="two-col' + (sceneHtml ? '' : ' single') + '">' +
          sceneHtml +
          '<div class="form-panel">' + body + '</div>' +
        '</div>' +
        (done ? '' : this._renderStickyBar()) +
        '<div class="bcfg-live" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '</div>';

    this._restoreFocus(want);
    if (this._announce) { this._say(this._announce); this._announce = ''; }
    if (done) { this._checkStock(); this._emit('result', this.recommend()); }
  };

  /* Screen reader announcement, delayed a tick so the live region is
     observed as changing rather than as freshly inserted. */
  Configurator.prototype._say = function (text) {
    var live = this.el.querySelector('.bcfg-live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 50);
  };

  Configurator.prototype._stepLabel = function () {
    var n = (this.cfg.steps || []).length, copy = this.cfg.copy || {};
    return interpolate(copy.stepLabel || 'Step {current} of {total}', { current: this.state.step + 1, total: n });
  };

  Configurator.prototype._renderScene = function () {
    var sc = this.cfg.scene || {};
    if (!sc.type || sc.type === 'none') return '';
    var fn = SCENES[sc.type];
    if (!fn) return '';
    var svg = fn(this.state, sc.options || {}, this.cfg, this._scope(), this);
    if (!svg) return '';
    var collapsed = this._isMobile() && this.sceneCollapsed ? ' collapsed' : '';
    // label and aria-expanded follow what is actually on screen, not the flag
    var label = collapsed ? (sc.showLabel || 'Show preview') : (sc.hideLabel || 'Hide preview');
    var id = this._id('scene');
    return '<aside class="scene-panel' + collapsed + '" data-scene aria-labelledby="' + id + '-title">' +
      '<div class="scene-panel-title" id="' + id + '-title">' + esc(sc.title || 'Your setup') + '</div>' +
      '<div class="scene-canvas" id="' + id + '-canvas" aria-hidden="true">' + svg + '</div>' +
      '<ul class="scene-chips" aria-label="' + esc(sc.title || 'Your setup') + '">' + this._renderChips() + '</ul>' +
      '<button type="button" class="scene-toggle" data-action="toggleScene" aria-expanded="' + (collapsed ? 'false' : 'true') + '" aria-controls="' + id + '-canvas"><span>' + esc(label) + '</span><span class="toggle-arrow" aria-hidden="true">&#x25B2;</span></button>' +
      '</aside>';
  };

  Configurator.prototype._renderChips = function () {
    var self = this, scope = this._scope();
    return (this.cfg.chips || []).filter(function (c) { return test(c.when, scope); })
      .map(function (c) {
        var tokens = {}; for (var k in scope) tokens[k] = scope[k];
        tokens.s = scope[c.field] === 1 ? '' : 's';
        var label = c.label ? interpolate(c.label, tokens) : self._labelFor(c.field);
        if (!label) return '';
        var style = c.color ? ' style="background:' + esc(c.color) + '"' : '';
        return '<li class="chip"><span class="dot" aria-hidden="true"' + style + '></span>' + esc(label) + '</li>';
      }).join('');
  };

  /* Stable per-instance ids for aria-* wiring. Several widgets may share a page. */
  var UID = 0;
  Configurator.prototype._id = function (suffix) {
    if (!this._uid) this._uid = 'bcfg' + (++UID);
    return this._uid + '-' + suffix;
  };

  /* resolve the human label of a choice field's current value */
  Configurator.prototype._labelFor = function (field) {
    var val = this.state[field], out = '';
    (this.cfg.steps || []).forEach(function (st) {
      if (st.field !== field) return;
      (st.options || []).forEach(function (o) { if (o.value === val) out = o.label; });
      if (st.followUp && st.followUp.field === field) (st.followUp.options || []).forEach(function (o) { if (o.value === val) out = o.label; });
    });
    return out || (val == null ? '' : String(val));
  };

  Configurator.prototype._renderProgress = function () {
    var n = (this.cfg.steps || []).length;
    var pct = Math.round((this.state.step / n) * 100);
    var copy = this.cfg.copy || {};
    var label = this._stepLabel();
    return '<div class="progress-wrap"><div class="progress-meta">' +
      '<span class="progress-step">' + esc(label) + '</span>' +
      '<span class="progress-pct" aria-hidden="true">' + pct + '%</span></div>' +
      '<div class="progress-bar" role="progressbar" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + this.state.step + '" aria-valuetext="' + esc(label) + ', ' + pct + '%"><div class="progress-fill" style="width:' + pct + '%"></div></div></div>';
  };

  Configurator.prototype._renderStickyBar = function () {
    var n = (this.cfg.steps || []).length, copy = this.cfg.copy || {};
    var dots = (this.cfg.steps || []).map(function (_, i) {
      return '<span class="step-dot' + (i < this.state.step ? ' done' : i === this.state.step ? ' active' : '') + '"></span>';
    }, this).join('');
    var last = this.state.step === n - 1;
    return '<div class="sticky-cta"><div class="step-dots" aria-hidden="true">' + dots + '</div>' +
      (this.state.step > 0 ? '<button type="button" class="btn-back" data-action="back" aria-label="' + esc(copy.backLabel || 'Back') + '">&#x2190;</button>' : '') +
      '<button type="button" class="btn-next" data-action="next"' + this._nextAttrs() + '>' +
      esc(last ? (copy.finishLabel || 'See my bundle') : (copy.nextLabel || 'Continue')) + ' <span aria-hidden="true">&#x2192;</span></button></div>';
  };

  /* Disabled Continue plus a reason. The hint is rendered in the card once and
     referenced by both Continue buttons (desktop nav row and mobile bar). */
  Configurator.prototype._nextAttrs = function () {
    return this._canAdvance() ? '' : ' disabled aria-disabled="true" aria-describedby="' + this._id('hint') + '"';
  };
  Configurator.prototype._renderHint = function () {
    var st = (this.cfg.steps || [])[this.state.step], copy = this.cfg.copy || {};
    if (!st || !st.required || this._canAdvance()) return '';
    return '<div class="required-hint" id="' + this._id('hint') + '">' + esc(copy.requiredHint || 'Choose an option to continue') + '</div>';
  };

  Configurator.prototype._canAdvance = function () {
    var st = (this.cfg.steps || [])[this.state.step];
    if (!st || !st.required) return true;
    var v = this.state[st.field];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== '';
  };

  Configurator.prototype._renderStep = function () {
    var st = (this.cfg.steps || [])[this.state.step];
    if (!st) return '';
    var copy = this.cfg.copy || {}, body = '';
    var last = this.state.step === (this.cfg.steps || []).length - 1;
    var qid = this._id('q');

    switch (st.type) {
      case 'choice':
      case 'boolean':
        body = this._renderChoice(st);
        break;
      case 'counters':
        body = this._renderCounters(st);
        break;
      case 'toggles':
        body = '<div class="tile-grid" role="group" aria-labelledby="' + qid + '"' + (st.columns ? ' style="grid-template-columns:repeat(' + st.columns + ',1fr)"' : '') + '>' +
          (st.toggles || []).map(function (t) {
            var on = !!this.state[t.field];
            return '<button type="button" class="tile-btn' + (on ? ' selected' : '') + '" aria-pressed="' + on + '" data-action="toggleField" data-field="' + esc(t.field) + '">' +
              '<span class="tile-icon" aria-hidden="true">' + (t.icon || '') + '</span><span class="tile-text">' + esc(t.label) + '</span></button>';
          }, this).join('') + '</div>';
        break;
      case 'multi':
        body = '<div class="tile-grid" role="group" aria-labelledby="' + qid + '"' + (st.columns ? ' style="grid-template-columns:repeat(' + st.columns + ',1fr)"' : '') + '>' +
          (st.options || []).map(function (o) {
            var on = (this.state[st.field] || []).indexOf(o.value) > -1;
            return '<button type="button" class="tile-btn' + (on ? ' selected' : '') + '" aria-pressed="' + on + '" data-action="toggleMulti" data-field="' + esc(st.field) + '" data-value="' + esc(o.value) + '">' +
              '<span class="tile-icon" aria-hidden="true">' + (o.icon || '') + '</span><span class="tile-text">' + esc(o.label) + '</span></button>';
          }, this).join('') + '</div>';
        break;
    }

    if (st.tip) body += '<div class="tip">' + st.tip + '</div>';

    return '<div class="card">' +
      '<h2 class="card-question" id="' + qid + '" tabindex="-1">' + esc(st.question || '') + '</h2>' +
      '<div class="card-sub">' + esc(st.sub || '') + '</div>' + body + this._renderHint() +
      '<div class="nav-row">' +
        (this.state.step > 0 ? '<button type="button" class="btn-back" data-action="back"><span aria-hidden="true">&#x2190;</span> ' + esc(copy.backLabel || 'Back') + '</button>' : '') +
        '<button type="button" class="btn-next" data-action="next"' + this._nextAttrs() + '>' +
        esc(last ? (copy.finishLabel || 'See my bundle') : (copy.nextLabel || 'Continue')) + ' <span aria-hidden="true">&#x2192;</span></button>' +
      '</div></div>' + this._renderFooter();
  };

  /* A single-choice step is a radiogroup: one Tab stop, arrows move within.
     The selected option (or the first, when nothing is chosen yet) is the
     stop; the rest sit at tabindex -1. */
  Configurator.prototype._renderRadios = function (field, opts, current, cls) {
    var anySel = opts.some(function (o) { return o.value === current; });
    return opts.map(function (o, i) {
      var sel = current === o.value;
      var tab = sel || (!anySel && i === 0) ? '0' : '-1';
      var icon = o.image ? '<img src="' + esc(o.image) + '" alt="">' : (o.icon || '');
      return '<button type="button" role="radio" aria-checked="' + sel + '" tabindex="' + tab + '" class="' + cls + (sel ? ' selected' : '') + '" data-action="setField" data-field="' + esc(field) + '" data-value="' + esc(o.value) + '" data-type="' + esc(typeof o.value) + '">' +
        '<span class="option-icon" aria-hidden="true">' + icon + '</span><span class="option-text">' +
        '<span class="option-label">' + esc(o.label) + '</span>' +
        (o.desc ? '<span class="option-desc">' + esc(o.desc) + '</span>' : '') + '</span></button>';
    }).join('');
  };

  Configurator.prototype._renderChoice = function (st) {
    var grid = st.layout === 'grid';
    var html = '<div class="' + (grid ? 'toggle-grid' : 'options') + '" role="radiogroup" aria-labelledby="' + this._id('q') + '">' +
      this._renderRadios(st.field, st.options || [], this.state[st.field], 'option-btn') + '</div>';

    if (st.followUp && test(st.followUp.when === undefined ? { field: st.field, op: 'truthy' } : st.followUp.when, this._scope())) {
      var fid = this._id('fu');
      html += '<div class="followup-label" id="' + fid + '">' + esc(st.followUp.label || '') + '</div>' +
        '<div class="options" role="radiogroup" aria-labelledby="' + fid + '">' +
        this._renderRadios(st.followUp.field, st.followUp.options || [], this.state[st.followUp.field], 'option-btn') + '</div>';
    }
    return html;
  };

  Configurator.prototype._renderCounters = function (st) {
    var cols = (st.counters || []).length === 1 ? 'cols-1' : (st.counters || []).length >= 3 ? 'cols-3' : '';
    var copy = this.cfg.copy || {}, self = this;
    return '<div class="counters ' + cols + '" role="group" aria-labelledby="' + this._id('q') + '">' + (st.counters || []).map(function (c, i) {
      var lid = self._id('c' + i), vid = self._id('cv' + i);
      var val = Number(self.state[c.field]) || 0, min = c.min || 0, max = c.max || 99;
      return '<div class="counter-item" role="group" aria-labelledby="' + lid + '">' +
        (c.icon ? '<div class="counter-emoji" aria-hidden="true">' + c.icon + '</div>' : '') +
        '<div class="counter-label" id="' + lid + '">' + esc(c.label) + '</div>' +
        '<div class="counter-controls">' +
          '<button type="button" class="counter-btn" aria-label="' + esc(interpolate(copy.decreaseLabel || 'Fewer {label}', { label: c.label })) + '" aria-describedby="' + vid + '"' + (val <= min ? ' aria-disabled="true"' : '') + ' data-action="step" data-field="' + esc(c.field) + '" data-delta="-1" data-min="' + min + '" data-max="' + max + '">&#x2212;</button>' +
          '<span class="counter-val" id="' + vid + '" aria-live="polite" aria-atomic="true">' + esc(val) + '</span>' +
          '<button type="button" class="counter-btn" aria-label="' + esc(interpolate(copy.increaseLabel || 'More {label}', { label: c.label })) + '" aria-describedby="' + vid + '"' + (val >= max ? ' aria-disabled="true"' : '') + ' data-action="step" data-field="' + esc(c.field) + '" data-delta="1" data-min="' + min + '" data-max="' + max + '">+</button>' +
        '</div></div>';
    }).join('') + '</div>';
  };

  /* The widget stamps nothing of its own. Both halves of the footer are the
     merchant's — including the words in front of their name — and with neither
     set the element is not rendered at all. */
  Configurator.prototype._renderFooter = function () {
    var b = this.cfg.brand || {}, copy = this.cfg.copy || {};
    if (!b.footerText && !b.name) return '';
    var prefix = copy.footerPrefix ? esc(copy.footerPrefix) + ' ' : '';
    var txt = b.footerText || '';
    return '<div class="bcfg-footer">' +
      (b.name ? prefix + '<strong>' + esc(b.name) + '</strong>' + (txt ? ' &#x2014; ' : '') : '') +
      esc(txt) + '</div>';
  };

  Configurator.prototype._removedNote = function () {
    var n = Object.keys(this.removed).length, copy = this.cfg.copy || {};
    return interpolate(copy.removedNote || '{n} add-on{s} removed from your cart', { n: n, s: n === 1 ? '' : 's' });
  };

  /* ---------- result ---------- */
  Configurator.prototype._renderResult = function () {
    var rec = this.recommend(), copy = this.cfg.copy || {}, self = this;
    var m = this.money, promo = this._promoActive() ? this.cfg.promo : null;

    var priceBlock = promo
      ? '<div class="price-tag"><span class="price-was">' + esc(m(rec.bundlePrice)) + '</span>' + esc(m(this._discounted(rec.bundlePrice))) + ' <small>' + esc(copy.priceSuffix || '') + '</small></div>' +
        '<div class="promo-pill">' + esc(interpolate(copy.promoPill || 'Save {pct}% with code {code}', { pct: promo.pct, code: promo.code })) + '</div>'
      : '<div class="price-tag">' + esc(m(rec.bundlePrice)) + ' <small>' + esc(copy.priceSuffix || '') + '</small></div>';

    var profile = (this.cfg.profileChips || []).filter(function (c) { return test(c.when, self._scope()); })
      .map(function (c) {
        var tokens = self._scope(); tokens.s = tokens[c.field] === 1 ? '' : 's';
        var label = c.label ? interpolate(c.label, tokens) : self._labelFor(c.field);
        return '<div class="profile-chip"><span>' + (c.icon || '') + '</span> ' + esc(label) + '</div>';
      }).join('');

    var addonsHtml = rec.addons.length ? '<div class="addons-section"><div class="section-title">' + esc(copy.addonsTitle || 'Recommended add-ons') + '</div>' +
      rec.addons.map(function (a) {
        if (self.removed[a.key]) return '';
        var data = (a.variantId && !a.oos) ? ' data-variant="' + esc(a.variantId) + '" data-qty="' + a.qty + '" data-key="' + esc(a.key) + '"' : '';
        return '<div class="addon-row' + (a.oos ? ' addon-oos' : '') + '"' + data + '>' +
          '<div class="addon-icon">' + (a.image ? '<img src="' + esc(a.image) + '" alt="">' : '') + '</div>' +
          '<div class="addon-text">' + esc(a.text) + (a.oos ? ' <span class="addon-oos-badge">' + esc(copy.oosBadge || 'Out of stock') + '</span>' : '') + '</div>' +
          '<div class="addon-reason">' + esc(a.oos ? a.oosText : a.reason) + '</div>' +
          ((a.variantId && !a.oos) ? '<button type="button" class="addon-remove-btn" data-action="removeAddon" data-key="' + esc(a.key) + '" aria-label="' + esc(interpolate(copy.removeAddonLabel || 'Remove {item}', { item: a.text })) + '">&#xD7;</button>' : '') +
          '</div>';
      }).join('') +
      (Object.keys(this.removed).length ? '<div class="addon-removed-note visible"><span aria-hidden="true">&#x2713;</span> ' + esc(this._removedNote()) + '</div>' : '') +
      '</div>' : '';

    var callouts = (this.cfg.callouts || []).filter(function (c) { return test(c.when, self._scope()); }).map(function (c) {
      return '<div class="callout"><div class="callout-head">' +
        '<div class="callout-badge">' + (c.icon || '') + '</div><div>' +
        '<div class="callout-title">' + esc(c.title) + '</div>' +
        '<div class="callout-kicker">' + esc(c.kicker || '') + '</div></div></div>' +
        '<div class="callout-body">' + c.body + '</div>' +
        (c.linkUrl ? '<a class="callout-link" href="' + esc(c.linkUrl) + '" target="_blank" rel="noopener">' + esc(c.linkLabel || 'Learn more') + ' &#x2192;</a>' : '') +
        '</div>';
    }).join('');

    var totals = promo
      ? esc(copy.orderTotalLabel || 'Order total') + ': <span class="was">' + esc(m(rec.orderTotal)) + '</span> <span class="now">' + esc(m(this._discounted(rec.orderTotal))) + '</span> <span class="with-code">with ' + esc(promo.code) + '</span>'
      : esc(copy.orderTotalLabel || 'Order total') + ': ' + esc(m(rec.orderTotal));

    return '<div class="result-card">' +
      '<div class="result-header">' +
        (rec.bundle.image ? '<div class="bundle-hero hero-pop"><img src="' + esc(rec.bundle.image) + '" alt="' + esc(rec.bundle.title) + '"></div>' : '') +
        '<div class="rec-badge">' + esc(copy.recommendationBadge || 'Your recommendation') + '</div>' +
        '<h2 tabindex="-1">' + esc(rec.bundle.title) + '</h2>' +
        (rec.bundle.subtitle ? '<div class="bundle-sub">' + esc(rec.bundle.subtitle) + '</div>' : '') +
        priceBlock +
      '</div>' +
      '<div class="result-body">' +
        (rec.why ? '<div class="summary-box"><div class="summary-title">' + esc(copy.whyTitle || 'Why this bundle?') + '</div><div class="summary-text">' + rec.why + '</div></div>' : '') +
        (rec.contents.length ? '<div class="section-title">' + esc(copy.contentsTitle || "What's included") + '</div><div class="line-items">' +
          rec.contents.map(function (i) {
            return '<div class="line-item"><div class="line-item-img">' + (i.image ? '<img src="' + esc(i.image) + '" alt="">' : '') + '</div>' +
              '<div class="line-item-text"><div class="line-item-name">' + esc(i.name) + '</div>' +
              (i.detail ? '<div class="line-item-detail">' + esc(i.detail) + '</div>' : '') + '</div>' +
              '<div class="line-item-qty">&#xD7;' + (i.qty || 1) + '</div></div>';
          }).join('') + '</div>' : '') +
        addonsHtml + callouts +
        (profile ? '<div class="section-title">' + esc(copy.profileTitle || 'Your answers') + '</div><div class="profile-grid">' + profile + '</div>' : '') +
        (copy.includesNote ? '<div class="note-box">' + copy.includesNote + '</div>' : '') +
        '<div class="cart-panel">' +
          '<div class="cart-panel-head"><span>' + esc(copy.cartPanelLabel || 'Your cart will contain') + '</span><span>' + esc((this.cfg.cart || {}).displayDomain || '') + '</span></div>' +
          '<div class="cart-lines">1&#xD7; ' + esc(rec.bundle.title) + ' (' + esc(m(rec.bundlePrice)) + ')' +
            (rec.addonCount ? ' + ' + rec.addonCount + ' add-on' + (rec.addonCount > 1 ? 's' : '') + ' (' + esc(m(rec.addonsTotal)) + ')' : '') + '</div>' +
          '<div class="cart-totals">' + totals + '</div>' +
          (promo ? '<div class="cart-promo"><span>&#x2713;</span> ' + esc(interpolate(copy.promoNote || 'Code {code} ({pct}% off) applied automatically at checkout', { code: promo.code, pct: promo.pct })) + '</div>' : '') +
          '<div class="cart-hint">' + esc(copy.cartHint || '') + '</div>' +
        '</div>' +
        '<div class="cta-row">' +
          '<button type="button" class="btn-restart" data-action="restart"><span aria-hidden="true">&#x21BB;</span> ' + esc(copy.restartLabel || 'Start over') + '</button>' +
          '<a class="btn-cta" data-action="addToCart" href="' + esc(rec.cartUrl) + '"' + ((this.cfg.cart || {}).mode === 'ajax' ? '' : ' target="_blank" rel="noopener"') + '>' + esc(copy.ctaLabel || 'Add to cart') + ' &#x2192;</a>' +
        '</div>' +
      '</div></div>' + this._renderFooter();
  };

  /* ---------- events ---------- */
  Configurator.prototype._handleClick = function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el || !this.el.contains(el)) return;
    var a = el.getAttribute('data-action');
    var field = el.getAttribute('data-field');
    var value = el.getAttribute('data-value');

    switch (a) {
      case 'setField': {
        var t = el.getAttribute('data-type');
        var v = t === 'boolean' ? value === 'true' : t === 'number' ? Number(value) : value;
        this.state[field] = v;
        var step = (this.cfg.steps || [])[this.state.step];
        if (step) {
          var opt = (step.options || []).filter(function (o) { return o.value === v; })[0];
          if (opt && opt.defaults) for (var k in opt.defaults) this.state[k] = opt.defaults[k];
        }
        this._emit('answer', { field: field, value: v });
        this.render(); break;
      }
      case 'step': {
        var d = Number(el.getAttribute('data-delta'));
        var was = Number(this.state[field]) || 0;
        this.state[field] = clamp(was + d, Number(el.getAttribute('data-min')), Number(el.getAttribute('data-max')));
        if (this.state[field] === was) return;         // at the limit, nothing to re-render
        this._emit('answer', { field: field, value: this.state[field] });
        this.render(); break;
      }
      case 'toggleField':
        this.state[field] = !this.state[field];
        this._emit('answer', { field: field, value: this.state[field] });
        this.render(); break;
      case 'toggleMulti': {
        var arr = this.state[field] || [];
        this.state[field] = arr.indexOf(value) > -1 ? arr.filter(function (x) { return x !== value; }) : arr.concat([value]);
        this._emit('answer', { field: field, value: this.state[field] });
        this.render(); break;
      }
      case 'next':
        if (!this._canAdvance()) return;
        this.state.step++;
        this._emit('step', this.state.step);
        this._goToStep(); break;
      case 'back':
        this.state.step = Math.max(0, this.state.step - 1);
        this._emit('step', this.state.step);
        this._goToStep(); break;
      case 'restart':
        this.state = this._initialState(); this.removed = {};
        this._goToStep(); break;
      case 'toggleScene': {
        var panel = this.el.querySelector('[data-scene]');
        if (!panel) break;
        // read the real state off the panel: the flag can disagree after a resize
        this.sceneCollapsed = !panel.classList.contains('collapsed');
        panel.classList.toggle('collapsed', this.sceneCollapsed);
        var lab = panel.querySelector('.scene-toggle span');
        var sc = this.cfg.scene || {};
        if (lab) lab.textContent = this.sceneCollapsed ? (sc.showLabel || 'Show preview') : (sc.hideLabel || 'Hide preview');
        el.setAttribute('aria-expanded', this.sceneCollapsed ? 'false' : 'true');
        break;
      }
      case 'removeAddon':
        e.preventDefault();
        this.removed[el.getAttribute('data-key')] = true;
        this._announce = this._removedNote();
        this._focusTo = { selector: '.addon-remove-btn' };   // next remaining remove button, else nothing
        this.render();
        if (!this.el.querySelector('.addon-remove-btn')) this._restoreFocus({ selector: '.btn-cta' });
        break;
      case 'addToCart':
        this._addToCart(e, el); break;
    }
  };

  /* Step change: focus the new question (or the result title) so assistive
     tech reads it, and announce the position. */
  Configurator.prototype._goToStep = function () {
    var done = this._isDone();
    this._focusTo = { selector: done ? '.result-header h2' : '.card-question' };
    this._announce = done ? '' : this._stepLabel();
    this.render(); this._scrollTop();
  };

  /* Arrow keys inside a radiogroup move selection (WAI-ARIA radio pattern).
     Everything else is a native button and needs no help. */
  Configurator.prototype._handleKey = function (e) {
    var t = e.target;
    if (!t || t.getAttribute('role') !== 'radio') return;
    var group = t.closest('[role="radiogroup"]');
    if (!group) return;
    var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    var i = radios.indexOf(t), next = -1;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = (i + 1) % radios.length; break;
      case 'ArrowLeft': case 'ArrowUp': next = (i - 1 + radios.length) % radios.length; break;
      case 'Home': next = 0; break;
      case 'End': next = radios.length - 1; break;
      default: return;
    }
    e.preventDefault();
    radios[next].focus();                 // move focus first so the re-render restores it here
    radios[next].click();                 // selects; focus follows the data-* identity through render
  };

  Configurator.prototype._scrollTop = function () {
    try { root.scrollTo({ top: this.el.getBoundingClientRect().top + root.pageYOffset - 20, behavior: 'smooth' }); } catch (e) { }
  };

  /* Two cart strategies:
     'permalink' (default) — /cart/<variant>:<qty>,… works on any storefront, no JS API.
     'ajax'                — POST /cart/add.js, stays on-page; required for line-item
                             properties / selling plans, only works same-origin.        */
  Configurator.prototype._addToCart = function (e, link) {
    var c = this.cfg.cart || {}, rec = this.recommend();
    this._emit('addtocart', rec);
    if (c.mode !== 'ajax') return;                       // let the href navigate
    e.preventDefault();
    var items = [];
    if (rec.bundle.variantId) items.push({ id: Number(rec.bundle.variantId), quantity: rec.bundle.qty || 1 });
    rec.cartLines.forEach(function (l) { items.push({ id: Number(l.variantId), quantity: l.qty }); });
    if (!items.length) return;
    link.classList.add('is-busy');
    fetch((c.storeUrl || '').replace(/\/$/, '') + '/cart/add.js', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items })
    }).then(function () {
      root.location.href = (c.redirectTo || '/cart') + (this._promoQuery() && c.redirectTo !== false ? '' : '');
    }.bind(this)).catch(function () { link.classList.remove('is-busy'); });
  };

  /* ---------- public ---------- */
  var API = {
    version: '1.1.0',
    mount: function (el, cfg) {
      var node = typeof el === 'string' ? document.querySelector(el) : el;
      if (!node) throw new Error('[bcfg] mount target not found');
      return new Configurator(node, cfg);
    },
    registerScene: registerScene,
    scenes: SCENES,
    test: test,
    expr: safeExpr
  };

  if (typeof module === 'object' && module.exports) module.exports = API;
  root.BundleConfigurator = API;
})(typeof window !== 'undefined' ? window : this);
