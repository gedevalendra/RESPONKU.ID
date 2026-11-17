import type { UserRole } from "@/lib/types";

export function superadminEmails() {
  return (
    process.env.SUPERADMIN_EMAILS ||
    process.env.SUPERADMIN_EMAIL ||
    "admin@responku.id,funikindev@gmail.com"
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(email: string): UserRole {
  return superadminEmails().includes(email.toLowerCase())
    ? "superadmin"
    : "reader";
}
