/* Mounts the real storefront runtime inside the admin, so what the merchant
   sees while editing is exactly what shoppers get. The assets are the same
   files the theme extension ships, copied to /widget/ by the build script.
   Client-only: the runtime wants a DOM. */
import { useEffect, useRef } from "react";

let loading = null;
function loadRuntime() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.BundleConfigurator && window.BundleConfigurator.scenes && window.BundleConfigurator.scenes.summary) return Promise.resolve();
  if (loading) return loading;
  const add = (tag, attrs) => new Promise((resolve, reject) => {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    el.onload = resolve; el.onerror = reject;
    document.head.appendChild(el);
  });
  loading = add("link", { rel: "stylesheet", href: "/widget/configurator.css" })
    .then(() => add("link", { rel: "stylesheet", href: "/widget/glass.css" }))
    .then(() => add("script", { src: "/widget/configurator.js" }))
    .then(() => add("script", { src: "/widget/scenes.js" }))
    .then(() => add("script", { src: "/widget/theme-inherit.js" }));
  return loading;
}

export function WidgetPreview({ config, height = 620 }) {
  const ref = useRef(null);
  const inst = useRef(null);
  const json = JSON.stringify(config || null);

  useEffect(() => {
    let cancelled = false;
    loadRuntime().then(() => {
      if (cancelled || !ref.current || !window.BundleConfigurator) return;
      if (inst.current) { try { inst.current.destroy(); } catch (e) { /* already gone */ } }
      const cfg = JSON.parse(json);
      if (!cfg) return;
      cfg.persist = { mode: "none" };     // never carry answers between edits
      inst.current = window.BundleConfigurator.mount(ref.current, cfg);
    }).catch(() => { /* preview is best effort */ });
    return () => { cancelled = true; };
  }, [json]);

  useEffect(() => () => { if (inst.current) { try { inst.current.destroy(); } catch (e) { /* noop */ } } }, []);

  return (
    <div style={{ border: "1px solid var(--p-color-border, #e3e3e3)", borderRadius: 12, overflow: "auto", maxHeight: height, background: "#fff" }}>
      <div ref={ref} />
    </div>
  );
}
