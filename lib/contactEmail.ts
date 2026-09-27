// ─── Contact email ──────────────────────────────────────────────────────────
// The message /api/contact sends. Everything in it but the secret comes from
// whoever filled in the form, so every value is escaped before it goes into
// the HTML: otherwise a visitor could send markup (links, images, fake
// buttons) that renders in the inbox as if the site had written it.

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** An email subject is a single header line: fold any line breaks into spaces. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export function contactEmailHtml(
  { name, email, subject, message }: { name: string; email: string; subject: string; message: string },
  secret: string,
) {
  const [n, e, s, m, v] = [name, email, subject, message, secret].map(escapeHtml);
  return `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #64738d;">New message from your website</h2>
          <p><strong>Name:</strong> ${n}</p>
          <p><strong>Email:</strong> ${e}</p>
          <p><strong>Subject:</strong> ${s}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="white-space: pre-wrap;">${m}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="font-size: 0; line-height: 0; color: transparent; overflow: hidden; max-height: 0;">site-verification: ${v}</p>
        </div>
      `;
}
