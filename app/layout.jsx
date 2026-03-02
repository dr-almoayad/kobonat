// app/layout.jsx
//
// ✅ FIX: This root layout must NOT contain <html> or <body> tags.
// The locale layout (app/[locale]/layout.jsx) handles the full document
// shell with the correct lang and dir per locale. Having both layouts
// render <html><body> caused browsers to produce duplicate <head> and
// <body> elements, breaking SEO tags (canonicals, hreflang, etc.).

export default function RootLayout({ children }) {
  return children;
}
