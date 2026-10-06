// Confirmation email markup lives here (not in the processor) so the queue
// worker only deals with job mechanics. Markup is tables + inline styles
// because that is what renders predictably across Gmail/Apple Mail/Outlook.

export type OrderConfirmedTemplateData = {
  customerName: string;
  productName: string;
  productImageUrl?: string | null;
  amountInr: string;
  orderId: string;
  statusUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function orderConfirmedSubject(): string {
  return 'Your Heva order is confirmed';
}

export function orderConfirmedText(d: OrderConfirmedTemplateData): string {
  return (
    `Hi ${d.customerName},\n\n` +
    `Payment received — your order for ${d.productName} (INR ${d.amountInr}) is confirmed.\n` +
    `Order ID: ${d.orderId}\n\n` +
    `Track your order: ${d.statusUrl}\n\n` +
    `Thanks for shopping with Heva!`
  );
}

export function orderConfirmedHtml(d: OrderConfirmedTemplateData): string {
  const name = escapeHtml(d.customerName);
  const product = escapeHtml(d.productName);
  const orderId = escapeHtml(d.orderId);
  const amount = escapeHtml(d.amountInr);
  const statusUrl = escapeHtml(d.statusUrl);

  const heroImage = d.productImageUrl
    ? `<img src="${escapeHtml(d.productImageUrl)}" alt="${product}" width="496" style="display:block;width:100%;max-width:496px;height:auto;border-radius:12px;border:1px solid #eceaf3;" />`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${orderConfirmedSubject()}</title>
<style>
  @media (max-width: 600px) {
    .heva-card { width: 100% !important; }
    .heva-pad { padding: 28px 18px !important; }
    .heva-btn a { display: block !important; width: auto !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f1f0f5;font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Payment received — order ${orderId} is confirmed and on its way.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f0f5;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" class="heva-card" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e8e6ef;overflow:hidden;">
    <tr><td style="background:#7c3aed;height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td style="background:#0b0b0f;padding:18px 32px;">
      <span style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:0.14em;">HEVA</span>
      <span style="font-size:17px;color:#a78bfa;">&#9679;</span>
      <span style="font-size:12px;color:#a1a1aa;letter-spacing:0.08em;">ORDER CONFIRMED</span>
    </td></tr>
    <tr><td class="heva-pad" style="padding:32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="background:#dcfce7;border-radius:999px;padding:6px 14px;">
          <span style="font-size:13px;font-weight:600;color:#15803d;">&#10003;&nbsp; Payment received</span>
        </td></tr>
      </table>

      <p style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:#0b0b0f;">Thanks, ${name} &mdash; your order is confirmed</p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#52525b;">We&rsquo;ve received your payment and are getting your order ready. A quick look at what you bought:</p>

      ${heroImage ? `${heroImage}\n      <div style="height:20px;"></div>\n      ` : ''}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="font-size:15px;font-weight:600;color:#0b0b0f;">${product}</td>
          <td align="right" style="font-size:15px;font-weight:700;color:#0b0b0f;">INR&nbsp;${amount}</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f7fb;border:1px solid #eceaf3;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:#71717a;">Order ID</td>
          <td align="right" style="padding:14px 16px;font-size:13px;font-family:${MONO};color:#0b0b0f;">${orderId}</td>
        </tr>
        <tr><td colspan="2" style="border-top:1px solid #eceaf3;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:#71717a;">Status</td>
          <td align="right" style="padding:14px 16px;font-size:13px;font-weight:600;color:#15803d;">PAID</td>
        </tr>
      </table>

      <table role="presentation" class="heva-btn" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td bgcolor="#7c3aed" style="background:#7c3aed;border-radius:999px;">
          <a href="${statusUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Track your order</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="border-top:1px solid #eceaf3;padding:20px 32px;background:#fbfbfd;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center;">You&rsquo;re receiving this because you completed an order on Heva Store.<br />Heva Store &middot; Questions? Just reply to this email.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
