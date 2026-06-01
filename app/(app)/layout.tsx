import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pt-14 lg:pl-64 lg:pt-0">{children}</div>
    </div>
  );
}
