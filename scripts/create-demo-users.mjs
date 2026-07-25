import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for this one-time admin task.");
}
if (!process.env.DEMO_USER_PASSWORD || !process.env.ADMIN_USER_PASSWORD) {
  throw new Error("Set DEMO_USER_PASSWORD and ADMIN_USER_PASSWORD to strong, different values.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  { email: "demo@campusfind.test", password: process.env.DEMO_USER_PASSWORD, admin: false, fullName: "CampusFind Demo" },
  { email: "admin@campusfind.test", password: process.env.ADMIN_USER_PASSWORD, admin: true, fullName: "CampusFind Admin" },
];

for (const account of accounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  });
  if (error && !/already been registered/i.test(error.message)) throw error;
  let userId = data.user?.id;
  if (!userId) {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    userId = users.users.find((user) => user.email === account.email)?.id;
  }
  if (!userId) throw new Error(`Could not find ${account.email} after creating it.`);
  if (userId) {
    const { error: profileError } = await supabase.from("profiles").update({ is_admin: account.admin }).eq("id", userId);
    if (profileError) throw profileError;
  }
}

console.log("Demo accounts are ready. Change both passwords before any public deployment.");
