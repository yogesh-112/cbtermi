import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session) redirect("/login");
  if (!session.businessId) redirect("/business-setup");

  // Load user's businesses
  const { data: members } = await supabase
    .from("business_members")
    .select("business_id, role, businesses(id, name)")
    .eq("user_id", session.id);

  const businesses = (members ?? []).map((m: any) => ({ id: m.businesses.id, name: m.businesses.name }));
  const currentBusiness = businesses.find((b) => b.id === session.businessId) ?? null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{ name: session.name, email: session.email }}
        businesses={businesses}
        currentBusiness={currentBusiness}
      />
      <main className="flex-1 lg:ml-60 min-h-screen bg-slate-50">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
