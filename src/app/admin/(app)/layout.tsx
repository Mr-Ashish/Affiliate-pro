import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar logoutAction={logoutAction} />
      <div className="md:pl-[var(--sidebar-width)]">
        <AdminTopBar
          title="AffiliateHub Admin"
          userEmail={session?.user?.email}
        />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
