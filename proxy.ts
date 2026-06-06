import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware checks for the presence of an authentication token in cookies for protected routes. If the token is missing, it redirects the user to the login page. It also allows OAuth redirects to pass through without requiring a token.
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const isVerified = request.cookies.get("isVerified")?.value;

  // Allow OAuth redirect to pass once
  if (url.searchParams.get("from") === "auth" || url.searchParams.has("code")) {
    return NextResponse.next();
  }

  const protectedRoutes = ["/dashboard", "/income", "/expenses"];

  const isProtected = protectedRoutes.some((route) =>
    url.pathname.startsWith(route),
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtected && token && isVerified === "false") {
    const verifyUrl = new URL("/verify-request", request.url);
    verifyUrl.searchParams.set("from", url.pathname);
    return NextResponse.redirect(verifyUrl);
  }

  return NextResponse.next();
}

// Ensures the middleware runs only on the routes we care about
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/income",
    "/income/:path*",
    "/expenses",
    "/expenses/:path*",
  ],
};
