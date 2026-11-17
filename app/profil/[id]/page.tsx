import { redirect, notFound } from "next/navigation";
import { publicProfile } from "@/lib/community";

export default async function Page({ params }: { params: { id: string } }) {
  const profile = await publicProfile(params.id);
  if (!profile) notFound();
  redirect(`/akun/${encodeURIComponent(profile.username || profile.id)}`);
}
