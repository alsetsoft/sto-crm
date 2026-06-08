import { ServiceForm } from "@/components/services/service-form";

export default function NewServicePage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <ServiceForm />
      </div>
    </main>
  );
}
