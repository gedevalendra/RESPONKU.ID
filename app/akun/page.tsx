import { redirect } from "next/navigation";
import UserDashboard from "@/app/components/user/UserDashboard";
import ProfileSettings from "@/app/components/user/ProfileSettings";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun");
  return <div className="wrap py-10 sm:py-14"><p className="eyebrow">Akun pembaca</p><h1 className="mt-2 font-display text-display-lg">Dashboard kamu</h1><p className="mt-3 max-w-2xl text-mute">Kelola profil, pantau status artikel, dan lihat notifikasi editorial.</p><div className="mt-10 space-y-10"><ProfileSettings initial={actor} /><UserDashboard actor={actor} /></div></div>;
}
