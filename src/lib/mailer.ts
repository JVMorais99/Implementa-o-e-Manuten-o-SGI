import { emailEnabled } from "@/lib/features";

// Envio de e-mail transacional via Resend, com degradação graciosa: se as
// variáveis de ambiente não estiverem configuradas (emailEnabled() === false),
// nada é enviado e retornamos { delivered: false } — o chamador então exibe o
// link/credencial diretamente na tela. Nunca lança erro de configuração.

export type MailResult = { delivered: boolean; error?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<MailResult> {
  if (!emailEnabled()) return { delivered: false };

  try {
    // Import dinâmico para não exigir a dependência quando o e-mail está desligado.
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { delivered: false, error: String(error) };
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Layout simples e neutro para os e-mails transacionais.
export function emailLayout(opts: {
  title: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  footer?: string;
}): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="margin:0 0 12px;font-size:18px;color:#111827">${opts.title}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151">${opts.intro}</p>
    <p style="margin:0 0 24px">
      <a href="${opts.buttonUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px">${opts.buttonLabel}</a>
    </p>
    <p style="margin:0 0 8px;font-size:12px;color:#6b7280">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
    <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#4f46e5">${opts.buttonUrl}</p>
    ${opts.footer ? `<p style="margin:0;font-size:12px;color:#9ca3af">${opts.footer}</p>` : ""}
  </div>`;
}
