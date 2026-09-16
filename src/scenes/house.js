/* ============================================================
   Scene: "house" — isometric-style property illustration.

   Category-specific (anything fitted to a property), but fully de-branded and
   field-mapped: it never assumes a field name, a label or a colour. Every
   colour is a --bcfg-scene-* custom property read at render time. Ship it only
   for merchants whose questionnaire is about a building.

   scene: {
     type: 'house',
     options: {
       fields:  { type,doors,windows,floors,garage,shed,garden,second,pets,petSize },
       reveal:  { doors:1, windows:2, outdoor:3, pets:4, siren:5 },   // step thresholds
       labels:  { garage,shed,second,secondPill,motion,siren },
       flatValue: 'flat',            // value of `type` meaning "single-level, flat roof"
       badgeText: '',                // 2–3 char wall badge, '' to omit
       sirenWhen: <condition>,       // when to show the external sounder
       palette: { ... }              // any override of the defaults below
     }
   }
   ============================================================ */
(function (root) {
  'use strict';
  var API = root.BundleConfigurator || (typeof require === 'function' ? require('../configurator.js') : null);
  if (!API) return;

  var DEFAULT_FIELDS = { type: 'homeType', doors: 'doors', windows: 'windows', floors: 'floors', garage: 'hasGarage', shed: 'hasShed', garden: 'hasGarden', second: 'hasSecondUnit', pets: 'hasPets', petSize: 'petSize' };
  var DEFAULT_REVEAL = { doors: 1, windows: 2, outdoor: 3, pets: 4, siren: 5 };
  var DEFAULT_LABELS = { garage: 'GARAGE', shed: 'OUTBUILDING', second: 'SECOND SITE', secondPill: '2nd Unit', motion: 'Motion sensor', siren: 'Sounder', empty: 'Choose your property type', emptySub: 'to start building' };

  /* Every colour in this illustration is a CSS custom property read off the
     mount node, so the scene retints with the store instead of carrying a
     palette of its own. The literals below are last-resort fallbacks for a
     page that loaded the script without the stylesheet — nothing here is a
     brand value, and `opts.palette` still overrides any of it per merchant. */
  var FALLBACK = {
    wall: '#eae6e1', wallShade: '#ddd9d3', wallDark: '#d0ccc6', brick: '#d8d4ce',
    roof: '', roofDark: '',
    door: '#1a1a1a', doorFrame: '', doorPanel: '#2a2a2a',
    window: '#c8dff0', windowFrame: '#555',
    ground: '#d6d2cc', grass: '#b8ddb0',
    garage: '#d4d0cb', garageDark: '#bbb7b0', garageFace: '#e2ddd7',
    outbuilding: '#c4a97d', outbuildingDark: '#a88f6a', outbuildingRoof: '#8b7355',
    chimney: '#b0aba4', chimneyCap: '#9a958e',
    pet: '', petEye: '#1a1a1a', alert: '',
    tree: '#7aae6c', treeDark: '#5a8e4e', trunk: '#8b6f47', fence: '#c4b99a',
    node1: '#2980b9', node2: '#27ae60', node3: '#8e44ad', node4: '#e67e22',
    sky1: '#dce9f4', sky2: '#f0eeeb',
    pill: '#ffffff', pillInk: '#333333', gloss: '#ffffff', shadow: '#000000',
    ghostLine: '#dddddd', ghostInk: '#cccccc', ghostFaint: '#bbbbbb'
  };

  API.registerScene('house', function (state, opts, cfg, scope, inst) {
    var F = Object.assign({}, DEFAULT_FIELDS, opts.fields || {});
    var R = Object.assign({}, DEFAULT_REVEAL, opts.reveal || {});
    var L = Object.assign({}, DEFAULT_LABELS, opts.labels || {});

    var cs = null;
    try { if (inst && inst.el && root.getComputedStyle) cs = root.getComputedStyle(inst.el); } catch (e) { }
    var tok = function (name, fallback) {
      var v = cs ? cs.getPropertyValue('--bcfg-scene-' + name).trim() : '';
      return v || fallback;
    };
    var accent = tok('accent', '') || (cs ? cs.getPropertyValue('--bcfg-accent').trim() : '') || '#4a6cf7';
    var accentDark = (cs ? cs.getPropertyValue('--bcfg-accent-dark').trim() : '') || accent;

    var C = {};
    Object.keys(FALLBACK).forEach(function (k) { C[k] = tok(k, FALLBACK[k]); });
    C.roof = C.roof || accent; C.roofDark = C.roofDark || accentDark;
    C.doorFrame = C.doorFrame || accent; C.pet = C.pet || accent; C.alert = C.alert || accent;
    C = Object.assign(C, opts.palette || {});

    var step = state.step || 0;
    var type = state[F.type];
    var floors = Math.max(1, Number(state[F.floors]) || 1);
    var doors = Math.max(0, Number(state[F.doors]) || 0);
    var windows = Math.max(0, Number(state[F.windows]) || 0);
    var isFlat = type === (opts.flatValue || 'flat');

    var houseW = 200, floorH = 70, houseX = 200, groundY = 340;
    var totalH = floors * floorH;
    var houseTopY = groundY - totalH;
    var roofPeak = isFlat ? houseTopY - 6 : houseTopY - 45;

    var svg = '<defs>' +
      '<linearGradient id="bcfgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + C.sky1 + '"/><stop offset="100%" stop-color="' + C.sky2 + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="bcfgWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + C.wall + '"/><stop offset="100%" stop-color="' + C.wallShade + '"/></linearGradient>' +
      '<linearGradient id="bcfgRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + C.roof + '"/><stop offset="100%" stop-color="' + C.roofDark + '"/></linearGradient>' +
      '<filter id="bcfgShadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="' + C.shadow + '" flood-opacity="0.08"/></filter>' +
      '<filter id="bcfgGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>';

    svg += '<rect x="0" y="0" width="600" height="' + groundY + '" fill="url(#bcfgSky)" opacity="0.5"/>';
    svg += '<rect class="scene-el" x="0" y="' + groundY + '" width="600" height="60" fill="' + C.ground + '" opacity="0.4"/>';
    svg += '<rect x="' + (houseX + houseW / 2 - 18) + '" y="' + groundY + '" width="36" height="55" fill="' + C.ground + '" opacity="0.7"/>';

    var showOutdoor = step >= R.outdoor;

    /* ── grounds ── */
    if (state[F.garden] && showOutdoor) {
      svg += '<rect class="scene-el scene-pop" x="20" y="' + groundY + '" width="160" height="50" rx="4" fill="' + C.grass + '" opacity="0.45"/>';
      svg += '<rect class="scene-el scene-pop" x="420" y="' + groundY + '" width="160" height="50" rx="4" fill="' + C.grass + '" opacity="0.45"/>';
      [[55, groundY], [530, groundY]].forEach(function (p) {
        svg += '<g class="scene-pop"><rect x="' + (p[0] - 3) + '" y="' + (p[1] - 28) + '" width="6" height="28" rx="2" fill="' + C.trunk + '"/>' +
          '<ellipse cx="' + p[0] + '" cy="' + (p[1] - 38) + '" rx="18" ry="16" fill="' + C.tree + '" opacity="0.8"/>' +
          '<ellipse cx="' + (p[0] - 6) + '" cy="' + (p[1] - 34) + '" rx="10" ry="9" fill="' + C.treeDark + '" opacity="0.4"/></g>';
      });
      [[20, 155], [438, 578]].forEach(function (r) {
        for (var fx = r[0]; fx < r[1]; fx += 18) svg += '<rect x="' + fx + '" y="' + (groundY - 22) + '" width="4" height="26" rx="1" fill="' + C.fence + '" opacity="0.4"/>';
        svg += '<rect x="' + r[0] + '" y="' + (groundY - 16) + '" width="138" height="3" rx="1" fill="' + C.fence + '" opacity="0.35"/>';
        svg += '<rect x="' + r[0] + '" y="' + (groundY - 6) + '" width="138" height="3" rx="1" fill="' + C.fence + '" opacity="0.35"/>';
      });
    }

    /* ── outbuilding ── */
    if (state[F.shed] && showOutdoor) {
      var sx = 30, sy = groundY - 52, sw = 55, sh = 52;
      svg += '<g class="scene-pop" filter="url(#bcfgShadow)">' +
        '<rect x="' + sx + '" y="' + sy + '" width="' + sw + '" height="' + sh + '" rx="2" fill="' + C.outbuilding + '"/>' +
        '<polygon points="' + (sx - 3) + ',' + (sy + 4) + ' ' + (sx + sw + 3) + ',' + (sy + 4) + ' ' + (sx + sw + 3) + ',' + (sy - 2) + ' ' + (sx - 3) + ',' + (sy - 2) + '" fill="' + C.outbuildingRoof + '"/>' +
        '<rect x="' + (sx + 18) + '" y="' + (sy + 20) + '" width="20" height="32" rx="2" fill="' + C.outbuildingDark + '"/>' +
        '<text x="' + (sx + sw / 2) + '" y="' + (sy - 8) + '" text-anchor="middle" class="scene-label" fill="' + C.outbuildingRoof + '" opacity="0.8">' + L.shed + '</text></g>' +
        '<g class="scene-pop"><rect x="' + (sx + sw - 4) + '" y="' + (sy + 14) + '" width="7" height="12" rx="2" fill="' + C.node1 + '"/>' +
        '<rect x="' + (sx + sw + 3) + '" y="' + (sy + 16) + '" width="5" height="8" rx="1.5" fill="' + C.node1 + '" opacity="0.6"/></g>';
    }

    /* ── garage ── */
    if (state[F.garage] && showOutdoor) {
      var gx = 425, gy = groundY - 62, gw = 70, gh = 62, slats = '';
      for (var i = 0; i < 4; i++) slats += '<line x1="' + (gx + 8) + '" y1="' + (gy + 24 + i * 10) + '" x2="' + (gx + gw - 8) + '" y2="' + (gy + 24 + i * 10) + '" stroke="' + C.ground + '" stroke-width="1" opacity="0.5"/>';
      svg += '<g class="scene-pop" filter="url(#bcfgShadow)">' +
        '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" rx="2" fill="' + C.garage + '"/>' +
        '<polygon points="' + (gx - 3) + ',' + (gy + 4) + ' ' + (gx + gw + 3) + ',' + (gy + 4) + ' ' + (gx + gw + 3) + ',' + (gy - 2) + ' ' + (gx - 3) + ',' + (gy - 2) + '" fill="' + C.garageDark + '"/>' +
        '<rect x="' + (gx + 8) + '" y="' + (gy + 14) + '" width="' + (gw - 16) + '" height="' + (gh - 14) + '" rx="2" fill="' + C.wallDark + '"/>' + slats +
        '<text x="' + (gx + gw / 2) + '" y="' + (gy - 8) + '" text-anchor="middle" class="scene-label" fill="' + C.garageDark + '" opacity="0.8">' + L.garage + '</text></g>' +
        '<g class="scene-pop"><rect x="' + (gx + gw - 3) + '" y="' + (gy + 18) + '" width="7" height="12" rx="2" fill="' + C.node1 + '"/>' +
        '<rect x="' + (gx + gw + 4) + '" y="' + (gy + 20) + '" width="5" height="8" rx="1.5" fill="' + C.node1 + '" opacity="0.6"/></g>';
    }

    /* ── second unit ── */
    if (state[F.second] && showOutdoor) {
      var hx = 500, hy = groundY - 58, hw = 56, hh = 50;
      svg += '<g class="scene-pop" filter="url(#bcfgShadow)">' +
        '<rect x="' + hx + '" y="' + hy + '" width="' + hw + '" height="' + (hh + 8) + '" rx="2" fill="' + C.garageFace + '"/>' +
        '<polygon points="' + (hx - 4) + ',' + hy + ' ' + (hx + hw / 2) + ',' + (hy - 18) + ' ' + (hx + hw + 4) + ',' + hy + '" fill="' + C.roof + '" opacity="0.75"/>' +
        '<rect x="' + (hx + 20) + '" y="' + (hy + 24) + '" width="16" height="34" rx="2" fill="' + C.door + '"/>' +
        '<rect x="' + (hx + 6) + '" y="' + (hy + 10) + '" width="14" height="12" rx="1.5" fill="' + C.window + '" stroke="' + C.windowFrame + '" stroke-width="1.2"/>' +
        '<rect x="' + (hx + 38) + '" y="' + (hy + 10) + '" width="12" height="12" rx="1.5" fill="' + C.window + '" stroke="' + C.windowFrame + '" stroke-width="1.2"/>' +
        '<rect x="' + (hx + hw / 2 - 6) + '" y="' + (hy + 2) + '" width="12" height="16" rx="3" fill="' + C.node4 + '" opacity="0.85"/>' +
        '<circle cx="' + (hx + hw / 2) + '" cy="' + (hy + 10) + '" r="10" fill="' + C.node4 + '" opacity="0.1" class="scene-pulse"/></g>' +
        '<text x="' + (hx + hw / 2) + '" y="' + (hy - 24) + '" text-anchor="middle" class="scene-label" fill="' + C.roof + '" opacity="0.8">' + L.second + '</text>' +
        '<g class="scene-pop"><line x1="' + (hx + hw + 4) + '" y1="' + (hy + 10) + '" x2="' + (hx + hw + 20) + '" y2="' + (hy + 10) + '" stroke="' + C.node4 + '" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>' +
        '<rect x="' + (hx + hw + 20) + '" y="' + (hy + 1) + '" width="62" height="18" rx="9" fill="' + C.pill + '" stroke="' + C.node4 + '" stroke-width="1.5"/>' +
        '<circle cx="' + (hx + hw + 30) + '" cy="' + (hy + 10) + '" r="3" fill="' + C.node4 + '"/>' +
        '<text x="' + (hx + hw + 38) + '" y="' + (hy + 14) + '" font-size="7" font-weight="800" fill="' + C.pillInk + '">' + L.secondPill + '</text></g>';
    }

    /* ── main building ── */
    if (type) {
      svg += '<g filter="url(#bcfgShadow)"><rect class="scene-el" x="' + houseX + '" y="' + houseTopY + '" width="' + houseW + '" height="' + totalH + '" fill="url(#bcfgWall)"/></g>';
      for (var by = houseTopY + 8; by < groundY; by += 12) {
        var off = ((by - houseTopY) / 12) % 2 === 0 ? 0 : 14;
        for (var bx = houseX + off; bx < houseX + houseW - 2; bx += 28)
          svg += '<rect x="' + (bx + 1) + '" y="' + by + '" width="26" height="10" rx="1" fill="' + C.brick + '" opacity="0.25"/>';
      }
      if ((opts.attachedValues || []).indexOf(type) > -1) {
        svg += '<rect class="scene-el" x="' + (houseX + houseW) + '" y="' + (houseTopY + 5) + '" width="60" height="' + (totalH - 5) + '" fill="' + C.wallDark + '" opacity="0.45"/>';
        if (!isFlat) svg += '<polygon class="scene-el" points="' + (houseX + houseW) + ',' + (houseTopY + 5) + ' ' + (houseX + houseW + 60) + ',' + (houseTopY + 5) + ' ' + (houseX + houseW + 60) + ',' + (houseTopY - 20) + '" fill="' + C.roofDark + '" opacity="0.25"/>';
      }
      for (var f = 1; f < floors; f++) {
        var fy = groundY - f * floorH;
        svg += '<line class="scene-el" x1="' + houseX + '" y1="' + fy + '" x2="' + (houseX + houseW) + '" y2="' + fy + '" stroke="' + C.wallDark + '" stroke-width="1.5" opacity="0.3"/>';
      }

      /* roof */
      if (isFlat) {
        svg += '<rect class="scene-el" x="' + (houseX - 4) + '" y="' + (houseTopY - 8) + '" width="' + (houseW + 8) + '" height="10" rx="2" fill="' + C.roofDark + '"/>';
      } else {
        var ov = 14;
        svg += '<polygon class="scene-el" points="' + (houseX - ov) + ',' + houseTopY + ' ' + (houseX + houseW / 2) + ',' + roofPeak + ' ' + (houseX + houseW + ov) + ',' + houseTopY + '" fill="url(#bcfgRoof)"/>';
        for (var ry = roofPeak + 10; ry < houseTopY; ry += 8) {
          var pc = (ry - roofPeak) / (houseTopY - roofPeak);
          svg += '<line x1="' + (houseX - ov * pc + houseW / 2 * (1 - pc)) + '" y1="' + ry + '" x2="' + (houseX + houseW + ov * pc - houseW / 2 * (1 - pc)) + '" y2="' + ry + '" stroke="' + C.roofDark + '" stroke-width="0.5" opacity="0.3"/>';
        }
        var cx0 = houseX + houseW - 35, ct = roofPeak - 10, cr = houseTopY - (houseTopY - roofPeak) * 0.35;
        svg += '<g class="scene-el"><rect x="' + cx0 + '" y="' + ct + '" width="22" height="' + (cr - ct + 8) + '" rx="2" fill="' + C.chimney + '"/>' +
          '<rect x="' + (cx0 - 2) + '" y="' + (ct - 3) + '" width="26" height="6" rx="2" fill="' + C.chimneyCap + '"/></g>';
      }

      /* doors */
      if (step >= R.doors) {
        var dW = 28, dH = 54, maxD = Math.min(doors, 3), sp = houseW / (maxD + 1);
        for (var d = 0; d < maxD; d++) {
          var dx = houseX + sp * (d + 1) - dW / 2, dy = groundY - dH;
          svg += '<rect class="scene-pop" x="' + (dx - 2) + '" y="' + (dy - 4) + '" width="' + (dW + 4) + '" height="' + (dH + 4) + '" rx="3" fill="' + C.doorFrame + '"/>' +
            '<rect x="' + dx + '" y="' + dy + '" width="' + dW + '" height="' + dH + '" rx="2" fill="' + C.door + '"/>' +
            '<rect x="' + (dx + 4) + '" y="' + (dy + 6) + '" width="' + (dW - 8) + '" height="16" rx="2" fill="' + C.doorPanel + '"/>' +
            '<rect x="' + (dx + 4) + '" y="' + (dy + 28) + '" width="' + (dW - 8) + '" height="16" rx="2" fill="' + C.doorPanel + '"/>' +
            '<circle cx="' + (dx + dW - 7) + '" cy="' + (dy + dH / 2) + '" r="2.5" fill="' + C.doorFrame + '"/>' +
            '<g class="scene-pop"><circle cx="' + (dx + dW + 5) + '" cy="' + (dy + 10) + '" r="6" fill="' + C.node1 + '" opacity="0.15" class="scene-pulse"/>' +
            '<rect x="' + (dx + dW + 1) + '" y="' + (dy + 6) + '" width="8" height="8" rx="2" fill="' + C.node1 + '" opacity="0.9"/>' +
            '<rect x="' + (dx + dW + 9) + '" y="' + (dy + 7.5) + '" width="5" height="5" rx="1.5" fill="' + C.node1 + '" opacity="0.55"/></g>';
        }
      }

      /* windows — placed in the gaps between doors */
      if (step >= R.windows) {
        var wW = 32, wH = 30, gf = Math.min(windows, 4), pos = [];
        var mD = Math.min(doors, 3), sp2 = houseW / (mD + 1), zones = [];
        for (var z = 0; z < mD; z++) { var c0 = houseX + sp2 * (z + 1); zones.push({ l: c0 - 22, r: c0 + 22 }); }
        var gaps = [], prev = houseX + 4;
        zones.forEach(function (zn) { gaps.push({ l: prev, r: zn.l }); prev = zn.r; });
        gaps.push({ l: prev, r: houseX + houseW - 4 });
        gaps = gaps.filter(function (g) { return g.r - g.l >= wW + 4; }).sort(function (a, b) { return (b.r - b.l) - (a.r - a.l); });
        var placed = 0;
        for (var gi = 0; gi < gaps.length && placed < gf; gi++) {
          var g = gaps[gi], gwid = g.r - g.l;
          var fit = Math.min(Math.floor(gwid / (wW + 4)), gf - placed), ws = gwid / (fit + 1);
          for (var wi = 0; wi < fit; wi++) { pos.push(g.l + ws * (wi + 1) - wW / 2); placed++; }
        }
        pos.forEach(function (wx, idx) {
          var wy = groundY - floorH + 12;
          svg += '<rect class="scene-pop" x="' + (wx - 2) + '" y="' + (wy + wH) + '" width="' + (wW + 4) + '" height="4" rx="1" fill="' + C.wallDark + '"/>' +
            '<rect class="scene-pop" x="' + wx + '" y="' + wy + '" width="' + wW + '" height="' + wH + '" rx="2" fill="' + C.window + '" stroke="' + C.windowFrame + '" stroke-width="1.8"/>' +
            '<line x1="' + (wx + wW / 2) + '" y1="' + wy + '" x2="' + (wx + wW / 2) + '" y2="' + (wy + wH) + '" stroke="' + C.windowFrame + '" stroke-width="1"/>' +
            '<line x1="' + wx + '" y1="' + (wy + wH / 2) + '" x2="' + (wx + wW) + '" y2="' + (wy + wH / 2) + '" stroke="' + C.windowFrame + '" stroke-width="1"/>';
          if (idx < 2) svg += '<g class="scene-pop"><circle cx="' + (wx + wW + 4) + '" cy="' + (wy + wH - 5) + '" r="6" fill="' + C.node2 + '" opacity="0.15" class="scene-pulse"/>' +
            '<rect x="' + (wx + wW) + '" y="' + (wy + wH - 10) + '" width="7" height="12" rx="2" fill="' + C.node2 + '"/></g>';
        });
        for (var uf = 1; uf < floors; uf++) {
          var uw = Math.min(3, gf), us = houseW / (uw + 1);
          for (var w = 0; w < uw; w++) {
            var ux = houseX + us * (w + 1) - wW / 2, uy = groundY - (uf + 1) * floorH + 14;
            svg += '<rect class="scene-pop" x="' + (ux - 2) + '" y="' + (uy + wH) + '" width="' + (wW + 4) + '" height="3" rx="1" fill="' + C.wallDark + '"/>' +
              '<rect class="scene-pop" x="' + ux + '" y="' + uy + '" width="' + wW + '" height="' + wH + '" rx="2" fill="' + C.window + '" stroke="' + C.windowFrame + '" stroke-width="1.5"/>' +
              '<line x1="' + (ux + wW / 2) + '" y1="' + uy + '" x2="' + (ux + wW / 2) + '" y2="' + (uy + wH) + '" stroke="' + C.windowFrame + '" stroke-width="0.8"/>' +
              '<line x1="' + ux + '" y1="' + (uy + wH / 2) + '" x2="' + (ux + wW) + '" y2="' + (uy + wH / 2) + '" stroke="' + C.windowFrame + '" stroke-width="0.8"/>';
          }
        }
      }

      /* external sounder */
      if (step >= R.siren && opts.sirenWhen && API.test(opts.sirenWhen, scope)) {
        var qx = houseX + 12, qy = houseTopY + 15;
        svg += '<g class="scene-pop" filter="url(#bcfgGlow)">' +
          '<rect x="' + qx + '" y="' + qy + '" width="28" height="20" rx="4" fill="' + C.alert + '"/>' +
          '<rect x="' + (qx + 3) + '" y="' + (qy + 4) + '" width="22" height="5" rx="2" fill="' + C.pill + '" opacity="0.3"/>' +
          (opts.badgeText ? '<text x="' + (qx + 14) + '" y="' + (qy + 16) + '" text-anchor="middle" font-size="6" font-weight="900" fill="' + C.pill + '">' + opts.badgeText + '</text>' : '') +
          '<circle cx="' + (qx + 14) + '" cy="' + (qy + 10) + '" r="10" fill="' + C.alert + '" opacity="0.1" class="scene-pulse"/></g>' +
          '<line x1="' + (qx - 2) + '" y1="' + (qy + 10) + '" x2="' + (qx - 30) + '" y2="' + (qy + 10) + '" stroke="' + C.alert + '" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>' +
          '<g><rect x="' + (qx - 104) + '" y="' + (qy + 1) + '" width="72" height="18" rx="9" fill="' + C.pill + '" stroke="' + C.alert + '" stroke-width="1.5"/>' +
          '<circle cx="' + (qx - 94) + '" cy="' + (qy + 10) + '" r="3" fill="' + C.alert + '"/>' +
          '<text x="' + (qx - 86) + '" y="' + (qy + 14) + '" font-size="7.5" font-weight="800" fill="' + C.pillInk + '">' + L.siren + '</text></g>';
      }

      /* motion sensor + hub */
      if (step >= R.windows) {
        var px = houseX + houseW - 22, py = houseTopY + (floors > 1 ? floorH + 10 : 15);
        svg += '<g class="scene-pop"><polygon points="' + px + ',' + (py + 14) + ' ' + (px + 8) + ',' + py + ' ' + (px + 16) + ',' + (py + 14) + '" fill="' + C.pill + '" stroke="' + C.node3 + '" stroke-width="1.5"/>' +
          '<circle cx="' + (px + 8) + '" cy="' + (py + 9) + '" r="2.5" fill="' + C.node3 + '" opacity="0.5"/>' +
          '<circle cx="' + (px + 8) + '" cy="' + (py + 9) + '" r="7" fill="' + C.node3 + '" opacity="0.08" class="scene-pulse"/></g>' +
          '<path d="M' + (px - 5) + ',' + (py + 14) + ' Q' + (px + 8) + ',' + (py - 12) + ' ' + (px + 21) + ',' + (py + 14) + '" fill="none" stroke="' + C.node3 + '" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.35"/>' +
          '<line x1="' + (px + 20) + '" y1="' + (py + 7) + '" x2="' + (px + 44) + '" y2="' + (py + 7) + '" stroke="' + C.node3 + '" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>' +
          '<g><rect x="' + (px + 44) + '" y="' + (py - 2) + '" width="80" height="18" rx="9" fill="' + C.pill + '" stroke="' + C.node3 + '" stroke-width="1.5"/>' +
          '<circle cx="' + (px + 54) + '" cy="' + (py + 7) + '" r="3" fill="' + C.node3 + '"/>' +
          '<text x="' + (px + 62) + '" y="' + (py + 11) + '" font-size="7.5" font-weight="800" fill="' + C.pillInk + '">' + L.motion + '</text></g>';
      }
      var hbx = houseX + houseW / 2 + 20, hby = groundY - 28;
      svg += '<g class="scene-pop" opacity="0.7"><rect x="' + hbx + '" y="' + hby + '" width="14" height="18" rx="3" fill="' + C.node4 + '"/>' +
        '<circle cx="' + (hbx + 7) + '" cy="' + (hby + 6) + '" r="2" fill="' + C.pill + '" opacity="0.6"/>' +
        '<circle cx="' + (hbx + 7) + '" cy="' + (hby + 9) + '" r="8" fill="' + C.node4 + '" opacity="0.08" class="scene-pulse"/></g>';

      /* optional wall badge */
      if (opts.badgeText) {
        var bx0 = houseX + houseW / 2, by0 = houseTopY + (isFlat ? 12 : 8);
        svg += '<g class="scene-el" opacity="0.3"><path d="M' + bx0 + ',' + (by0 - 8) + ' L' + (bx0 - 8) + ',' + (by0 - 4) + ' L' + (bx0 - 8) + ',' + (by0 + 4) +
          ' C' + (bx0 - 8) + ',' + (by0 + 10) + ' ' + bx0 + ',' + (by0 + 14) + ' ' + bx0 + ',' + (by0 + 14) +
          ' C' + bx0 + ',' + (by0 + 14) + ' ' + (bx0 + 8) + ',' + (by0 + 10) + ' ' + (bx0 + 8) + ',' + (by0 + 4) + ' L' + (bx0 + 8) + ',' + (by0 - 4) + ' Z" fill="' + C.roof + '"/>' +
          '<text x="' + bx0 + '" y="' + (by0 + 5) + '" text-anchor="middle" font-size="6" font-weight="900" fill="' + C.pill + '">' + opts.badgeText + '</text></g>';
      }

      /* pet */
      if (state[F.pets] && step >= R.pets) {
        var ptx = houseX + houseW / 2 + 40, pty = groundY - 3;
        var sc = (opts.petScale && opts.petScale[state[F.petSize]]) || 1;
        svg += '<g class="scene-pop" transform="translate(' + ptx + ',' + pty + ') scale(' + sc + ')">' +
          '<ellipse cx="0" cy="-6" rx="10" ry="6" fill="' + C.pet + '" opacity="0.75"/>' +
          '<circle cx="-8" cy="-11" r="5" fill="' + C.pet + '" opacity="0.75"/>' +
          '<circle cx="-7" cy="-12.5" r="1.8" fill="' + C.pill + '"/><circle cx="-7" cy="-12.5" r="0.8" fill="' + C.petEye + '"/>' +
          '<path d="M-11,-16 l-3,-4.5 l4.5,2z" fill="' + C.pet + '" opacity="0.75"/>' +
          '<path d="M-5,-16 l0.5,-4.5 l3.5,3z" fill="' + C.pet + '" opacity="0.75"/>' +
          '<path d="M9,-5 q5,1 8,-1" stroke="' + C.pet + '" stroke-width="1.5" fill="none" opacity="0.6"/></g>';
      }
    } else {
      svg += '<rect x="' + houseX + '" y="' + (groundY - 120) + '" width="' + houseW + '" height="120" rx="8" fill="none" stroke="' + C.ghostLine + '" stroke-width="2" stroke-dasharray="8,5"/>' +
        '<text x="' + (houseX + houseW / 2) + '" y="' + (groundY - 68) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + C.ghostInk + '">' + L.empty + '</text>' +
        '<text x="' + (houseX + houseW / 2) + '" y="' + (groundY - 50) + '" text-anchor="middle" font-size="11" fill="' + C.ghostLine + '">' + L.emptySub + '</text>' +
        '<g opacity="0.15"><polygon points="' + (houseX + houseW / 2 - 20) + ',' + (groundY - 85) + ' ' + (houseX + houseW / 2) + ',' + (groundY - 105) + ' ' + (houseX + houseW / 2 + 20) + ',' + (groundY - 85) + '" fill="' + C.ghostFaint + '"/>' +
        '<rect x="' + (houseX + houseW / 2 - 15) + '" y="' + (groundY - 85) + '" width="30" height="25" fill="' + C.ghostInk + '"/></g>';
    }

    /* adaptive viewBox so callouts are never clipped */
    var vbL = 50, vbR = 570;
    if (showOutdoor && (state[F.garden] || state[F.shed])) vbL = 15;
    if (showOutdoor && (state[F.garden] || state[F.garage])) vbR = 595;
    if (showOutdoor && state[F.second]) vbR = 650;
    var vbT = Math.min(roofPeak - 30, 50);
    return '<svg viewBox="' + vbL + ' ' + vbT + ' ' + (vbR - vbL) + ' ' + (groundY + 60 - vbT) + '" xmlns="http://www.w3.org/2000/svg" style="max-height:380px">' + svg + '</svg>';
  });
})(typeof window !== 'undefined' ? window : this);
