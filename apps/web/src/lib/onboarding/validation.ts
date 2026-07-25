export function normalizeDisplayName(value: string): string {
  const displayName = value.trim();

  if (!displayName) {
    throw new Error("Add your display name.");
  }

  if (displayName.length > 80) {
    throw new Error("Keep your display name under 80 characters.");
  }

  return displayName;
}

export function normalizeCollegeName(value: string): string {
  const collegeName = value.trim();

  if (collegeName.length < 2) {
    throw new Error("College names need at least 2 characters.");
  }

  if (collegeName.length > 120) {
    throw new Error("Keep the college name under 120 characters.");
  }

  return collegeName;
}

export function normalizeAvatarUrl(value: string): string | null {
  const avatarUrl = value.trim();
  if (!avatarUrl) return null;

  try {
    const parsed = new URL(avatarUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
    return parsed.toString();
  } catch {
    throw new Error("Use a valid http or https image URL.");
  }
}
