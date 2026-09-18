/* Public privacy policy, served at /privacy. This is the URL given in the App
   Store listing. Keep it true to the code: if what the app stores or reads
   changes (sessions, scopes, the config metafield, analytics), change this page
   in the same commit. Last reviewed against: app/shopify.server.js (scopes,
   session storage), app/config.server.js (metafield), app/routes/webhooks.*,
   src/configurator.js (persistence, share links). */

export const meta = () => [
  { title: "Privacy policy · Bundle Configurator" },
  { name: "description", content: "What Bundle Configurator collects, where it is kept and how to have it removed." },
];

const UPDATED = "18 September 2026";
const EMAIL = "contact@craftframe.agency";

const S = {
  page: { background: "#f6f6f7", minHeight: "100vh", padding: "40px 20px 80px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1a1a1a" },
  card: { maxWidth: 760, margin: "0 auto", background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 8px 30px rgba(0,0,0,.06)", lineHeight: 1.65, fontSize: 15.5 },
  h1: { fontSize: 30, lineHeight: 1.2, margin: "6px 0 6px" },
  h2: { fontSize: 19, margin: "32px 0 8px" },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#5c5f62" },
  muted: { color: "#5c5f62" },
  table: { width: "100%", borderCollapse: "collapse", margin: "8px 0 4px", fontSize: 14.5 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #e3e3e3", verticalAlign: "top" },
  td: { padding: "8px 10px", borderBottom: "1px solid #ececec", verticalAlign: "top" },
  a: { color: "#3d5ee6" },
};

export default function Privacy() {
  return (
    <main style={S.page}>
      <article style={S.card}>
        <p style={S.eyebrow}>Bundle Configurator · Shopify app</p>
        <h1 style={S.h1}>Privacy policy</h1>
        <p style={S.muted}>Last updated {UPDATED}</p>

        <p>
          Bundle Configurator is a Shopify app made by CraftFrame WORKS Ltd ("CraftFrame", "we"). It adds a questionnaire to a merchant's
          storefront that recommends a bundle and opens a pre-filled cart. This page says what the app collects, where it is kept and how
          to have it removed. The short version: we keep the minimum needed to run the app for a store, and nothing about that store's shoppers.
        </p>

        <h2 style={S.h2}>Who is responsible</h2>
        <p>
          CraftFrame WORKS Ltd, a company registered in England and Wales, is the controller for the merchant account data described below.
          For anything in this policy write to <a style={S.a} href={`mailto:${EMAIL}`}>{EMAIL}</a>. We reply within one working day.
        </p>

        <h2 style={S.h2}>Merchants: what we collect</h2>
        <table style={S.table}>
          <thead><tr><th style={S.th}>What</th><th style={S.th}>Why</th><th style={S.th}>Where it is kept</th></tr></thead>
          <tbody>
            <tr><td style={S.td}>Your shop's <code>myshopify.com</code> domain, the access token Shopify issues when you install, and the permissions you granted</td><td style={S.td}>To identify your store and call Shopify's API on your behalf</td><td style={S.td}>Our database (Neon, London)</td></tr>
            <tr><td style={S.td}>If Shopify includes them with your session: the name, email and locale of the staff member using the app</td><td style={S.td}>Provided by Shopify as part of signing in; we do not use them for marketing</td><td style={S.td}>Our database (Neon, London)</td></tr>
            <tr><td style={S.td}>Your configuration: questions, rules, wording, colours, and for each linked product its title, price, image link and variant ID</td><td style={S.td}>It is what the storefront block shows</td><td style={S.td}>In your own Shopify store, as a shop metafield (<code>bundle_configurator.config</code>). Not on our servers</td></tr>
            <tr><td style={S.td}>Technical logs: shop domain, request path, time, IP address and error details</td><td style={S.td}>To keep the service running and fix faults</td><td style={S.td}>Our hosting provider's logs (Netlify), kept for a short period</td></tr>
          </tbody>
        </table>
        <p>
          The app reads your products and your published theme's settings when you use the product picker or "Match my store". It reads them
          at that moment to do what you asked and does not keep a copy, beyond the product details you chose to link, listed above.
          Subscription charges are handled entirely by Shopify; we never see your payment details.
        </p>

        <h2 style={S.h2}>Shoppers: what we collect</h2>
        <p><strong>Nothing.</strong> The questionnaire runs in the shopper's browser on the merchant's storefront.</p>
        <ul>
          <li>Answers are kept in the shopper's own browser storage so that a refresh does not lose them. They are not sent to CraftFrame or to the merchant.</li>
          <li>"Copy a link to this bundle" puts the answers into the link itself. Whoever opens that link sees the same result; nothing is stored anywhere else.</li>
          <li>The widget sets no cookies, runs no trackers and makes no requests to our servers. Its files are served by Shopify's content network.</li>
          <li>When the shopper continues to the cart, they are on the merchant's Shopify checkout, under the merchant's own privacy policy.</li>
        </ul>
        <p style={S.muted}>If we add optional, anonymous completion statistics for merchants in future, this policy will be updated before that ships, and it will contain no personal data.</p>

        <h2 style={S.h2}>Legal bases</h2>
        <p>
          We process merchant account data to perform our contract with you (providing the app) and, for logs and security, on the basis of our
          legitimate interest in running a reliable service. We do not sell personal data, use it for advertising or make automated decisions about anyone.
        </p>

        <h2 style={S.h2}>Who else handles the data</h2>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Provider</th><th style={S.th}>Role</th><th style={S.th}>Location</th></tr></thead>
          <tbody>
            <tr><td style={S.td}>Shopify</td><td style={S.td}>The platform the app runs in; holds your configuration metafield and serves the storefront files</td><td style={S.td}>Global</td></tr>
            <tr><td style={S.td}>Neon</td><td style={S.td}>Database holding the session records described above</td><td style={S.td}>United Kingdom (AWS London)</td></tr>
            <tr><td style={S.td}>Netlify</td><td style={S.td}>Hosts the app's admin pages and receives Shopify's webhooks</td><td style={S.td}>United States and global edge</td></tr>
          </tbody>
        </table>
        <p>Where data leaves the UK or EEA, it does so under the provider's standard contractual clauses or the UK International Data Transfer Addendum.</p>

        <h2 style={S.h2}>How long we keep it, and deletion</h2>
        <ul>
          <li>Session records are deleted when you uninstall the app, and again when Shopify sends its shop redaction request 48 hours later.</li>
          <li>Your configuration metafield lives in your store and stays under your control. After uninstalling you can remove it in Shopify under Settings, Custom data, Shop.</li>
          <li>Hosting logs expire on the provider's short retention schedule.</li>
          <li>The app implements Shopify's mandatory privacy webhooks (customer data request, customer redaction, shop redaction). Because we hold no customer data, customer requests are answered with nothing to return or erase.</li>
        </ul>

        <h2 style={S.h2}>Your rights</h2>
        <p>
          You can ask for a copy of the data we hold about you or your store, have it corrected or deleted, or object to how we use it, by writing to{" "}
          <a style={S.a} href={`mailto:${EMAIL}`}>{EMAIL}</a>. If you are unhappy with our answer you can complain to the UK Information Commissioner's Office
          (<a style={S.a} href="https://ico.org.uk" rel="noopener">ico.org.uk</a>) or your local data protection authority.
        </p>

        <h2 style={S.h2}>Security</h2>
        <p>Traffic is encrypted in transit. Access tokens are stored in a database that accepts encrypted connections only, and access to production systems is limited to CraftFrame staff who need it. Requests from Shopify are verified by signature before they are acted on.</p>

        <h2 style={S.h2}>Changes</h2>
        <p>If this policy changes in a way that matters, we will update the date above and tell installed merchants inside the app before the change takes effect.</p>
      </article>
    </main>
  );
}
