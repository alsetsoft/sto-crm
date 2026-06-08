import { AppShell } from "@/components/layout/app-shell";
import { getViewer } from "@/lib/auth/role";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
