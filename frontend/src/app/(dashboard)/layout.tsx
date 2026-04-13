import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 mt-16 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
