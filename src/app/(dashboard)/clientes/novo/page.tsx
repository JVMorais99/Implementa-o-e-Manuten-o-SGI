import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { createClient } from "../actions";

export default function NovoClientePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Novo cliente"
        breadcrumb={[
          { label: "Clientes", href: "/clientes" },
          { label: "Novo" },
        ]}
      />
      <Card>
        <ClientForm action={createClient} />
      </Card>
    </div>
  );
}
