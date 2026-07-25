import { describe, expect, it } from "vitest";
import { getSafeNextPath, isPublicAuthPath } from "./routes";

describe("isPublicAuthPath", () => {
  it("allows the login flow without a session", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/login/verify")).toBe(true);
  });

  it("protects routes that merely start with the word login", () => {
    expect(isPublicAuthPath("/login-admin")).toBe(false);
    expect(isPublicAuthPath("/onboarding")).toBe(false);
  });
});

describe("getSafeNextPath", () => {
  it("keeps internal paths", () => {
    expect(getSafeNextPath("/onboarding?step=college")).toBe(
      "/onboarding?step=college",
    );
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(getSafeNextPath("https://example.com")).toBe("/");
    expect(getSafeNextPath("//example.com")).toBe("/");
  });
});
