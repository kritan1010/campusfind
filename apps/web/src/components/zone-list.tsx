type Zone = { id: string; name: string };

export function ZoneList({ zones }: { zones: Zone[] }) {
  if (!zones.length) return <p className="loading-note">No campus locations have been added yet.</p>;
  return <ul className="zone-grid">{zones.map((zone) => <li key={zone.id}>{zone.name}</li>)}</ul>;
}
