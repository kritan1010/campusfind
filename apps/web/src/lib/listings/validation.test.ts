import { describe, expect, it } from "vitest";
import { normalizeKeywords, toPrefixTsQuery, validateListingDraft } from "./validation";

const validDraft = {
  kind: "lost",
  title: "Black scientific calculator",
  description: "Last seen beside the second-floor library printers.",
  category: "electronics",
  eventDate: "2026-07-20",
  zoneId: "zone-id",
  exactLat: "",
  exactLng: "",
};

describe("validateListingDraft", () => {
  it("accepts a complete listing", () => {
    expect(validateListingDraft(validDraft)).toBeNull();
  });

  it("requires paired coordinates", () => {
    expect(validateListingDraft({ ...validDraft, exactLat: "12.9" })).toMatch(
      /both latitude and longitude/i,
    );
  });

  it("rejects a future event date", () => {
    expect(
      validateListingDraft(validDraft, new Date("2026-07-19T12:00:00Z")),
    ).toMatch(/future/i);
  });
});

describe("normalizeKeywords", () => {
  it("trims, de-duplicates, and caps keywords", () => {
    expect(normalizeKeywords("  casio, Black, casio, fx-991ES  ")).toEqual([
      "casio",
      "Black",
      "fx-991ES",
    ]);
  });
});

describe("toPrefixTsQuery", () => {
  it("builds a safe prefix query for partial word matching", () => {
    expect(toPrefixTsQuery("black calc!")).toBe("black:* & calc:*");
  });
});
