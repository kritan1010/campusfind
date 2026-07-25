import Link from "next/link";
import { signOut } from "@/app/actions";

export function BoardHeader() {
  return (
    <header className="topbar board-topbar">
      <Link href="/" className="wordmark" aria-label="CampusFind home">
        Campus<span>Find</span>
      </Link>
      <nav className="board-nav" aria-label="Primary navigation">
        <Link href="/listings">Browse board</Link>
        <Link className="nav-post" href="/listings/new">Post an item</Link>
        <Link href="/onboarding">Profile</Link>
        <form action={signOut}>
          <button className="text-button" type="submit">Sign out</button>
        </form>
      </nav>
    </header>
  );
}
