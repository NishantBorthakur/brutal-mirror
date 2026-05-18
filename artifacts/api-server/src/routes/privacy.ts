import { Router } from "express";

const router = Router();

router.get("/privacy", (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Brutal Mirror</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0a;
      --card: #111111;
      --border: #1f1f1f;
      --fg: #f3f3f3;
      --muted: #9ca3af;
      --purple: #8b5cf6;
      --purple-light: #a78bfa;
    }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      padding: 0 20px 80px;
    }
    .wrap { max-width: 680px; margin: 0 auto; }
    header {
      padding: 48px 0 40px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 48px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--purple);
    }
    .brand-name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--purple-light);
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--fg);
      margin-bottom: 8px;
    }
    .updated {
      font-size: 13px;
      color: var(--muted);
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--fg);
      margin: 40px 0 12px;
    }
    p { color: var(--muted); margin-bottom: 14px; }
    ul {
      list-style: none;
      margin-bottom: 14px;
    }
    ul li {
      color: var(--muted);
      padding: 6px 0 6px 20px;
      position: relative;
    }
    ul li::before {
      content: "–";
      position: absolute;
      left: 0;
      color: var(--purple);
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin: 32px 0;
    }
    .card p { margin-bottom: 0; }
    a { color: var(--purple-light); text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer {
      margin-top: 64px;
      padding-top: 32px;
      border-top: 1px solid var(--border);
      font-size: 13px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <div class="dot"></div>
        <span class="brand-name">Brutal Mirror</span>
      </div>
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: May 2025 &nbsp;·&nbsp; Effective immediately</p>
    </header>

    <div class="card">
      <p><strong style="color:#f3f3f3">Short version:</strong> Brutal Mirror does not collect, store, or share your personal data. Everything stays on your device. The only external service involved is the AI that generates your roast.</p>
    </div>

    <h2>What we collect</h2>
    <p>Brutal Mirror does not collect any personal information. We do not require an account, email address, phone number, or any form of identification to use the app.</p>

    <h2>Where your data lives</h2>
    <p>All roasts you generate and save are stored <strong style="color:#f3f3f3">locally on your device</strong> using the device's built-in storage. This data never leaves your device and is not transmitted to our servers. You can delete it at any time from the Settings screen inside the app.</p>

    <h2>AI processing</h2>
    <p>When you tap "Roast Me", the text you entered is sent to our server, which forwards it to <strong style="color:#f3f3f3">OpenAI's API</strong> to generate your roast. This means:</p>
    <ul>
      <li>The text you submit is processed by OpenAI to generate a response</li>
      <li>We do not store that text on our servers after the response is returned</li>
      <li>OpenAI may process it according to their own <a href="https://openai.com/policies/privacy-policy" target="_blank">privacy policy</a></li>
      <li>Do not submit sensitive personal information, passwords, or confidential data</li>
    </ul>

    <h2>Third-party services</h2>
    <p>Brutal Mirror uses the following third-party service:</p>
    <ul>
      <li><strong style="color:#f3f3f3">OpenAI API</strong> — for AI-generated roast content. <a href="https://openai.com/policies/privacy-policy" target="_blank">OpenAI Privacy Policy →</a></li>
    </ul>
    <p>We do not use analytics, crash reporting, advertising networks, or any tracking technology.</p>

    <h2>Children's privacy</h2>
    <p>Brutal Mirror is intended for users 13 years of age and older. We do not knowingly collect data from children under 13. If you believe a child has used the app to submit personal information, please contact us and we will take appropriate steps.</p>

    <h2>Your rights</h2>
    <p>Because we do not collect personal data, there is nothing for us to retrieve, modify, or delete on your behalf. All data stored on your device can be cleared directly in the app under <strong style="color:#f3f3f3">Settings → Clear All Saved Roasts</strong>.</p>

    <h2>Changes to this policy</h2>
    <p>If we make material changes to this policy, we will update the date at the top of this page. Continued use of the app after changes are posted constitutes your acceptance of the revised policy.</p>

    <h2>Contact</h2>
    <p>Questions about this policy? Reach out at: <a href="mailto:privacy@brutalmirror.app">privacy@brutalmirror.app</a></p>

    <footer>
      &copy; 2025 Brutal Mirror &nbsp;·&nbsp; Brutal feedback. Better results.
    </footer>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
