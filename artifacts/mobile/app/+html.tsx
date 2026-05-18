import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* ── Primary SEO ── */}
        <title>Brutal Mirror — Brutal feedback. Better results.</title>
        <meta
          name="description"
          content="Paste your startup idea, bio, dating profile, or resume. Get a savage AI critique, a 6-metric score report, and a fully rewritten improved version — in seconds."
        />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="color-scheme" content="dark" />

        {/* ── Open Graph ── */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Brutal Mirror — Brutal feedback. Better results." />
        <meta
          property="og:description"
          content="Paste your startup idea, bio, dating profile, or resume. Get a savage AI critique, a 6-metric score report, and a fully rewritten improved version — in seconds."
        />
        <meta property="og:image" content="/assets/images/icon.png" />
        <meta property="og:site_name" content="Brutal Mirror" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Brutal Mirror — Brutal feedback. Better results." />
        <meta
          name="twitter:description"
          content="AI that roasts your ideas and rebuilds them better. Try it free."
        />
        <meta name="twitter:image" content="/assets/images/icon.png" />

        {/* ── Robots ── */}
        <meta name="robots" content="index, follow" />

        {/* ── Performance: preconnect for font CDN ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── Expo web resets ── */}
        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                background-color: #0a0a0a;
              }
              /* Prevent flash of unstyled content */
              body {
                background: #0a0a0a;
                margin: 0;
                padding: 0;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
