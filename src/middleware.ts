import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware leve (Edge): apenas lê a sessão JWT e aplica o callback `authorized`.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protege tudo, exceto assets estáticos, imagens e a rota de auth da API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
