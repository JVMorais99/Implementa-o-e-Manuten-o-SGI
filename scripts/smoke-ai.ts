import { aiEnabled, aiModel } from "../src/lib/features";
import { generateStructured, AiDisabledError } from "../src/lib/ai/client";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  if (!aiEnabled()) {
    // Sem ANTHROPIC_API_KEY: a chamada estruturada deve falhar de forma controlada.
    let threw = false;
    try {
      await generateStructured({
        system: "x",
        content: [{ type: "text", text: "x" }],
        tool: { name: "t", description: "d", input_schema: { type: "object" } },
      });
    } catch (e) {
      threw = e instanceof AiDisabledError;
    }
    assert(threw, "sem chave, deve lançar AiDisabledError");
    console.log("OK ia (desabilitada):");
    console.log("  aiEnabled():", false);
    console.log("  generateStructured lança AiDisabledError ✔");
    return;
  }

  // Com chave configurada: caminho real (saída estruturada via ferramenta).
  const result = await generateStructured<{ ok: boolean; echo: string }>({
    system: "Responda usando a ferramenta.",
    content: [{ type: "text", text: 'Responda com ok=true e echo="pong".' }],
    tool: {
      name: "responder",
      description: "Responde ao ping.",
      input_schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          echo: { type: "string" },
        },
        required: ["ok", "echo"],
      },
    },
  });
  assert(typeof result.ok === "boolean", "deve retornar campo ok");
  console.log("OK ia (habilitada):");
  console.log("  modelo:", aiModel());
  console.log("  resposta estruturada:", JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
