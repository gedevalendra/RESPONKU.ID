import "server-only";

import WebsiteStatusView from "@/app/components/status/WebsiteStatusView";
import { getWebsiteStatus } from "@/lib/website-status";
import { getActor, isSuperAdmin } from "@/lib/authz";

type Props = { pathname: string; children: React.ReactNode };

export default async function WebsiteStatusGate({ pathname, children }: Props) {
  const bypass =
    pathname.startsWith("/superadmin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/masuk";
  if (bypass) return <>{children}</>;

  const status = await getWebsiteStatus();
  if (status.status === "online") return <>{children}</>;

  const actor = await getActor();
  if (actor && isSuperAdmin(actor.role)) return <>{children}</>;

  return (
    <WebsiteStatusView
      status={status.status}
      message={status.message}
      pathname={pathname}
    />
  );
}