/* ============================================================
   MVP harness — the app around the widget.
   Storefront · Merchant admin · Theme sync · Analytics · Model
   ============================================================ */
(function () {
'use strict';
var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
  return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

/* ---------- segmented control helper ---------- */
function seg(name, attr, onPick) {
  $$('[data-seg="' + name + '"] button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-seg="' + name + '"] button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      onPick(b.getAttribute(attr), b);
    });
  });
}

/* ---------- tabs ---------- */
$$('.tabs button').forEach(function (b) {
  b.addEventListener('click', function () {
    $$('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
    b.setAttribute('aria-selected', 'true');
    var t = b.getAttribute('data-tab');
    $$('.tab-panel').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (t === 'stats') Stats.render();
    if (t === 'theme') Theme.ensure();
  });
});

/* ============================================================
   Templates
   ============================================================ */
function withPreset(cfg, preset, appearance) {
  cfg.brand = cfg.brand || {};
  cfg.brand.preset = preset;
  cfg.brand.appearance = appearance;
  return cfg;
}
var CATS = window.BCFG_CATEGORIES || [];
function category(id) {
  for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
  return CATS[0];
}
function buildCategory(id) { return category(id).build(); }

/* ============================================================
   Storefront tab
   ============================================================ */
var Store = {
  category: (CATS[0] || {}).id, preset: 'glass', appearance: 'light', inst: null,
  mount: function () {
    if (this.inst) this.inst.destroy();
    var cfg = withPreset(buildCategory(this.category), this.preset, this.appearance);
    this.inst = BundleConfigurator.mount($('#store-mount'), cfg);
    Stats.attach(this.inst, 'live');
  },
  /* Show the merchant's own config, as a shopper would see it. */
  mountConfig: function (cfg) {
    if (this.inst) this.inst.destroy();
    this.inst = BundleConfigurator.mount($('#store-mount'), clone(cfg));
    Stats.attach(this.inst, 'live');
    $$('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === 'store' ? 'true' : 'false'); });
    $$('.tab-panel').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== 'store'; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
$('#store-category').innerHTML = CATS.map(function (c) {
  return '<option value="' + c.id + '">' + c.label + '</option>';
}).join('');
$('#store-category').addEventListener('change', function () { Store.category = this.value; Store.mount(); });
seg('preset', 'data-p', function (p) { Store.preset = p; Store.mount(); });
seg('appearance', 'data-a', function (a) { Store.appearance = a; Store.mount(); });
seg('device', 'data-d', function (d) { $('#store-device').className = 'device ' + (d === 'desktop' ? '' : d); });

/* ============================================================
   Icon picker — the merchant's own icons, per option
   ============================================================ */
var EMOJI = {
  'Home &amp; property': ['🏠','🏡','🏘️','🏬','🚪','🪟','🔑','🛋️','🌳','🚗'],
  'Security': ['🔒','🛡️','📹','🚨','🔔','👁️','📡','⚡','🔦','👮'],
  'Food &amp; drink': ['☕','🍵','🫖','🥛','🍫','🧋','🍾','🧃','🍞','🧁'],
  'Commerce': ['📦','🛒','🏷️','💳','🎁','⭐','🔥','✅','📈','🚚'],
  'People &amp; pets': ['👤','👥','🐶','🐱','👶','👴','🧑‍💻','🏢'],
  'Abstract': ['◈','◆','●','▲','✦','⚡','∞','⚙️','🧩','🎯']
};
var Picker = {
  target: null,
  open: function (label, current, apply) {
    this.apply = apply;
    $('#picker-for').innerHTML = 'For <b>' + esc(label) + '</b>';
    $('#picker-url').value = (current && current.indexOf('http') === 0) ? current : '';
    $('#picker-cats').innerHTML = Object.keys(EMOJI).map(function (cat) {
      return '<div class="cat">' + cat + '</div><div class="emoji-grid">' +
        EMOJI[cat].map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>';
    }).join('');
    $('#picker').hidden = false;
  },
  close: function () { $('#picker').hidden = true; this.apply = null; }
};
$('#picker-cats').addEventListener('click', function (e) {
  var b = e.target.closest('[data-e]'); if (!b || !Picker.apply) return;
  Picker.apply({ icon: b.getAttribute('data-e'), image: '' }); Picker.close();
});
$('#picker-apply').addEventListener('click', function () {
  if (!Picker.apply) return;
  var u = $('#picker-url').value.trim();
  Picker.apply(u ? { icon: '', image: u } : { icon: '', image: '' }); Picker.close();
});
$('#picker-clear').addEventListener('click', function () { if (Picker.apply) Picker.apply({ icon: '', image: '' }); Picker.close(); });
$('#picker-cancel').addEventListener('click', function () { Picker.close(); });
$('#picker').addEventListener('click', function (e) { if (e.target === this) Picker.close(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') Picker.close(); });

/* ============================================================
   Merchant admin
   ============================================================ */
var FONTS = {
  'System (SF / Segoe / Roboto)': "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif",
  'Inter': "'Inter',-apple-system,sans-serif",
  'Georgia (serif)': "Georgia,'Times New Roman',serif",
  'Helvetica / Arial': "Helvetica,Arial,sans-serif",
  'Monospace': "ui-monospace,'SF Mono',Menlo,monospace"
};

var Admin = {
  cfg: null, inst: null, timer: null, category: null,

  /* Step 1. Nothing else in the admin exists until this is answered — the
     merchant picks what they are building, and that seeds a working template. */
  renderChooser: function () {
    var self = this;
    $('#cat-grid').innerHTML = CATS.map(function (c) {
      return '<button class="catcard" data-cat="' + c.id + '">' +
        '<span class="ic">' + c.icon + '</span>' +
        '<b>' + esc(c.label) + '</b>' +
        '<p>' + esc(c.blurb) + '</p>' +
        '<span class="tag">' + esc(c.scene) + '</span></button>';
    }).join('');
    if (!this._chooserBound) {
      this._chooserBound = true;
      $('#cat-grid').addEventListener('click', function (e) {
        var b = e.target.closest('[data-cat]'); if (!b) return;
        self.boot(b.getAttribute('data-cat'));
        Setup.go(Setup.active ? 2 : null);
      });
      $('#cat-change').addEventListener('click', function () { self.showChooser(); });
      $('#setup-again').addEventListener('click', function () { Setup.start(true); });
      $('#setup-skip-all').addEventListener('click', function (e) { e.preventDefault(); Setup.skipAll(); });
    }
  },

  showChooser: function () {
    $('#cat-screen').hidden = false;
    $('#cat-bar').hidden = true;
    $('#admin-editors').hidden = true;
    if (Setup.active) Setup.paint(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  boot: function (categoryId) {
    var c = category(categoryId);
    this.category = c.id;
    this.cfg = withPreset(c.build(), 'glass', 'light');
    $('#cat-bar-icon').innerHTML = c.icon;
    $('#cat-bar-label').textContent = c.label;
    $('#cat-bar-blurb').textContent = c.blurb;
    $('#cat-screen').hidden = true;
    $('#cat-bar').hidden = false;
    $('#admin-editors').hidden = false;
    this.renderEditors();
    this.remount();
    Setup.save();
  },

  /* Debounced so dragging a colour picker doesn't remount 60x a second. */
  touch: function () {
    var self = this;
    $('#ad-live').textContent = 'saving…'; $('#ad-live').className = 'pill warn';
    clearTimeout(this.timer);
    this.timer = setTimeout(function () { self.remount(); self.dumpJson(); Setup.save(); Setup.refreshHint(); }, 180);
  },

  remount: function () {
    if (this.inst) this.inst.destroy();
    this.inst = BundleConfigurator.mount($('#ad-mount'), clone(this.cfg));
    Stats.attach(this.inst, 'admin preview');
    $('#ad-live').textContent = 'live'; $('#ad-live').className = 'pill ok';
  },

  dumpJson: function () {
    var j = JSON.stringify(this.cfg, null, 1);
    $('#ad-size').textContent = (j.length / 1024).toFixed(1) + ' KB / 64 KB metafield';
    $('#ad-json').textContent = j.slice(0, 3000) + (j.length > 3000 ? '\n… (' + (j.length - 3000) + ' more chars)' : '');
  },

  /* ---- brand identity ---- */
  renderBrand: function () {
    var self = this, b = this.cfg.brand = this.cfg.brand || {};
    $('#ad-brand').innerHTML =
      '<div class="ctl"><label>Configurator ID</label><input type="text" data-b="id" value="' + esc(b.id || '') + '" placeholder="e.g. kitchen-fit-out">' +
      '<div class="hint">The merchant\'s own slug for this configurator. Keys their analytics and, once a store runs more than one, the metafield. Never ours.</div></div>' +
      '<div class="ctl"><label>Attribution name</label><input type="text" data-b="name" value="' + esc(b.name || '') + '" placeholder="leave blank for none">' +
      '<div class="hint">Renders in the footer. Blank means no footer at all &mdash; the widget carries no mark of its own.</div></div>' +
      '<div class="ctl"><label>Footer prefix</label><input type="text" data-c="footerPrefix" value="' + esc((this.cfg.copy || {}).footerPrefix || '') + '" placeholder="e.g. Built by"></div>' +
      '<div class="ctl"><label>Footer note</label><input type="text" data-b="footerText" value="' + esc(b.footerText || '') + '" placeholder="e.g. Fitted in a day. Expand any time."></div>';
    if (this._brandBound) { return; } this._brandBound = true;
    $('#ad-brand').addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-b'), ck = e.target.getAttribute('data-c');
      if (k) b[k] = e.target.value;
      else if (ck) { self.cfg.copy = self.cfg.copy || {}; self.cfg.copy[ck] = e.target.value; }
      else return;
      self.touch();
    });
  },

  /* ---- appearance ---- */
  renderAppearance: function () {
    var b = this.cfg.brand, t = b.theme = b.theme || {}, self = this;
    $('#ad-appearance').innerHTML =
      '<div class="ctl"><label>Preset skin</label><div class="seg" data-seg="ad-preset">' +
        ['glass', 'base'].map(function (p) {
          return '<button data-p="' + p + '" aria-pressed="' + (b.preset === p) + '">' + (p === 'glass' ? 'Glass (Apple)' : 'Base (flat)') + '</button>';
        }).join('') + '</div><div class="hint">Glass adds translucency, blur and depth. Base is the original flat theme.</div></div>' +
      '<div class="ctl"><label>Appearance</label><div class="seg" data-seg="ad-app">' +
        ['auto', 'light', 'dark'].map(function (a) {
          return '<button data-a="' + a + '" aria-pressed="' + ((b.appearance || 'auto') === a) + '">' + a + '</button>';
        }).join('') + '</div><div class="hint">Auto follows the shopper\'s own OS setting.</div></div>' +
      '<div class="ctl"><label>Brand colour</label><div class="row">' +
        '<input type="color" id="ad-accent" value="' + esc(t.accent || '#3d5ee6') + '">' +
        '<input type="text" id="ad-accent-hex" value="' + esc(t.accent || '#3d5ee6') + '"></div>' +
        '<div class="hint">Everything else &mdash; hover washes, selected states, glows, the button gradient &mdash; is derived from this one value.</div></div>' +
      '<div class="ctl"><label>Corner radius <span class="mono" id="ad-r-val">' + parseInt(t.radius || 22, 10) + 'px</span></label>' +
        '<input type="range" id="ad-radius" min="0" max="28" value="' + parseInt(t.radius || 22, 10) + '"></div>' +
      '<div class="ctl"><label>Typeface</label><select id="ad-font">' +
        Object.keys(FONTS).map(function (k) {
          return '<option value="' + esc(FONTS[k]) + '"' + (t.font === FONTS[k] ? ' selected' : '') + '>' + k + '</option>';
        }).join('') + '</select></div>' +
      '<div class="ctl"><label>Store name (footer)</label><input type="text" id="ad-name" value="' + esc(b.name || '') + '"></div>' +
      (b.inherited ? '<div class="ctl"><label>Matched from your store</label><div class="row"><span class="pill ok">' + Object.keys(b.inherited).length + ' values inherited</span>' +
        '<button class="btn sm ghost" id="ad-mine">Use my colours instead</button></div>' +
        '<div class="hint">Your choices above always win over the match. This removes the match entirely.</div></div>' : '');

    if ($('#ad-mine')) $('#ad-mine').addEventListener('click', function () { Setup.useMyColours(); });
    seg('ad-preset', 'data-p', function (p) { b.preset = p; self.touch(); });
    seg('ad-app', 'data-a', function (a) { b.appearance = a; self.touch(); });

    var setAccent = function (v) {
      if (!/^#[0-9a-f]{6}$/i.test(v)) return;
      var u = BundleConfigurator.colorUtils;
      var c = u.parse(v);
      t.accent = v;
      t['accent-dark'] = u.hex(u.mix(c, { r: 0, g: 0, b: 0 }, .18));
      t['accent-soft'] = u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, .94));
      t['accent-tint'] = u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, .88));
      t['accent-line'] = u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, .7));
      $('#ad-accent').value = v; $('#ad-accent-hex').value = v;
      self.touch();
    };
    $('#ad-accent').addEventListener('input', function () { setAccent(this.value); });
    $('#ad-accent-hex').addEventListener('change', function () { setAccent(this.value.trim()); });
    $('#ad-radius').addEventListener('input', function () {
      var r = Number(this.value);
      $('#ad-r-val').textContent = r + 'px';
      t.radius = r + 'px'; t['radius-sm'] = Math.max(0, r - 6) + 'px'; t['radius-pill'] = Math.max(0, r - 3) + 'px';
      self.touch();
    });
    $('#ad-font').addEventListener('change', function () { t.font = this.value; self.touch(); });
    $('#ad-name').addEventListener('input', function () { b.name = this.value; self.touch(); });
  },

  /* ---- questions + per-option icons ---- */
  renderSteps: function () {
    var self = this, steps = this.cfg.steps || [];
    $('#ad-steps').innerHTML = steps.map(function (st, i) {
      var kids = (st.options || []).map(function (o, j) { return { o: o, kind: 'options', j: j, label: o.label }; })
        .concat((st.counters || []).map(function (o, j) { return { o: o, kind: 'counters', j: j, label: o.label }; }))
        .concat((st.toggles || []).map(function (o, j) { return { o: o, kind: 'toggles', j: j, label: o.label }; }));
      return '<details class="acc"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="n">' + (i + 1) + '</span><span>' + esc(st.question || st.id || 'Step') + '</span>' +
        '<span class="pill" style="margin-left:auto">' + esc(st.type) + '</span><span class="chev">&#x276F;</span></summary>' +
        '<div class="acc-b">' +
          '<div class="ctl"><label>Question</label><input type="text" data-s="' + i + '" data-k="question" value="' + esc(st.question || '') + '"></div>' +
          '<div class="ctl"><label>Helper text</label><input type="text" data-s="' + i + '" data-k="sub" value="' + esc(st.sub || '') + '"></div>' +
          (kids.length ? '<div class="eyebrow" style="margin:14px 0 7px">Options &amp; icons</div>' + kids.map(function (k) {
            var ic = k.o.image ? '<img src="' + esc(k.o.image) + '" alt="">' : (k.o.icon || '&#43;');
            return '<div class="iconrow">' +
              '<button class="iconbtn" data-icon="' + i + ':' + k.kind + ':' + k.j + '" title="Change icon">' + ic + '</button>' +
              '<input type="text" data-s="' + i + '" data-kind="' + k.kind + '" data-j="' + k.j + '" data-k="label" value="' + esc(k.label || '') + '">' +
              '</div>';
          }).join('') : '') +
          (i > 0 || i < steps.length - 1 ? '<div class="row" style="margin-top:10px">' +
            (i > 0 ? '<button class="btn sm ghost" data-move="' + i + ':-1">&#x2191; Move up</button>' : '') +
            (i < steps.length - 1 ? '<button class="btn sm ghost" data-move="' + i + ':1">&#x2193; Move down</button>' : '') +
            '<button class="btn sm ghost" data-del="' + i + '" style="margin-left:auto;color:#ff9a8a">Remove</button></div>' : '') +
        '</div></details>';
    }).join('');

    if (!this._stepsBound) { this._stepsBound = true;
    $('#ad-steps').addEventListener('input', function (e) {
      var el = e.target; if (el.tagName !== 'INPUT' || el.type !== 'text') return;
      var st = self.cfg.steps[Number(el.getAttribute('data-s'))]; if (!st) return;
      var kind = el.getAttribute('data-kind');
      if (kind) st[kind][Number(el.getAttribute('data-j'))][el.getAttribute('data-k')] = el.value;
      else st[el.getAttribute('data-k')] = el.value;
      self.touch();
    });
    $('#ad-steps').addEventListener('click', function (e) {
      var ib = e.target.closest('[data-icon]');
      if (ib) {
        var p = ib.getAttribute('data-icon').split(':');
        var o = self.cfg.steps[+p[0]][p[1]][+p[2]];
        Picker.open(o.label || 'option', o.image || o.icon, function (v) {
          o.icon = v.icon; o.image = v.image;
          ib.innerHTML = v.image ? '<img src="' + esc(v.image) + '" alt="">' : (v.icon || '&#43;');
          self.touch();
        });
        return;
      }
      var mv = e.target.closest('[data-move]');
      if (mv) {
        var q = mv.getAttribute('data-move').split(':'), i = +q[0], d = +q[1];
        var arr = self.cfg.steps, tmp = arr[i]; arr[i] = arr[i + d]; arr[i + d] = tmp;
        self.renderSteps(); self.touch(); return;
      }
      var dl = e.target.closest('[data-del]');
      if (dl) { self.cfg.steps.splice(+dl.getAttribute('data-del'), 1); self.renderSteps(); self.touch(); }
    }); }
  },

  /* ---- bundles ---- */
  renderBundles: function () {
    var self = this, bs = this.cfg.bundles || [];
    $('#ad-bundles').innerHTML = bs.map(function (b, i) {
      return '<details class="acc"><summary><span class="n">' + (i + 1) + '</span><span>' + esc(b.title || b.id) + '</span>' +
        '<span class="pill" style="margin-left:auto">' + (b.when ? 'conditional' : 'fallback') + '</span><span class="chev">&#x276F;</span></summary>' +
        '<div class="acc-b">' +
        '<div class="ctl"><label>Title</label><input type="text" data-b="' + i + '" data-k="title" value="' + esc(b.title || '') + '"></div>' +
        '<div class="ctl"><label>Subtitle</label><input type="text" data-b="' + i + '" data-k="subtitle" value="' + esc(b.subtitle || '') + '"></div>' +
        '<div class="row"><div class="ctl" style="flex:1"><label>Price</label><input type="number" step="0.01" data-b="' + i + '" data-k="price" value="' + (b.price || 0) + '"></div>' +
        '<div class="ctl" style="flex:1"><label>Variant ID</label><input type="text" data-b="' + i + '" data-k="variantId" value="' + esc(b.variantId || '') + '"></div></div>' +
        '<div class="ctl"><label>Shown when</label><div class="evlog" style="max-height:120px">' + esc(JSON.stringify(b.when || 'always (fallback)', null, 1)) + '</div>' +
        '<div class="hint">In the real admin this is a condition builder &mdash; field / operator / value rows &mdash; not raw JSON.</div></div>' +
        '</div></details>';
    }).join('');
    if (this._bundlesBound) return; this._bundlesBound = true;
    $('#ad-bundles').addEventListener('input', function (e) {
      var el = e.target; if (el.tagName !== 'INPUT') return;
      var b = self.cfg.bundles[Number(el.getAttribute('data-b'))]; if (!b) return;
      var k = el.getAttribute('data-k');
      b[k] = k === 'price' ? Number(el.value) : el.value;
      self.touch();
    });
  },

  /* ---- add-on products (the accessory catalogue) ---- */
  renderProducts: function () {
    var self = this, acc = this.cfg.accessories = this.cfg.accessories || {};
    var keys = Object.keys(acc);
    $('#ad-products').innerHTML = keys.map(function (k) {
      var a = acc[k];
      return '<div class="iconrow prodrow">' +
        '<input type="text" data-p="' + esc(k) + '" data-k="title" value="' + esc(a.title || k) + '" placeholder="Product">' +
        '<input type="number" step="0.01" data-p="' + esc(k) + '" data-k="price" value="' + (a.price || 0) + '" style="max-width:84px">' +
        '<input type="text" data-p="' + esc(k) + '" data-k="variantId" value="' + esc(a.variantId || '') + '" placeholder="Variant ID" class="mono" style="max-width:130px">' +
        '</div>';
    }).join('') || '<p class="note">This template has no add-on products.</p>';
    if (this._productsBound) return; this._productsBound = true;
    $('#ad-products').addEventListener('input', function (e) {
      var el = e.target, a = acc[el.getAttribute('data-p')]; if (!a) return;
      var k = el.getAttribute('data-k');
      a[k] = k === 'price' ? Number(el.value) : el.value;
      self.touch();
    });
  },

  /* ---- add-on rules ---- */
  renderRules: function () {
    var self = this, rs = this.cfg.addonRules || [], acc = this.cfg.accessories || {};
    $('#ad-rules').innerHTML = (rs.length ? rs : []).map(function (r, i) {
      var a = acc[r.accessory] || {};
      return '<details class="acc"><summary><span class="n">' + (i + 1) + '</span><span>' + esc(r.accessory || r.id || 'rule') + '</span>' +
        '<span class="pill" style="margin-left:auto">&times; ' + esc(typeof r.qty === 'object' ? r.qty.expr : (r.qty === undefined ? 1 : r.qty)) + '</span><span class="chev">&#x276F;</span></summary>' +
        '<div class="acc-b">' +
        '<div class="ctl"><label>Shopper sees</label><input type="text" data-r="' + i + '" data-k="text" value="' + esc(r.text || '') + '"></div>' +
        '<div class="ctl"><label>Reason shown beside it</label><input type="text" data-r="' + i + '" data-k="reason" value="' + esc(r.reason || '') + '"></div>' +
        '<div class="ctl"><label>Quantity</label><input type="text" data-r="' + i + '" data-k="qty" value="' + esc(typeof r.qty === 'object' ? r.qty.expr : (r.qty === undefined ? '1' : r.qty)) + '">' +
        '<div class="hint">A number, or an expression over the answers &mdash; <code>max(0, doors - included)</code>. <code>included</code> is how many the chosen bundle already contains, so one rule covers every bundle. Expressions are token-whitelisted before they are compiled.</div></div>' +
        '<div class="ctl"><label>Triggered when</label><div class="evlog" style="max-height:110px">' + esc(JSON.stringify(r.when || 'always', null, 1)) + '</div></div>' +
        (a.price ? '<p class="note">Catalogue: ' + esc(a.title || r.accessory) + ' &mdash; variant <code>' + esc(a.variantId) + '</code>, ' + esc(a.price) + '</p>' : '') +
        '</div></details>';
    }).join('') || '<p class="note">This template has no add-on rules.</p>';
    if (this._rulesBound) return; this._rulesBound = true;
    $('#ad-rules').addEventListener('input', function (e) {
      var el = e.target; if (el.tagName !== 'INPUT') return;
      var r = self.cfg.addonRules[Number(el.getAttribute('data-r'))]; if (!r) return;
      var k = el.getAttribute('data-k'), v = el.value;
      if (k === 'qty') r.qty = /^\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : { expr: v };
      else r[k] = v;
      self.touch();
    });
  },

  /* ---- copy ---- */
  renderCopy: function () {
    var self = this, c = this.cfg.copy = this.cfg.copy || {}, cart = this.cfg.cart = this.cfg.cart || {};
    var fields = [['title', 'Headline'], ['subtitle', 'Sub-headline'], ['ctaLabel', 'Add-to-cart button'],
                  ['finishLabel', 'Final step button'], ['recommendationBadge', 'Result badge'], ['whyTitle', '"Why this bundle" heading']];
    $('#ad-copy').innerHTML = fields.map(function (f) {
      return '<div class="ctl"><label>' + f[1] + '</label><input type="text" data-c="' + f[0] + '" value="' + esc(c[f[0]] || '') + '"></div>';
    }).join('') +
      '<div class="ctl"><label>Cart mode</label><select data-cart="mode">' +
        ['permalink', 'ajax'].map(function (m) { return '<option' + ((cart.mode || 'permalink') === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
      '</select><div class="hint"><b>permalink</b> works on every theme with no JS API. <b>ajax</b> stays on-page and is required for line-item properties or selling plans.</div></div>' +
      '<div class="ctl"><label>Store URL</label><input type="text" data-cart="storeUrl" value="' + esc(cart.storeUrl || '') + '"></div>';
    if (this._copyBound) return; this._copyBound = true;
    $('#ad-copy').addEventListener('input', function (e) {
      var el = e.target, k = el.getAttribute('data-c'), ck = el.getAttribute('data-cart');
      if (k) c[k] = el.value; else if (ck) cart[ck] = el.value; else return;
      self.touch();
    });
    $('#ad-copy').addEventListener('change', function (e) {
      var ck = e.target.getAttribute('data-cart'); if (!ck) return; cart[ck] = e.target.value; self.touch();
    });
  },

  renderEditors: function () {
    this.renderBrand(); this.renderAppearance(); this.renderSteps(); this.renderBundles(); this.renderProducts(); this.renderRules(); this.renderCopy(); this.dumpJson();
  }
};

/* ============================================================
   First access — five steps, one decision each.
   Reuses the editor panels one at a time; nothing is duplicated. Progress and
   the config in progress live in localStorage so a refresh resumes. In the
   real app this state is the merchant's metafield plus an onboarding flag.
   ============================================================ */
var Setup = {
  KEY: 'bcfg.setup', active: false, step: 1, matched: null, confidence: null,

  /* Drop the inherited layer; the merchant's own choices and the preset stand. */
  useMyColours: function () {
    if (Admin.cfg && Admin.cfg.brand) { delete Admin.cfg.brand.inherited; Admin.cfg.brand.appearance = 'auto'; }
    this.matched = null; this.confidence = null;
    var mb = $('#setup-match'); if (mb) { mb.textContent = 'Match my store'; mb.disabled = false; }
    Admin.renderAppearance(); Admin.touch(); this.refreshHint();
  },

  STEPS: {
    2: { title: 'Make it look like your store.',
         why: 'One colour does most of the work. Match your store in a click, or pick your brand colour below. Everything can be changed later.' },
    3: { title: 'Check the questions.',
         why: 'Retitle, reorder or remove. Shoppers finish more often with 4 to 6 questions.' },
    4: { title: 'Connect your products.',
         why: 'Each bundle and add-on needs the Shopify variant it puts in the cart. Prices here are for the preview; checkout always charges the live price.' },
    5: { title: 'You are ready to go live.',
         why: 'Add the CraftFrame Bundle Quiz block to any page in the theme editor. It picks up this setup automatically, and you can keep editing here.' }
  },

  load: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { return null; } },
  save: function () {
    if (!Admin.cfg) return;
    try { localStorage.setItem(this.KEY, JSON.stringify({ active: this.active, step: this.step, category: Admin.category, cfg: Admin.cfg, matched: this.matched, confidence: this.confidence })); } catch (e) { }
  },

  /* Decide where a merchant lands. */
  init: function () {
    var s = this.load();
    Admin.renderChooser();
    if (s && s.cfg && s.category) {
      Admin.category = s.category; Admin.cfg = s.cfg; this.matched = s.matched || null; this.confidence = s.confidence || null;
      var c = category(s.category);
      $('#cat-bar-icon').innerHTML = c.icon; $('#cat-bar-label').textContent = c.label; $('#cat-bar-blurb').textContent = c.blurb;
      $('#cat-screen').hidden = true; $('#cat-bar').hidden = false; $('#admin-editors').hidden = false;
      Admin.renderEditors(); Admin.remount();
      if (s.active) { this.active = true; this.go(s.step || 2); } else this.finish(false);
      return;
    }
    this.start(false);
  },

  start: function (reset) {
    this.active = true; this.step = 1;
    if (reset) { this.matched = null; }
    Admin.showChooser();
    this.paint(1);
    this.save();
  },

  skipAll: function () {
    this.active = false;
    Admin.boot(Admin.category || (CATS[0] || {}).id);
    this.finish(true);
  },

  go: function (n) {
    if (n === null) { this.finish(true); return; }        // category changed outside setup
    this.step = n;
    if (n === 1) { Admin.showChooser(); return; }
    $('#cat-screen').hidden = true; $('#cat-bar').hidden = false; $('#admin-editors').hidden = false;
    this.paint(n);
    this.save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  finish: function (announce) {
    this.active = false;
    $('#setup-rail').hidden = true;
    $('#setup-card').hidden = true;
    $('#admin-editors').removeAttribute('data-setup');
    $('#setup-again').hidden = false;
    this.save();
    if (announce) { $('#ad-live').textContent = 'setup complete'; $('#ad-live').className = 'pill ok'; }
  },

  /* Draw the rail and the step card for step n. */
  paint: function (n) {
    var self = this;
    $('#setup-rail').hidden = false;
    $('#setup-again').hidden = true;
    $$('#setup-rail li').forEach(function (li) {
      var k = Number(li.getAttribute('data-rail'));
      li.setAttribute('data-state', k < n ? 'done' : k === n ? 'current' : '');
    });
    if (n === 1) { $('#setup-card').hidden = true; $('#admin-editors').removeAttribute('data-setup'); return; }
    var st = this.STEPS[n];
    $('#admin-editors').setAttribute('data-setup', n);
    $('#setup-card').hidden = false;
    $('#setup-eyebrow').textContent = 'Step ' + n + ' of 5';
    $('#setup-title').textContent = st.title;
    $('#setup-why').textContent = st.why;
    var actions = '<button class="btn sm ghost" data-go="' + (n - 1) + '">Back</button><span class="spacer"></span>';
    if (n === 2) actions += '<button class="btn sm" id="setup-match">Match my store</button>';
    if (n === 5) {
      actions = '<button class="btn sm ghost" data-go="4">Back</button><span class="spacer"></span>' +
        '<button class="btn sm ghost" id="setup-copy">Copy config</button>' +
        '<button class="btn sm" id="setup-preview">Preview as a shopper</button>' +
        '<button class="btn sm primary" id="setup-done">Open the full editor</button>';
    } else {
      actions += '<button class="btn sm ghost" data-go="' + (n + 1) + '">Skip for now</button>' +
        '<button class="btn sm primary" data-go="' + (n + 1) + '">Continue</button>';
    }
    $('#setup-actions').innerHTML = actions;
    $$('#setup-actions [data-go]').forEach(function (b) { b.addEventListener('click', function () { self.go(Number(b.getAttribute('data-go'))); }); });
    if (n === 2) $('#setup-match').addEventListener('click', function () { self.matchStore(this); });
    if (n === 5) {
      $('#setup-preview').addEventListener('click', function () { Store.mountConfig(Admin.cfg); });
      $('#setup-done').addEventListener('click', function () { self.finish(true); });
      $('#setup-copy').addEventListener('click', function () {
        var b = this, t = JSON.stringify(Admin.cfg, null, 2);
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
          .then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy config'; }, 1600); })
          .catch(function () { b.textContent = 'Use Saved config below'; setTimeout(function () { b.textContent = 'Copy config'; }, 1600); });
      });
    }
    this.refreshHint();
  },

  /* Count what still blocks a real checkout. */
  products: function () {
    var cfg = Admin.cfg || {}, total = 0, missing = 0;
    (cfg.bundles || []).forEach(function (b) { total++; if (!b.variantId) missing++; });
    Object.keys(cfg.accessories || {}).forEach(function (k) { total++; if (!cfg.accessories[k].variantId) missing++; });
    return { total: total, missing: missing };
  },

  refreshHint: function () {
    if (!this.active || this.step < 2) return;
    var n = this.step, cfg = Admin.cfg || {}, h = '';
    if (n === 2) {
      if (this.matched) {
        var c = this.confidence, lvl = c ? c.level : 'high';
        h = '<span class="pill ' + (lvl === 'high' ? 'ok' : lvl === 'medium' ? 'warn' : 'bad') + '">' +
            (lvl === 'high' ? 'Good match' : lvl === 'medium' ? 'Partial match' : 'Weak match') + ' to ' + esc(this.matched) + '</span> ' +
            (c && c.reasons.length ? esc(c.reasons[0]) + '. ' : '') +
            (lvl === 'high' ? 'Change anything below; your choices win over the match.' : 'Check the preview. If it looks off, ') +
            (lvl === 'high' ? '' : '<a href="#" id="setup-mine">use my own colours instead</a>.');
      } else {
        h = 'Or leave the defaults. The widget already fits most themes.';
      }
    }
    if (n === 3) {
      var q = (cfg.steps || []).length;
      h = '<span class="pill ' + (q >= 4 && q <= 6 ? 'ok' : 'warn') + '">' + q + ' question' + (q === 1 ? '' : 's') + '</span>' +
          (q > 6 ? 'Consider removing one or two. Every extra step loses some shoppers.' : q < 4 ? 'Short is fine. Add a question only if it changes what goes in the cart.' : 'Good length.');
    }
    if (n === 4) {
      var p = this.products();
      h = p.missing ? '<span class="pill warn">' + p.missing + ' of ' + p.total + ' need a variant ID</span> Checkout works once they are set. You can finish setup and come back.'
                    : '<span class="pill ok">All ' + p.total + ' products connected</span> Checkout is ready.';
    }
    if (n === 5) {
      var pp = this.products(), b = cfg.brand || {}, c = category(Admin.category);
      h = '<div class="setup-summary">' +
        '<div><small>Category</small><b>' + esc(c.label) + '</b></div>' +
        '<div><small>Look</small><b>' + esc((b.preset || 'glass') + (this.matched ? ', matched' : '') + (b.theme && b.theme.accent ? ', ' + b.theme.accent : '')) + '</b></div>' +
        '<div><small>Questions</small><b>' + (cfg.steps || []).length + '</b></div>' +
        '<div><small>Products</small><b>' + (pp.total - pp.missing) + ' of ' + pp.total + ' connected</b></div></div>' +
        (pp.missing ? '<span class="pill warn">' + pp.missing + ' product' + (pp.missing === 1 ? '' : 's') + ' still need a variant ID</span> The widget works now; checkout adds those once set.' : '');
    }
    $('#setup-hint').innerHTML = h;
    var mine = $('#setup-mine'), self2 = this;
    if (mine) mine.addEventListener('click', function (e) { e.preventDefault(); self2.useMyColours(); });
  },

  /* "Match my store": read the storefront's computed styles and apply them as the
     inherited layer. The mock sniffs the first simulated shop; the real app sniffs
     the merchant's own theme preview. */
  matchStore: function (btn) {
    var self = this;
    btn.textContent = 'Reading your theme…'; btn.disabled = true;
    Theme.ensure();
    var frame = $('#store-sims iframe'), tries = 0;
    (function attempt() {
      var doc = null;
      try { doc = frame && frame.contentDocument; } catch (e) { }
      if (!doc || !doc.body || !doc.body.children.length) {
        if (++tries < 20) return setTimeout(attempt, 100);
        btn.textContent = 'Could not read the theme'; btn.disabled = false; return;
      }
      var p = BundleConfigurator.sniffHost(doc), tokens = BundleConfigurator.tokensFrom(p);
      Admin.cfg.brand.inherited = tokens;
      Admin.cfg.brand.appearance = p.appearance || 'auto';
      self.matched = (STORES[0] || {}).label || 'your store';
      self.confidence = p.confidence || null;
      Admin.renderAppearance(); Admin.touch();
      btn.textContent = 'Matched'; btn.disabled = false;
      self.refreshHint();
    })();
  }
};

seg('ad-device', 'data-d', function (d) { $('#ad-devicebox').className = 'device ' + (d === 'desktop' ? '' : d); });
$('#ad-export').addEventListener('click', function () {
  var t = JSON.stringify(Admin.cfg, null, 2), b = this;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
    .then(function () { b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy JSON'; }, 1600); })
    .catch(function () { b.textContent = 'Select it below'; setTimeout(function () { b.textContent = 'Copy JSON'; }, 1600); });
});
$('#ad-reset').addEventListener('click', function () { Admin.boot(Admin.category); });

/* ============================================================
   Theme sync — simulated storefronts
   ============================================================ */
function confidenceHtml(c) {
  if (!c) return '';
  var cls = c.level === 'high' ? 'ok' : c.level === 'medium' ? 'warn' : 'bad';
  var word = c.level === 'high' ? 'Good match' : c.level === 'medium' ? 'Partial match' : 'Weak match';
  return '<p class="note" style="margin:0 0 8px"><span class="pill ' + cls + '">' + word + ' &middot; ' + Math.round(c.score * 100) + '%</span>' +
    (c.reasons.length ? ' ' + esc(c.reasons.join('. ')) + '.' : ' Colours, type and corners all read cleanly.') + '</p>';
}
function storePage(o) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{margin:0;font-family:' + o.font + ';background:' + o.bg + ';color:' + o.ink + ';font-size:13px}' +
    'header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid ' + o.line + '}' +
    '.brand{font-weight:700;letter-spacing:' + (o.tight ? '-.02em' : '.14em') + ';font-size:' + (o.tight ? '15px' : '11px') + ';text-transform:' + (o.tight ? 'none' : 'uppercase') + '}' +
    'nav a{color:' + o.ink + ';text-decoration:none;margin-left:12px;font-size:11px;opacity:.7}' +
    '.hero{padding:16px 14px}.hero h1{font-size:18px;margin:0 0 6px;font-weight:' + (o.tight ? '700' : '400') + ';letter-spacing:-.02em}' +
    '.hero p{margin:0 0 12px;opacity:.65;font-size:11.5px;line-height:1.5}' +
    'a.link{color:' + o.link + '}' +
    'button.btn,.shopify-payment-button__button{font:inherit;font-size:12px;font-weight:600;padding:10px 18px;border:0;cursor:pointer;' +
      'border-radius:' + o.radius + 'px;background:' + o.btn + ';color:' + o.btnInk + '}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 14px 14px}' +
    '.card{border:1px solid ' + o.line + ';border-radius:' + o.radius + 'px;padding:9px;background:' + o.card + '}' +
    '.card .ph{height:46px;border-radius:' + Math.max(2, o.radius - 4) + 'px;background:' + o.ph + ';margin-bottom:7px}' +
    '.card b{font-size:11.5px;font-weight:600}.card span{display:block;font-size:10.5px;opacity:.6}' +
    '</style></head><body>' +
    '<header><div class="brand">' + o.name + '</div><nav><a href="#">Shop</a><a href="#">About</a><a href="#">Cart</a></nav></header>' +
    '<div class="hero"><h1>' + o.headline + '</h1><p>' + o.blurb + ' <a class="link" href="#">Learn more</a></p>' +
    '<button class="btn shopify-payment-button__button" name="add">' + o.cta + '</button></div>' +
    '<div class="grid">' + [1, 2, 3, 4].map(function (i) {
      return '<div class="card"><div class="ph"></div><b>Product ' + i + '</b><span>&pound;' + (39 + i * 12) + '.00</span></div>';
    }).join('') + '</div></body></html>';
}
var STORES = [
  { id: 'dawn', label: 'Minimal / Dawn-like', note: 'Black buttons, sharp corners, system type',
    o: { name: 'STUDIO NORTH', font: "'Helvetica Neue',Helvetica,Arial,sans-serif", bg: '#ffffff', ink: '#121212',
         line: '#e5e5e5', card: '#ffffff', ph: '#f3f3f3', btn: '#121212', btnInk: '#ffffff', link: '#121212',
         radius: 0, tight: false, headline: 'Considered objects for the home',
         blurb: 'Small batch, made in Yorkshire.', cta: 'Add to cart' } },
  { id: 'dtc', label: 'Bold DTC', note: 'Saturated accent, big radius, geometric type',
    o: { name: 'Bloomly', font: "'Poppins',Verdana,sans-serif", bg: '#fffaf6', ink: '#2b1b2e',
         line: '#f0dfe6', card: '#ffffff', ph: '#fde7ef', btn: '#e0397f', btnInk: '#ffffff', link: '#e0397f',
         radius: 22, tight: true, headline: 'Feel good, obviously ✨',
         blurb: 'Supplements that actually taste alright.', cta: 'Add to bag' } },
  { id: 'lux', label: 'Dark luxury', note: 'Dark canvas, gold accent, serif type',
    o: { name: 'M A I S O N  V', font: "'Didot',Georgia,'Times New Roman',serif", bg: '#0e0d0b', ink: '#efe9dd',
         line: '#2a2621', card: '#15130f', ph: '#1e1a15', btn: '#c9a227', btnInk: '#121008', link: '#c9a227',
         radius: 4, tight: false, headline: 'The Autumn Collection',
         blurb: 'Hand-finished leather goods, numbered.', cta: 'Add to cart' } }
];

var Theme = {
  built: false, picked: null, inst: null, tokens: null,
  ensure: function () {
    if (this.built) return; this.built = true;
    $('#store-sims').innerHTML = STORES.map(function (s) {
      return '<button class="storecard" data-store="' + s.id + '" aria-pressed="false">' +
        '<iframe title="' + esc(s.label) + '" sandbox="allow-same-origin" srcdoc="' + esc(storePage(s.o)) + '"></iframe>' +
        '<div class="meta">' + esc(s.label) + '<small>' + esc(s.note) + '</small></div></button>';
    }).join('');
    $('#store-sims').addEventListener('click', function (e) {
      var c = e.target.closest('[data-store]'); if (!c) return;
      $$('#store-sims [data-store]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      Theme.picked = c.getAttribute('data-store');
      Theme.showPending(c.querySelector('iframe'));
    });
    this.mount(null);
  },
  showPending: function (frame) {
    var s = STORES.filter(function (x) { return x.id === Theme.picked; })[0];
    $('#sniff-out').innerHTML = '<p class="note" style="margin:0 0 12px">Selected <b>' + esc(s.label) + '</b>. ' +
      'Sniffing reads computed styles off that page &mdash; it does not import a single CSS rule.</p>' +
      '<button class="btn primary" id="sniff-go">Sniff this store</button>';
    $('#sniff-go').addEventListener('click', function () { Theme.sniff(frame); });
  },
  sniff: function (frame) {
    var doc;
    try { doc = frame.contentDocument; } catch (e) { doc = null; }
    if (!doc || !doc.body) { $('#sniff-out').innerHTML = '<p class="note">Could not read that frame.</p>'; return; }
    var p = BundleConfigurator.sniffHost(doc);
    var tokens = BundleConfigurator.tokensFrom(p);
    this.tokens = tokens;
    var u = BundleConfigurator.colorUtils;
    var ratio = u.contrast(u.parse(tokens.accent), u.parse(tokens['accent-ink'])).toFixed(2);
    $('#sniff-out').innerHTML =
      '<div class="swatches">' +
        [['accent', p.accent, 'Accent'], ['ink', p.ink, 'Text'], ['paper', p.paper, 'Background']].map(function (s) {
          return '<span class="sw"><i style="background:' + esc(s[1]) + '"></i>' + s[2] + ' ' + esc(s[1]) + '</span>';
        }).join('') +
        '<span class="sw">Radius ' + p.radius + 'px</span>' +
        '<span class="sw">' + esc(p.appearance) + '</span>' +
      '</div>' +
      '<p class="note">Typeface: <code>' + esc((p.font || '').split(',')[0].replace(/"/g, '')) + '</code></p>' +
      confidenceHtml(p.confidence) +
      '<p class="note">Derived <b>' + Object.keys(tokens).length + ' tokens</b> from those six readings. ' +
      'Button text contrast against the accent: <b>' + ratio + ':1</b> ' +
      (ratio >= 4.5 ? '<span class="pill ok">passes AA</span>' : '<span class="pill warn">below AA &mdash; merchant should override</span>') + '</p>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" id="sniff-apply">Apply to the widget</button>' +
      '<button class="btn ghost" id="sniff-reset">Reset</button></div>' +
      '<div class="evlog" style="margin-top:12px;max-height:170px">' + esc(JSON.stringify(tokens, null, 1)) + '</div>';
    $('#sniff-apply').addEventListener('click', function () { Theme.mount(tokens, p.appearance); });
    $('#sniff-reset').addEventListener('click', function () { Theme.mount(null); });
  },
  mount: function (tokens, appearance) {
    if (this.inst) this.inst.destroy();
    var cfg = withPreset(buildCategory('subscription-box'), 'glass', appearance || 'light');
    if (tokens) { cfg.brand.inherited = tokens; cfg.brand.theme = {}; }
    this.inst = BundleConfigurator.mount($('#theme-mount'), cfg);
    Stats.attach(this.inst, 'theme demo');
    $('#sniff-state').textContent = tokens ? 'inherited from store' : 'not applied';
    $('#sniff-state').className = 'pill ' + (tokens ? 'ok' : '');
  }
};

/* ============================================================
   Analytics
   ============================================================ */
var Stats = {
  sessions: [], cur: null, log: [], synthetic: false,

  attach: function (inst, source) {
    var self = this;
    inst.on('step', function (i) { self.hit('step', { step: i }, source); });
    inst.on('answer', function (a) { self.hit('answer', a, source); });
    inst.on('result', function (r) { self.hit('result', { bundle: r.bundle.title, total: r.orderTotal, addons: r.addonCount }, source); });
    inst.on('addtocart', function (r) { self.hit('addtocart', { bundle: r.bundle.title, total: r.orderTotal }, source); });
  },

  hit: function (type, payload, source) {
    if (!this.cur || this.cur.done) {
      this.cur = { reached: 0, done: false, bundle: null, total: 0, added: false, live: true };
      this.sessions.push(this.cur);
    }
    if (type === 'step') this.cur.reached = Math.max(this.cur.reached, payload.step);
    if (type === 'result') { this.cur.bundle = payload.bundle; this.cur.total = payload.total; this.cur.reached = 99; }
    if (type === 'addtocart') { this.cur.added = true; this.cur.done = true; }
    var t = new Date().toLocaleTimeString('en-GB');
    this.log.unshift('<div><span class="t">' + t + '</span> <b>' + type + '</b> ' +
      esc(JSON.stringify(payload)) + ' <span class="t">' + esc(source) + '</span></div>');
    this.log = this.log.slice(0, 90);
    if (!$('[data-panel="stats"]').hidden) this.render();
  },

  steps: function () {
    var s = (Store.inst && Store.inst.cfg.steps) || buildCategory(Store.category).steps;
    return s.map(function (x, i) { return x.question || ('Step ' + (i + 1)); });
  },

  simulate: function () {
    // Synthetic funnel: a plausible per-question drop-off, so the shape of the
    // report is legible before a single real store has installed the app.
    var labels = this.steps(), n = 500;
    var keep = [1, .88, .79, .71, .66, .61, .58];
    var bundles = ['Essential', 'Standard', 'Complete', 'Complete + garden'];
    this.sessions = []; this.synthetic = true;
    for (var i = 0; i < n; i++) {
      var reached = 0;
      for (var s = 0; s < labels.length; s++) {
        if (Math.random() < (keep[Math.min(s, keep.length - 1)] / (s === 0 ? 1 : keep[Math.min(s - 1, keep.length - 1)]))) reached = s;
        else break;
      }
      var finished = reached === labels.length - 1 && Math.random() < .78;
      this.sessions.push({
        reached: finished ? 99 : reached, done: true,
        bundle: finished ? bundles[Math.floor(Math.random() * bundles.length)] : null,
        total: finished ? 180 + Math.round(Math.random() * 420) : 0,
        added: finished && Math.random() < .62
      });
    }
    this.render();
  },

  render: function () {
    var labels = this.steps(), ss = this.sessions;
    var total = ss.length || 0;
    var reachedResult = ss.filter(function (s) { return s.reached === 99; }).length;
    var added = ss.filter(function (s) { return s.added; }).length;
    var aov = added ? ss.filter(function (s) { return s.added; }).reduce(function (a, s) { return a + s.total; }, 0) / added : 0;

    $('#ev-src').textContent = this.synthetic ? '500 simulated sessions' : 'your session (' + total + ')';
    $('#ev-kpis').innerHTML = [
      ['Sessions', total, 'started the configurator'],
      ['Completed', reachedResult + (total ? ' · ' + Math.round(reachedResult / total * 100) + '%' : ''), 'saw a recommendation'],
      ['Added to cart', added + (reachedResult ? ' · ' + Math.round(added / reachedResult * 100) + '%' : ''), 'of those who finished'],
      ['Configured AOV', aov ? '£' + aov.toFixed(0) : '—', 'average configured basket']
    ].map(function (k) {
      return '<div class="kpi"><div class="v">' + esc(k[1]) + '</div><div class="k">' + esc(k[0]) + '</div><div class="d">' + esc(k[2]) + '</div></div>';
    }).join('');

    var rows = labels.map(function (l, i) {
      return { label: (i + 1) + '. ' + l, n: ss.filter(function (s) { return s.reached >= i; }).length };
    });
    rows.push({ label: '✓ Recommendation', n: reachedResult });
    rows.push({ label: '✓ Added to cart', n: added });

    var top = rows.length ? rows[0].n || 1 : 1;
    $('#ev-funnel').innerHTML = rows.map(function (r, i) {
      var prev = i ? rows[i - 1].n : r.n;
      var drop = prev ? Math.round((1 - r.n / prev) * 100) : 0;
      return '<div class="fstep"><div class="lb" title="' + esc(r.label) + '">' + esc(r.label) + '</div>' +
        '<div class="fbar"><i style="width:' + (top ? (r.n / top * 100) : 0).toFixed(1) + '%"></i></div>' +
        '<div class="nm"><b>' + r.n + '</b>' + (i && drop > 0 ? ' <span class="drop">−' + drop + '%</span>' : '') + '</div></div>';
    }).join('');

    var mix = {};
    ss.forEach(function (s) { if (s.bundle) mix[s.bundle] = (mix[s.bundle] || 0) + 1; });
    var keys = Object.keys(mix).sort(function (a, b) { return mix[b] - mix[a]; });
    var mixTop = keys.length ? mix[keys[0]] : 1;
    $('#ev-mix').innerHTML = keys.length ? '<div class="funnel">' + keys.map(function (k) {
      var pct = reachedResult ? Math.round(mix[k] / reachedResult * 100) : 0;
      return '<div class="fstep mixrow"><div class="lb" title="' + esc(k) + '">' + esc(k) + '</div>' +
        '<div class="fbar"><i style="width:' + (mix[k] / mixTop * 100).toFixed(1) + '%"></i></div>' +
        '<div class="nm"><b>' + mix[k] + '</b> ' + pct + '%</div></div>';
    }).join('') + '</div>' : '<p class="note">No completed sessions yet.</p>';

    $('#ev-log').innerHTML = this.log.join('') || '<div>Waiting for events&hellip;</div>';
  }
};
$('#ev-sim').addEventListener('click', function () { Stats.simulate(); });
$('#ev-clear').addEventListener('click', function () { Stats.sessions = []; Stats.log = []; Stats.cur = null; Stats.synthetic = false; Stats.render(); });

/* ---------- go ---------- */
Store.mount();
Setup.init();
Stats.render();
})();
