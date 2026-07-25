import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeOtp } from "./validation";

describe("normalizeEmail", () => {
  it("normalizes a valid email address", () => {
    expect(normalizeEmail("  Student@Example.edu  ")).toBe("student@example.edu");
  });

  it("rejects malformed email addresses", () => {
    expect(() => normalizeEmail("student-at-example.edu")).toThrow(
      "Enter a valid email address.",
    );
  });
});

describe("normalizeOtp", () => {
  it("accepts exactly six digits", () => {
    expect(normalizeOtp(" 123456 ")).toBe("123456");
  });

  it("rejects codes that are not exactly six digits", () => {
    expect(() => normalizeOtp("12345a")).toThrow("Enter the 6-digit code.");
  });
});
