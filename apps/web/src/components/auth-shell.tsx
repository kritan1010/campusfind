import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  step: string;
  title: ReactNode;
  description: string;
};

export function AuthShell({ children, description, step, title }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="About CampusFind">
        <div className="brand-pin" aria-hidden="true" />
        <p className="eyebrow">Campus lost &amp; found</p>
        <p className="story-mark">CampusFind</p>
        <blockquote>
          “Lost it?
          <br />
          <em>Someone found it.</em>”
        </blockquote>
        <ol className="return-chain" aria-label="How a return works">
          <li>Post</li>
          <li>Match</li>
          <li>Prove it</li>
          <li>Return</li>
        </ol>
      </section>

      <section className="auth-panel">
        <div className="claim-ticket">
          <div className="ticket-topline">
            <span>{step}</span>
            <span>Registered users only</span>
          </div>
          <h1>{title}</h1>
          <p className="panel-description">{description}</p>
          {children}
          <p className="privacy-note">
            Your email confirms the inbox and stays private. CampusFind never
            shows it to another user.
          </p>
        </div>
      </section>
    </main>
  );
}
