import { describe, expect, it } from "vitest";
import { normalizeAvatarUrl, normalizeCollegeName, normalizeDisplayName } from "./validation";

describe("onboarding validation", () => {
  it("trims a usable display name", () => {
    expect(normalizeDisplayName("  Kiran Rao  ")).toBe("Kiran Rao");
  });

  it("rejects an empty display name", () => {
    expect(() => normalizeDisplayName("   ")).toThrow("Add your display name.");
  });

  it("requires a meaningful college name", () => {
    expect(() => normalizeCollegeName("A")).toThrow(
      "College names need at least 2 characters.",
    );
  });

  it("accepts an empty avatar and rejects non-web URLs", () => {
    expect(normalizeAvatarUrl(" ")).toBeNull();
    expect(() => normalizeAvatarUrl("javascript:alert(1)")).toThrow(
      "Use a valid http or https image URL.",
    );
  });
});
