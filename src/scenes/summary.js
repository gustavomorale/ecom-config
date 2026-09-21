/* ============================================================
   Scene: "summary" — vertical-agnostic default preview.
   Draws a simple animated stack of the answers given so far.
   Works for any product category; no illustration assets needed.
   ============================================================ */
(function (root) {
  'use strict';
  var API = root.BundleConfigurator || (typeof require === 'function' ? require('../configurator.js') : null);
  if (!API) return;

  /* A row is one line of SVG text, which cannot wrap. A list of choices keeps the
     items that fit and counts the rest ("Goals: A, B +2 more"); anything else is
     cut at a word with an ellipsis. opts.maxChars and opts.moreLabel override. */
  function fit(label, max, more) {
    if (label.length <= max) return label;
    var cut = label.indexOf(': '), head = cut === -1 ? '' : label.slice(0, cut + 2);
    var items = label.slice(head.length).split(', ');
    if (items.length > 1) {
      for (var keep = items.length - 1; keep >= 1; keep--) {
        var out = head + items.slice(0, keep).join(', ') + ' ' + more.replace('{n}', items.length - keep);
        if (out.length <= max) return out;
      }
    }
    var text = label.slice(0, max - 1), sp = text.lastIndexOf(' ');
    return (sp > max * 0.6 ? text.slice(0, sp) : text).replace(/[ ,;:]+$/, '') + '\u2026';
  }

  API.registerScene('summary', function (state, opts, cfg, scope) {
    var accent = (opts.accent) || ((cfg.brand && cfg.brand.theme && cfg.brand.theme.accent) || '#3d5ee6');
    var rows = (opts.rows || []).filter(function (r) { return API.test(r.when, scope); });
    if (!rows.length) {
      return '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="60" y="60" width="240" height="140" rx="14" fill="none" stroke="#e2ded8" stroke-width="2" stroke-dasharray="8,6"/>' +
        '<text x="180" y="126" text-anchor="middle" font-size="14" font-weight="800" fill="#ccc">' +
        (opts.emptyTitle || 'Answer the first question') + '</text>' +
        '<text x="180" y="146" text-anchor="middle" font-size="11" fill="#ddd">' +
        (opts.emptySub || 'to start building your bundle') + '</text></svg>';
    }
    var h = 46, pad = 18, W = 360, H = pad * 2 + rows.length * h;
    var body = rows.map(function (r, i) {
      var y = pad + i * h;
      var label = String(r.label || '').replace(/\{(\w+)\}/g, function (m, k) { return scope[k + '_label'] ? scope[k + '_label'] : (k in scope ? scope[k] : m); });
      label = fit(label, opts.maxChars || 44, opts.moreLabel || '+{n} more');
      return '<g class="scene-pop">' +
        '<rect x="16" y="' + y + '" width="' + (W - 32) + '" height="' + (h - 8) + '" rx="10" fill="#fff" stroke="#efece8"/>' +
        '<circle cx="42" cy="' + (y + (h - 8) / 2) + '" r="12" fill="' + accent + '" opacity="0.12"/>' +
        '<text x="42" y="' + (y + (h - 8) / 2 + 5) + '" text-anchor="middle" font-size="14">' + (r.icon || '') + '</text>' +
        '<text x="66" y="' + (y + (h - 8) / 2 + 4) + '" font-size="12.5" font-weight="700" fill="#333">' + label + '</text>' +
        '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="max-height:380px">' + body + '</svg>';
  });
})(typeof window !== 'undefined' ? window : this);
