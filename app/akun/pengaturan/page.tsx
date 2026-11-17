import { redirect } from "next/navigation";
import { getActor } from "@/lib/authz";
import AccountSettings from "@/app/components/user/AccountSettings";
import Organizations from "@/app/components/user/Organizations";
export default async function Page() {
  const actor = await getActor();
  if (!actor) redirect("/masuk");
  return <div className="wrap space-y-8 py-8"><AccountSettings actor={actor} /><Organizations /></div>;
}
