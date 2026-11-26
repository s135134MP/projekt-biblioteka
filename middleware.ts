import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./utils/tokens";

const publicRoutes = [
  "/api/auth/login", "/api/auth/register", "/api/auth/refresh"
];

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authorization token required" }, { status: 401 });
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = await verifyAccessToken(token);
    if (payload) {
      const isAdminRoute = pathname.startsWith("/api/admin");

      if (isAdminRoute && payload.role !== "admin") {
        return NextResponse.json({message: "Forbidden"}, {status: 403})
      } else {
        NextResponse.next();
      }      
    }
  } catch {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"]
}