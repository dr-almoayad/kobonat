// app/layout.jsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        {/* This is where your app content (including Admin) will be injected */}
        {children}
      </body>
    </html>
  );
}