import { redirect } from "next/navigation";
import UserArticleManager from "@/app/components/user/UserArticleManager";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function UserArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun/artikel");
  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-2 border-b border-rule pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Panel pembaca</p>
          <h1 className="mt-1 font-display text-display-lg">Artikel saya</h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-mute lg:text-right">
          Tulis dan kirim artikel. Semua kiriman masuk status pending sampai
          diperiksa redaksi.
        </p>
      </header>
      <div className="mt-6">
        <UserArticleManager authorName={actor.displayName} />
      </div>
    </div>
  );
}
