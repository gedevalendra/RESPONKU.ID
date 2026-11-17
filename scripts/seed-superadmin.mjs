import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
if (!url || !serviceKey) throw new Error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terlebih dahulu");
if (!email || !password) throw new Error("Isi SUPERADMIN_EMAIL dan SUPERADMIN_PASSWORD terlebih dahulu");

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
let user = list.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  const result = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: "Superadmin ResponKu" } });
  if (result.error) throw result.error;
  user = result.data.user;
} else {
  const result = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (result.error) throw result.error;
}
const { error } = await supabase.from("profiles").upsert({ id: user.id, email, display_name: "Superadmin ResponKu", role: "superadmin" });
if (error) throw error;
console.log(`Superadmin siap: ${email}`);
