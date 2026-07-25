"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Zone = { id: string; name: string };

export function ZoneList() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadZones() {
      const { data, error: queryError } = await createClient()
        .from("campus_zones")
        .select("id, name")
        .order("name");

      if (!active) return;
      if (queryError) setError("Campus zones could not be loaded.");
      else setZones(data ?? []);
    }

    void loadZones();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!zones.length) return <p className="loading-note">Reading the campus map…</p>;

  return (
    <ul className="zone-grid">
      {zones.map((zone, index) => (
        <li key={zone.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          {zone.name}
        </li>
      ))}
    </ul>
  );
}
