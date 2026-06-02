import { Sidebar } from "@/components/layout/sidebar";
import { getViewer } from "@/lib/auth/role";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return (
    <div className="min-h-screen">
      <Sidebar viewer={viewer} />
      <div className="pt-14 lg:pl-64 lg:pt-0 print:!p-0">{children}</div>
    </div>
  );
}
