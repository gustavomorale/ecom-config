/* Live preview of the real storefront runtime, in its own viewport.

   The widget picks its desktop or mobile layout from the window width, so
   mounting it straight into a narrow admin column shows a squeezed desktop
   layout that no shopper ever sees. An iframe has its own viewport: 390px
   wide for Mobile, 1180px for Desktop (scaled down to fit the column), which
   makes the media queries, the sticky mobile bar and the scene behave exactly
   as on the storefront. Assets are the files the theme extension ships,
   copied to /widget/ by the build script. Client-only. */
import { useEffect, useRef, useState } from "react";

const VIEWS = {
  mobile: { width: 390, height: 760, label: "Mobile" },
  desktop: { width: 1180, height: 860, label: "Desktop" },
};

const FRAME_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/widget/configurator.css">
<link rel="stylesheet" href="/widget/glass.css">
<style>html,body{margin:0;background:#fff}</style></head><body>
<div id="mount"></div>
<script src="/widget/configurator.js"></script>
<script src="/widget/scenes.js"></script>
<script src="/widget/theme-inherit.js"></script>
<script>
  var inst = null;
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'bcfg-config' || !window.BundleConfigurator) return;
    try { if (inst) inst.destroy(); } catch (err) {}
    var cfg = e.data.config; if (!cfg) return;
    cfg.persist = { mode: 'none' };           // never carry answers between edits
    inst = window.BundleConfigurator.mount(document.getElementById('mount'), cfg);
  });
  parent.postMessage({ type: 'bcfg-ready' }, '*');
</script></body></html>`;

function Frame({ json, view, maxWidth }) {
  const wrap = useRef(null);
  const frame = useRef(null);
  const ready = useRef(false);
  const [scale, setScale] = useState(1);
  const v = VIEWS[view];

  // fit the fixed-size viewport into whatever room the column gives us
  useEffect(() => {
    const el = wrap.current; if (!el) return undefined;
    const fit = () => setScale(Math.min(1, (Math.min(el.clientWidth, maxWidth || Infinity)) / v.width));
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [v.width, maxWidth]);

  // hand the config to the frame when it is ready, and again whenever it changes
  useEffect(() => {
    const send = () => { if (frame.current && frame.current.contentWindow) frame.current.contentWindow.postMessage({ type: "bcfg-config", config: JSON.parse(json) }, "*"); };
    const onMsg = (e) => { if (frame.current && e.source === frame.current.contentWindow && e.data && e.data.type === "bcfg-ready") { ready.current = true; send(); } };
    window.addEventListener("message", onMsg);
    if (ready.current) send();
    return () => window.removeEventListener("message", onMsg);
  }, [json]);

  // a new viewport size means a fresh document; it will announce itself again
  useEffect(() => { ready.current = false; }, [view]);

  return (
    <div ref={wrap} style={{ width: "100%" }}>
      <div style={{ width: v.width * scale, height: v.height * scale, margin: "0 auto", overflow: "hidden", borderRadius: view === "mobile" ? 28 : 12, border: view === "mobile" ? "8px solid #1b1e28" : "1px solid #d4d4d4", boxSizing: "content-box", background: "#fff" }}>
        <iframe
          key={view}
          ref={frame}
          title={`${v.label} preview of your questionnaire`}
          srcDoc={FRAME_HTML}
          style={{ width: v.width, height: v.height, border: 0, display: "block", transform: `scale(${scale})`, transformOrigin: "0 0" }}
        />
      </div>
    </div>
  );
}

export function WidgetPreview({ config, initialView = "mobile" }) {
  const [view, setView] = useState(initialView);
  const [large, setLarge] = useState(false);
  const json = JSON.stringify(config || null);

  useEffect(() => {
    if (!large) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setLarge(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [large]);

  const Switch = (
    <s-stack direction="inline" gap="small-200" alignItems="center">
      {Object.keys(VIEWS).map((k) => (
        <s-button key={k} variant={view === k ? "primary" : "tertiary"} onClick={() => setView(k)} accessibilityLabel={`${VIEWS[k].label} preview`}>{VIEWS[k].label}</s-button>
      ))}
      <span style={{ marginLeft: "auto" }} />
      <s-button variant="tertiary" onClick={() => setLarge((x) => !x)}>{large ? "Close" : "Enlarge"}</s-button>
    </s-stack>
  );

  return (
    <s-stack direction="block" gap="small">
      {Switch}
      {!large ? <Frame json={json} view={view} /> : <s-text color="subdued">Shown enlarged. Press Esc or Close to bring it back here.</s-text>}
      {view === "desktop" && !large ? <s-text color="subdued">Scaled to fit. Enlarge to see it at full size.</s-text> : null}

      {large ? (
        <div role="dialog" aria-modal="true" aria-label="Enlarged preview" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,22,28,.72)", display: "flex", flexDirection: "column", padding: 20, gap: 12 }} onClick={(e) => { if (e.target === e.currentTarget) setLarge(false); }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "8px 12px" }}>{Switch}</div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <div style={{ width: "100%", maxWidth: view === "mobile" ? 420 : 1240 }}>
              <Frame json={json} view={view} maxWidth={view === "mobile" ? 406 : 1196} />
            </div>
          </div>
        </div>
      ) : null}
    </s-stack>
  );
}
