import { withClerkMiddleware } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ratelimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "20 s"),
});

export default withClerkMiddleware(async (_req: NextRequest) => {
  const pathname = _req.nextUrl.pathname;
  if (pathname.startsWith("/api")) {
    const ip = _req.ip ?? "127.0.0.1";
    const { success } = await ratelimiter.limit(ip);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
  }
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     */
    "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)",
  ],
};
