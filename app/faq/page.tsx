import Link from "next/link";
import { getActor } from "@/lib/authz";
import { commonQuestions } from "@/lib/faq";
import FaqQuestions from "@/app/components/user/FaqQuestions";
export default async function Page() {
  const actor = await getActor();
  return <div className="wrap py-8 sm:py-12"><div className="mx-auto max-w-3xl space-y-8"><header><h1 className="text-2xl font-semibold">Pertanyaan umum</h1><p className="mt-2 text-sm text-mute">Temukan bantuan seputar akun, artikel, dan aktivitas di ResponKu.</p></header><div className="divide-y divide-rule">{commonQuestions.map((item) => <details key={item.question} className="py-4"><summary className="cursor-pointer text-sm font-medium">{item.question}</summary><p className="mt-3 text-sm leading-6 text-mute">{item.answer}</p></details>)}</div>{actor ? <FaqQuestions /> : <p className="bg-gray-800/5 p-5 text-sm">Punya pertanyaan lain? <Link href="/masuk?next=/faq" className="text-blue-500">Masuk untuk bertanya</Link>.</p>}</div></div>;
}
