import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileNav from "@/components/layout/MobileNav";
import Topbar from "@/components/layout/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session) redirect("/login");
  if (!session.businessId) redirect("/business-setup");

  const { data: members } = await supabase
    .from("business_members")
    .select("business_id, role, businesses(id, name)")
    .eq("user_id", session.id);

  const businesses = (members ?? []).map((m: any) => ({ id: m.businesses.id, name: m.businesses.name }));
  const currentBusiness = businesses.find((b) => b.id === session.businessId) ?? null;
  const userProps = { name: session.name, email: session.email };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar user={userProps} businesses={businesses} currentBusiness={currentBusiness} />
      <MobileHeader user={userProps} businesses={businesses} currentBusiness={currentBusiness} />
      <Topbar user={userProps} businesses={businesses} currentBusiness={currentBusiness} />
      <MobileNav />
      <main className="flex-1 sb-ml min-h-screen">
        <div className="p-4 lg:p-6 pt-[72px] lg:pt-[68px] pb-24 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
