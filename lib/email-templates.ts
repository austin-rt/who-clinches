const BRAND_COLOR = '#14141a';
const BG_COLOR = '#f4f4f5';
const CARD_BG = '#ffffff';

const layout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>a.footer:hover{text-decoration:underline!important}</style>
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <img src="https://whoclinches.com/logo-48.png" alt="" width="24" height="24" style="vertical-align:middle;margin-right:8px;" />
              <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.5px;vertical-align:middle;">Who Clinches</span>
            </td>
          </tr>
          <tr>
            <td style="background:${CARD_BG};border-radius:12px;padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;color:#71717a;font-size:12px;">
              <a href="https://whoclinches.com" class="footer" style="color:#71717a;text-decoration:none;">whoclinches.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const magicLinkHtml = (verifyUrl: string) =>
  layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND_COLOR};">Claim your credits</h1>
    <p style="margin:0 0 4px;color:#3f3f46;font-size:15px;line-height:1.5;">
      Click the button below to verify your email and claim your credits.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Verify Email</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
      This link expires in 15 minutes. If you didn't request this, ignore this email.
    </p>
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:12px;word-break:break-all;">${verifyUrl}</p>
  `);
