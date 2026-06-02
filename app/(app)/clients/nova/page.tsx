import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <ClientForm />
      </div>
    </main>
  );
}
