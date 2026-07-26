import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ListingForm } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: zones } = await supabase.from("campus_zones").select("id, name").order("name");

  return <main className="board-shell form-page"><BoardHeader /><header className="form-page-heading"><p className="eyebrow">New report</p><h1>Help it get <em>home.</em></h1><p>Share the right details, choose who should see the report, and keep exact information private until it is useful.</p></header><section className="form-paper"><ListingForm zones={zones ?? []} /></section></main>;
}
