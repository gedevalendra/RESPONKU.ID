import { redirect } from "next/navigation";
import UserArticleManager from "@/app/components/user/UserArticleManager";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function UserArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun/artikel");
  return (
    <div className="wrap py-10 sm:py-14">
      <p className="eyebrow">Panel pembaca</p>
      <h1 className="mt-2 font-display text-display-lg">Artikel saya</h1>
      <p className="mt-3 max-w-2xl text-mute">
        Tulis dan kirim artikel. Semua kiriman masuk status pending sampai
        diperiksa redaksi.
      </p>
      <div className="mt-10">
        <UserArticleManager authorName={actor.displayName} />
      </div>
    </div>
  );
}
