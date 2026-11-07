import { AdminHeader } from "@/components/layout/admin-header";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const metadata = {
  title: "Admin Panel - EduFlow",
  description: "EduFlow administration dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AdminSidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <AdminHeader />
        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
