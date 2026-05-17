import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminTopbar from "@/components/admin/Topbar";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Fetch nav counts
  const [biz, users, subs] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
  ]);

  const counts = {
    businesses: biz.count ?? 0,
    users:      users.count ?? 0,
    activeSubs: subs.count ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <AdminSidebar admin={{ name: session.name, email: session.email, role: session.role }} counts={counts} />
      <AdminTopbar adminName={session.name} />
      <main className="ml-[220px] pt-[52px] min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
