import WebsiteStatusView from "@/app/components/status/WebsiteStatusView";
import { getWebsiteStatus } from "@/lib/website-status";

export const dynamic = "force-dynamic";

export default async function Page() {
  const stored = await getWebsiteStatus();
  // Halaman ini hanya untuk status gangguan; kalau sudah online, tampilkan sebagai maintenance seperti sebelumnya.
  const status = stored.status === "online" ? "maintenance" : stored.status;

  return <WebsiteStatusView status={status} message={stored.message} />;
}