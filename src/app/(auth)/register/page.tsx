import { redirect } from "next/navigation";

// Auto-cadastro desativado: contas são criadas apenas por convite do admin
// (ver src/app/(dashboard)/equipe). Qualquer acesso a /register vai para o login.
export default function RegisterPage() {
  redirect("/login");
}
