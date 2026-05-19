import { AdminSidebar } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="gradient-shell min-h-screen md:flex">
      <AdminSidebar />
      <main className="w-full p-4 md:p-8">{children}</main>
    </div>
  );
}
