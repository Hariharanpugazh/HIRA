import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <DashboardProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </DashboardProvider>
    </SessionProviderWrapper>
  );
}