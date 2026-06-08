import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <EmployeeForm />
      </div>
    </main>
  );
}
