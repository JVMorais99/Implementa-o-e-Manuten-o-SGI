// Gating central das integrações externas. Cada recurso liga-se automaticamente
// quando a variável de ambiente correspondente existe; sem ela, o app continua
// funcionando com degradação graciosa (e-mail mostra o link na tela, storage usa
// disco local, IA fica desabilitada). Fonte única de verdade para toda a base.

function has(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// E-mail transacional via Resend (convite, redefinição de senha, verificação).
export function emailEnabled(): boolean {
  return has(process.env.RESEND_API_KEY) && has(process.env.EMAIL_FROM);
}

// Armazenamento de evidências em nuvem (Vercel Blob). Fallback: disco local.
export function blobEnabled(): boolean {
  return has(process.env.BLOB_READ_WRITE_TOKEN);
}

// Assistente de IA (Anthropic Claude).
export function aiEnabled(): boolean {
  return has(process.env.ANTHROPIC_API_KEY);
}

// Modelo usado pelo assistente de IA (sobrescrevível por env).
export function aiModel(): string {
  return process.env.AI_MODEL?.trim() || "claude-sonnet-4-6";
}

// URL base pública da aplicação, usada para montar links de e-mail.
export function appUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}
