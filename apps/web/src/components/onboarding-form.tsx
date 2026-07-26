"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeAvatarUrl,
  normalizeCollegeName,
  normalizeDisplayName,
} from "@/lib/onboarding/validation";

type College = Pick<
  Database["public"]["Tables"]["colleges"]["Row"],
  "id" | "name"
>;

type OnboardingFormProps = {
  colleges: College[];
  initialAvatarUrl: string;
  initialCollegeId: string | null;
  initialDisplayName: string;
  mode?: "onboarding" | "profile";
};

type Affiliation = "approved" | "independent" | "request";

export function OnboardingForm({
  colleges,
  initialAvatarUrl,
  initialCollegeId,
  initialDisplayName,
  mode = "onboarding",
}: OnboardingFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [affiliation, setAffiliation] = useState<Affiliation>(
    initialCollegeId ? "approved" : "independent",
  );
  const [collegeId, setCollegeId] = useState(initialCollegeId ?? "");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [requestedCollege, setRequestedCollege] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filteredColleges = useMemo(() => {
    const query = collegeSearch.trim().toLowerCase();
    if (!query) return colleges.slice(0, 8);
    return colleges
      .filter((college) => college.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [collegeSearch, colleges]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const cleanDisplayName = normalizeDisplayName(displayName);
      const cleanAvatarUrl = normalizeAvatarUrl(avatarUrl);
      if (affiliation === "approved" && !collegeId) {
        throw new Error("Choose a college from the approved list.");
      }

      setPending(true);
      const supabase = createClient();

      if (affiliation === "request") {
        const cleanCollegeName = normalizeCollegeName(requestedCollege);
        const { error: requestError } = await supabase.rpc("request_college", {
          requested_name: cleanCollegeName,
        });
        if (requestError) {
          if (requestError.code === "23505") {
            throw new Error(
              "That college has already been requested. Ask an admin to approve it, or choose another option.",
            );
          }
          throw requestError;
        }
      }

      const profileUpdate = {
        avatar_url: cleanAvatarUrl,
        display_name: cleanDisplayName,
        onboarding_completed_at: new Date().toISOString(),
        ...(affiliation !== "request" && {
          college_id: affiliation === "approved" ? collegeId : null,
        }),
      };
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
      if (profileError) throw profileError;

      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile.");
      setPending(false);
    }
  }

  return (
    <form className="onboarding-form" onSubmit={submit} noValidate>
      <div className="form-section">
        <p className="section-kicker">01 · Your public card</p>
        <div className="field-grid">
          <div>
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="avatar-url">Avatar image URL <span>(optional)</span></label>
            <input
              id="avatar-url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              type="url"
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      <fieldset className="form-section affiliation-fieldset">
        <legend className="section-kicker">02 · Your community</legend>
        <label className="choice-card">
          <input
            type="radio"
            name="affiliation"
            checked={affiliation === "approved"}
            onChange={() => setAffiliation("approved")}
          />
          <span><strong>Join an approved college</strong><small>See your own campus community.</small></span>
        </label>
        {affiliation === "approved" && (
          <div className="college-picker">
            <label htmlFor="college-search">Search approved colleges</label>
            <input
              id="college-search"
              type="search"
              value={collegeSearch}
              onChange={(event) => setCollegeSearch(event.target.value)}
              placeholder="Start typing a college name"
            />
            <div className="college-results" role="listbox" aria-label="Approved colleges">
              {filteredColleges.length ? (
                filteredColleges.map((college) => (
                  <button
                    className={collegeId === college.id ? "selected" : ""}
                    type="button"
                    role="option"
                    aria-selected={collegeId === college.id}
                    key={college.id}
                    onClick={() => setCollegeId(college.id)}
                  >
                    <span>{college.name}</span>
                    <span>{collegeId === college.id ? "Selected" : "Choose"}</span>
                  </button>
                ))
              ) : (
                <p>No approved college matches that search.</p>
              )}
            </div>
          </div>
        )}

        <label className="choice-card">
          <input
            type="radio"
            name="affiliation"
            checked={affiliation === "request"}
            onChange={() => setAffiliation("request")}
          />
          <span><strong>Can’t find your college?</strong><small>Request it and join immediately.</small></span>
        </label>
        {affiliation === "request" && (
          <div className="college-picker">
            <label htmlFor="requested-college">College name</label>
            <input
              id="requested-college"
              value={requestedCollege}
              onChange={(event) => setRequestedCollege(event.target.value)}
              placeholder="Enter the official name"
              maxLength={120}
            />
            <p className="field-hint">
              It starts as pending, but your community works immediately. Approval
              only adds it to the public picker.
            </p>
          </div>
        )}

        <label className="choice-card">
          <input
            type="radio"
            name="affiliation"
            checked={affiliation === "independent"}
            onChange={() => setAffiliation("independent")}
          />
          <span><strong>Continue without a college</strong><small>Use CampusFind as an independent neighbour.</small></span>
        </label>
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Saving profile…" : mode === "profile" ? "Save profile" : "Finish setup"}
      </button>
    </form>
  );
}
