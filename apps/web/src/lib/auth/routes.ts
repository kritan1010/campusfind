export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export function getSafeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
