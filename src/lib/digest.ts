import { sendMail, type MailResult } from "@/lib/mailer";
import { appUrl } from "@/lib/features";
import type { AppNotification, NotificationSeverity } from "@/lib/notifications";
import { formatDate } from "@/lib/utils";

// Digest de pendências por e-mail (avisos proativos). Resume as notificações em
// aberto do usuário num único e-mail diário, disparado pelo cron da Vercel
// (src/app/api/cron/digest). Degrada graciosamente: sem e-mail configurado, o
// envio é no-op (sendMail retorna { delivered:false }).

const SEV_COLOR: Record<NotificationSeverity, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#2563eb",
};
const SEV_LABEL: Record<NotificationSeverity, string> = {
  high: "Urgente",
  medium: "Atenção",
  low: "Informativo",
};

export function buildDigestHtml(
  userName: string,
  notifications: AppNotification[]
): string {
  const base = appUrl();
  const firstName = userName.trim().split(/\s+/)[0] || "Olá";
  const rows = notifications
    .map((n) => {
      const color = SEV_COLOR[n.severity];
      const date = n.date ? formatDate(n.date) : "";
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;vertical-align:top">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px"></span>
          <a href="${base}${n.href}" style="color:#111827;text-decoration:none;font-weight:600;font-size:14px">${n.title}</a>
          <div style="margin:2px 0 0 16px;font-size:13px;color:#6b7280">${n.description}${date ? ` · <span style="color:#9ca3af">${date}</span>` : ""}</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="margin:0 0 4px;font-size:18px;color:#111827">Suas pendências no SGI</h2>
    <p style="margin:0 0 18px;font-size:14px;color:#374151">Olá, ${firstName}. Você tem <strong>${notifications.length}</strong> ${notifications.length === 1 ? "pendência" : "pendências"} aguardando atenção:</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="margin:22px 0 0">
      <a href="${base}/notificacoes" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px">Ver no painel</a>
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#9ca3af">Você recebe este resumo porque há itens vencidos ou parados nos seus clientes. Acesse o painel para tratá-los.</p>
  </div>`;
}

// Envia o digest para um usuário, se houver pendências. Retorna o resultado do envio
// (delivered:false quando o e-mail está desligado ou não há nada a enviar).
export async function sendDigest(
  user: { name?: string | null; email?: string | null },
  notifications: AppNotification[]
): Promise<MailResult> {
  if (!user.email || notifications.length === 0) {
    return { delivered: false };
  }
  const count = notifications.length;
  return sendMail({
    to: user.email,
    subject: `SGI · ${count} ${count === 1 ? "pendência" : "pendências"} aguardando você`,
    html: buildDigestHtml(user.name ?? "", notifications),
  });
}
