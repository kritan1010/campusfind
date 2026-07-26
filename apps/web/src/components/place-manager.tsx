"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PlaceMap } from "@/components/place-map";

type Place = { id: string; name: string; category: string; description: string | null; centroid_lat: number | null; centroid_lng: number | null; is_active: boolean };

export function PlaceManager({ places }: { places: Place[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("place");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choose = useCallback((nextLat: string, nextLng: string) => { setLatitude(nextLat); setLongitude(nextLng); }, []);

  async function createPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const { error: createError } = await supabase.rpc("admin_create_campus_zone", { p_name: name, p_category: category, p_description: description || null, p_lat: latitude ? Number(latitude) : null, p_lng: longitude ? Number(longitude) : null });
    if (createError) setError(createError.message); else { setName(""); setDescription(""); setLatitude(""); setLongitude(""); router.refresh(); }
    setPending(false);
  }

  return <section className="admin-place-section"><div className="admin-section-heading"><div><p className="section-kicker">Campus map</p><h2>Add a named place</h2><p>Click the map to place a public approximate location. Exact item pins remain private.</p></div></div><div className="place-manager-grid"><form className="place-form" onSubmit={createPlace}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} placeholder="Main library" /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>place</option><option>library</option><option>hostel</option><option>gate</option><option>cafeteria</option><option>office</option><option>classroom</option></select></label><label>Description <span>optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={400} /></label><div className="field-grid"><label>Latitude<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" placeholder="12.9716" /></label><label>Longitude<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" placeholder="77.5946" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={pending} type="submit">{pending ? "Saving place…" : "Add place"}</button></form><div><PlaceMap latitude={latitude} longitude={longitude} onChange={choose} /><p className="map-hint">OpenStreetMap-compatible map · Click to choose coordinates</p></div></div><ul className="admin-list admin-place-list">{places.map((place) => <li key={place.id}><span><strong>{place.name}</strong><small>{place.category} · {place.is_active ? "Active" : "Archived"}</small></span><small>{place.centroid_lat != null && place.centroid_lng != null ? `${place.centroid_lat.toFixed(4)}, ${place.centroid_lng.toFixed(4)}` : "No pin"}</small></li>)}</ul></section>;
}
