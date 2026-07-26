export default function Loading() {
  return (
    <main className="route-loading" aria-live="polite" aria-label="Loading CampusFind">
      <div className="typing-indicator" aria-hidden="true">
        <div className="typing-circle" />
        <div className="typing-circle" />
        <div className="typing-circle" />
        <div className="typing-shadow" />
        <div className="typing-shadow" />
        <div className="typing-shadow" />
      </div>
      <div className="loading-progress" aria-hidden="true"><span /></div>
      <p>Loading CampusFind…</p>
    </main>
  );
}
