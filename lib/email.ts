const RESEND_URL = 'https://api.resend.com/emails';
const DOMAIN = 'whoclinches.com';
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL ?? `whoclinches@austinrt.com`;

type Sender = 'noreply' | 'api-alerts' | 'donations' | 'rag' | 'feedback';

const senderAddress = (sender: Sender): string => `Who Clinches <${sender}@${DOMAIN}>`;

interface EmailParams {
  to?: string;
  from?: Sender;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (params: EmailParams): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderAddress(params.from ?? 'noreply'),
      to: params.to ?? ADMIN_EMAIL,
      subject: params.subject,
      ...(params.html ? { html: params.html } : { text: params.text ?? '' }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error: ${res.status} ${body}`);
  }
};
