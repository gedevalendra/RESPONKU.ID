import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/authz";
import AccountSettings from "@/app/components/user/AccountSettings";
import Organizations from "@/app/components/user/Organizations";
import { linkedOAuthProviders } from "@/lib/account-identity";
export default async function Page() {
  const actor = await getActor();
  if (!actor) redirect("/masuk");
  const linkedProviders = await linkedOAuthProviders(actor.id);
  return (
    <div className="wrap py-8 sm:py-12">
      <header className="mb-6 border-b border-rule pb-5 sm:mb-8">
        <Link href="/akun" className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
          <i className="bx bx-arrow-back" aria-hidden="true" /> Kembali ke profil
        </Link>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">Pengaturan akun</h1>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <AccountSettings actor={actor} linkedProviders={linkedProviders} />
        <Organizations />
      </div>
    </div>
  );
}
