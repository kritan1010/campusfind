"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) throw new Error("Admin access required.");
  return supabase;
}

export async function approveCollege(formData: FormData) {
  const collegeId = String(formData.get("collegeId") ?? "");
  if (!collegeId) throw new Error("College is required.");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("review_college", { p_college_id: collegeId, p_approve: true, p_publicly_discoverable: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/onboarding");
}

export async function addLoyolaAcademy() {
  const supabase = await adminClient();
  const { data: existing, error: lookupError } = await supabase.from("colleges").select("id, status").ilike("name", "Loyola Academy").maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  let collegeId = existing?.id;
  if (!collegeId) {
    const { data, error } = await supabase.rpc("request_college", { requested_name: "Loyola Academy" });
    if (error) throw new Error(error.message);
    collegeId = data;
  }
  if (existing?.status !== "approved") {
    const { error } = await supabase.rpc("review_college", { p_college_id: collegeId, p_approve: true, p_publicly_discoverable: true });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin"); revalidatePath("/onboarding"); revalidatePath("/");
}
