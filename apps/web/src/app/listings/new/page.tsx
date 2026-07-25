import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ListingForm } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: zones } = await supabase.from("campus_zones").select("id, name").order("name");

  return <main className="board-shell form-page"><BoardHeader /><header className="form-page-heading"><p className="eyebrow">New evidence card</p><h1>Pin it while the trail is <em>fresh</em>.</h1><p>Share enough to help the right person recognise the item. Keep private proof out of the public description.</p></header><section className="form-paper"><ListingForm zones={zones ?? []} /></section></main>;
}
