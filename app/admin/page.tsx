import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  if (actor.role === "superadmin") redirect("/superadmin");
  return (
    <DashboardShell
      role="admin"
      breadcrumb="Dashboard"
      title="Dashboard admin"
      description="Selamat datang di ruang kerja ResponKu. Kelola artikel, periksa kiriman pengguna, dan atur informasi situs dari menu di sebelah kiri."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow="Editorial"
          title="Artikel & approval"
          description="Kelola naskah redaksi dan periksa artikel yang dikirim pengguna."
          href="/admin/artikel"
        />
        <DashboardCard
          eyebrow="Konten situs"
          title="Halaman Tentang"
          description="Atur sejarah, prinsip, ketentuan kontribusi, dan informasi ResponKu."
          href="/admin/tentang"
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
        className="mt-7 inline-flex bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-gray-600"
      >
        Buka halaman →
      </Link>
    </section>
  );
}
