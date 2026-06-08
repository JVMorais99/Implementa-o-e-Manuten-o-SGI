import { aiEnabled, aiModel } from "@/lib/features";

// Cliente Anthropic carregado sob demanda (lazy) — só importa o SDK quando há
// chave configurada. Toda a IA passa por aqui; se aiEnabled() for falso, as
// funções de alto nível nem chegam a chamar isto.

export { aiEnabled } from "@/lib/features";

export class AiDisabledError extends Error {
  constructor() {
    super("Recurso de IA desabilitado: configure ANTHROPIC_API_KEY.");
    this.name = "AiDisabledError";
  }
}

// Bloco de conteúdo aceito pela mensagem do usuário (texto, imagem ou PDF).
export type AiContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

// Definição de uma "ferramenta" usada para forçar saída estruturada (JSON).
export interface AiTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// Chama o modelo forçando o uso de uma ferramenta e devolve o input estruturado.
// O system prompt é marcado com cache_control para reaproveitar o contexto
// compartilhado entre chamadas (prompt caching).
export async function generateStructured<T>(opts: {
  system: string;
  content: AiContentBlock[];
  tool: AiTool;
  maxTokens?: number;
}): Promise<T> {
  if (!aiEnabled()) throw new AiDisabledError();

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: aiModel(),
    max_tokens: opts.maxTokens ?? 1500,
    system: [
      {
        type: "text",
        text: opts.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [opts.tool as never],
    tool_choice: { type: "tool", name: opts.tool.name },
    messages: [{ role: "user", content: opts.content as never }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("A IA não retornou uma resposta estruturada.");
  }
  return toolUse.input as T;
}
