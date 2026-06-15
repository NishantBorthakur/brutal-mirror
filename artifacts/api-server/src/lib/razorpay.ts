import Razorpay from "razorpay";
import crypto from "crypto";

export interface Pack {
  amount: number;
  credits: number;
  label: string;
  price: string;
  bestValue?: boolean;
}

export const PACKS: Record<string, Pack> = {
  starter: { amount: 4900, credits: 20, label: "Starter Pack", price: "₹49" },
  value: { amount: 9900, credits: 50, label: "Value Pack", price: "₹99", bestValue: true },
  power: { amount: 19900, credits: 120, label: "Power Pack", price: "₹199" },
};

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export function generateCheckoutHtml(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  packLabel: string;
  credits: number;
  authToken: string;
  apiBase: string;
}): string {
  const { keyId, orderId, amount, currency, packLabel, credits, authToken, apiBase } = opts;
  const escaped = (s: string | number) =>
    String(s).replace(/[<>&"'`]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c] ?? c),
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Brutal Mirror – ${escaped(packLabel)}</title>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0a0a0a;
    color: #f3e8ff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 24px;
  }
  .icon { font-size: 40px; }
  .title { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .sub { font-size: 14px; color: #a78bfa; text-align: center; line-height: 1.6; }
  .loader {
    width: 36px; height: 36px;
    border: 3px solid #7c3aed30;
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error { color: #ef4444; font-size: 14px; text-align: center; display: none; }
  .trust { font-size: 11px; color: #6b7280; margin-top: 8px; }
</style>
</head>
<body>
  <div class="icon">⚡</div>
  <div class="title">Opening Razorpay…</div>
  <div class="sub" id="sub">Securing your payment for<br /><strong>${escaped(packLabel)}</strong></div>
  <div class="loader" id="loader"></div>
  <div class="error" id="err">Checkout failed to open. Please go back and try again.</div>
  <p class="trust">🔒 Secure payments powered by Razorpay</p>
<script>
  var verificationDone = false;

  function redirectTo(url) {
    window.location.href = url;
  }

  var options = {
    key: ${JSON.stringify(keyId)},
    amount: ${Number(amount)},
    currency: ${JSON.stringify(currency)},
    name: "Brutal Mirror",
    description: ${JSON.stringify(packLabel)},
    order_id: ${JSON.stringify(orderId)},
    handler: function(response) {
      verificationDone = true;
      document.getElementById("loader").style.display = "block";
      document.getElementById("sub").textContent = "Verifying payment…";
      fetch(${JSON.stringify(apiBase + "/api/billing/verify-payment")}, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + ${JSON.stringify(authToken)}
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.creditsBalance !== undefined) {
          redirectTo("brutalmirror://payment/success?credits=${Number(credits)}&balance=" + data.creditsBalance);
        } else {
          redirectTo("brutalmirror://payment/failed?reason=verify_error");
        }
      })
      .catch(function() {
        redirectTo("brutalmirror://payment/failed?reason=network");
      });
    },
    prefill: {},
    theme: { color: "#8b5cf6" },
    modal: {
      ondismiss: function() {
        if (!verificationDone) {
          redirectTo("brutalmirror://payment/cancelled");
        }
      }
    }
  };

  try {
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function() {
      verificationDone = true;
      redirectTo("brutalmirror://payment/failed?reason=payment_failed");
    });
    rzp.open();
  } catch(e) {
    document.getElementById("loader").style.display = "none";
    document.getElementById("err").style.display = "block";
  }
</script>
</body>
</html>`;
}
