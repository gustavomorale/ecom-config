/* The bare domain. Inside the Shopify admin this route is only ever reached by
   an in-app navigation to "/", so it hands over to the app immediately. Opened
   directly in a browser it is a small public page: what the app is and where to
   get it. There is deliberately no "enter your shop domain" form; installs start
   from Shopify, and App Store review rejects apps that ask for the domain. */
import { useEffect } from "react";
import { redirect, useNavigate } from "react-router";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop") || url.searchParams.get("host") || url.searchParams.get("embedded")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return null;
};

export const meta = () => [{ title: "Bundle Configurator for Shopify" }];

export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    // framed by the Shopify admin: this page is never the destination
    if (typeof window !== "undefined" && window.top !== window.self) navigate("/app", { replace: true });
  }, [navigate]);

  const wrap = { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f6f7", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" };
  const card = { maxWidth: 560, background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 8px 30px rgba(0,0,0,.06)" };
  return (
    <main style={wrap}>
      <div style={card}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#5c5f62" }}>Shopify app · Beta</p>
        <h1 style={{ margin: "8px 0 10px", fontSize: 28, lineHeight: 1.2 }}>Bundle Configurator</h1>
        <p style={{ margin: "0 0 18px", fontSize: 16, lineHeight: 1.55, color: "#44474a" }}>
          A short questionnaire on your storefront that turns a shopper's answers into a ready-made cart: the right bundle, the right add-ons, one click to checkout.
        </p>
        <ul style={{ margin: "0 0 22px", paddingLeft: 18, fontSize: 14.5, lineHeight: 1.7, color: "#44474a" }}>
          <li>Start from a working template for what you sell</li>
          <li>Matches your theme's colours, type and corners</li>
          <li>Every product linked from your own catalogue</li>
        </ul>
        <p style={{ margin: 0, fontSize: 14, color: "#5c5f62" }}>
          This app runs inside the Shopify admin. Open it from <strong>Apps</strong> in your store, or write to{" "}
          <a href="mailto:contact@craftframe.agency" style={{ color: "#3d5ee6" }}>contact@craftframe.agency</a>.
        </p>
        <p style={{ margin: "14px 0 0", fontSize: 13 }}><a href="/privacy" style={{ color: "#5c5f62" }}>Privacy policy</a></p>
      </div>
    </main>
  );
}
