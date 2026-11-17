import Link from "next/link";

export default function DashboardFooter({
  role,
}: {
  role: "admin" | "superadmin";
}) {
  return (
    <footer className="border-t border-rule bg-paper px-5 py-6 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-3 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono uppercase tracking-widest2">
          ResponKu · {role === "superadmin" ? "Superadmin" : "Admin"} workspace
        </p>
        <div className="flex gap-4 font-mono uppercase tracking-widest2">
          <Link href="/" className="hover:text-accent">
            Situs utama
          </Link>
          <Link href="/akun" className="hover:text-accent">
            Profil saya
          </Link>
        </div>
      </div>
    </footer>
  );
}
