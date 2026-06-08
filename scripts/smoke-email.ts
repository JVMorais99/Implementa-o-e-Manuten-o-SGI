import { PrismaClient } from "@prisma/client";
import { createToken, consumeToken, peekToken } from "../src/lib/tokens";
import { sendMail } from "../src/lib/mailer";
import { emailEnabled } from "../src/lib/features";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const email = "smoke-email@iso.com";
  await prisma.authToken.deleteMany({ where: { email } });

  // 1) Token de reset: peek não consome; consume consome (uso único).
  const raw = await createToken(email, "RESET");
  assert((await peekToken(raw, "RESET")) === email, "peek deve retornar o e-mail");
  assert((await peekToken(raw, "RESET")) === email, "peek é não destrutivo");
  assert((await consumeToken(raw, "RESET")) === email, "consume deve retornar o e-mail");
  assert((await consumeToken(raw, "RESET")) === null, "token consumido não vale de novo");

  // 2) Tipo errado é rejeitado.
  const inv = await createToken(email, "INVITE");
  assert((await consumeToken(inv, "RESET")) === null, "tipo divergente deve falhar");
  assert((await consumeToken(inv, "INVITE")) === email, "tipo correto deve valer");

  // 3) Mailer com degradação graciosa: sem chave, não entrega (sem lançar).
  const result = await sendMail({ to: email, subject: "x", html: "<p>x</p>" });
  if (!emailEnabled()) {
    assert(result.delivered === false, "sem RESEND_API_KEY, não deve entregar");
  }

  await prisma.authToken.deleteMany({ where: { email } });
  console.log("OK email/tokens:");
  console.log("  emailEnabled():", emailEnabled());
  console.log("  mailer.delivered:", result.delivered);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
