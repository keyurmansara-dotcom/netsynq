import 'dotenv/config';
import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

const hasSmtpConfig = Boolean(smtpUser && smtpPass && mailFrom);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildResetPasswordEmailHtml = (resetUrl) => `
    <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:28px 32px;color:#fff;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#bfdbfe;margin-bottom:10px;">NetSynq</div>
            <div style="font-size:28px;font-weight:700;line-height:1.2;">Reset your password</div>
            <div style="margin-top:10px;font-size:15px;line-height:1.6;color:#dbeafe;">Use the secure link below to create a new password for your account.</div>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
              We received a request to reset your NetSynq password. If you made this request, click the button below to continue.
            </p>

            <div style="text-align:center;margin:28px 0;">
              <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:15px;">
                Reset password
              </a>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin-bottom:18px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0f172a;">If the button does not work, copy this link:</p>
              <p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;color:#2563eb;">${escapeHtml(resetUrl)}</p>
            </div>

            <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
              This reset link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>

        <div style="text-align:center;padding:16px 12px 0;font-size:12px;color:#94a3b8;">
          This is an automated email from NetSynq.
        </div>
      </div>
    </div>
  `;

export const sendResetPasswordEmail = async (toEmail, resetUrl) => {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured');
    }

    return {
      delivered: false
    };
  }

  const info = await transporter.sendMail({
    from: mailFrom,
    to: toEmail,
    subject: 'Reset your NetSynq password',
    text: [
      'We received a request to reset your NetSynq password.',
      `Reset link: ${resetUrl}`,
      'This link expires in 15 minutes.',
      'If you did not request this, you can ignore this email.'
    ].join('\n\n'),
    html: buildResetPasswordEmailHtml(resetUrl)
  });

  return {
    delivered: true,
    messageId: info.messageId
  };
};
