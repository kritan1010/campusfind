export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return email;
}

export function normalizeOtp(value: string): string {
  const token = value.trim();

  if (!/^\d{6}$/.test(token)) {
    throw new Error("Enter the 6-digit code.");
  }

  return token;
}
