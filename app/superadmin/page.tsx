import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function SuperadminDashboardPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell
      role="superadmin"
      breadcrumb="Dashboard"
      title="Dashboard superadmin"
      description="Pusat kontrol tertinggi untuk approval editorial dan pengelolaan akses pengguna ResponKu."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow="Editorial"
          title="Approval artikel"
          description="Tinjau artikel yang masuk dan putuskan apakah artikel dapat diterbitkan atau dikembalikan ke penulis."
          href="/superadmin/artikel"
        />
        <DashboardCard
          eyebrow="Administrasi"
          title="Manajemen pengguna"
          description="Atur role reader, author, admin, dan superadmin dari satu halaman administrasi."
          href="/superadmin/pengguna"
        />
      </div>
    </DashboardShell>
  );
}

function DashboardCard({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <section className="border border-rule bg-paper p-6 sm:p-8">
      <p className="eyebrow text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-normal text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-lg leading-7 text-mute">{description}</p>
      <Link
        href={href}
        className="mt-7 inline-flex bg-accent px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-blue-600"
      >
        Buka halaman →
      </Link>
    </section>
  );
}
