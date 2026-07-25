import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicAuthPath } from "@/lib/auth/routes";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { key, url } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthPath = isPublicAuthPath(request.nextUrl.pathname);

  if (!user && !isAuthPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
