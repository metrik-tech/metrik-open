import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { Logger } from "next-axiom";

import { verifyJwt } from "./utils/auth";

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  const logger = new Logger({ source: "internal-middleware" });
  logger.middleware(req);

  if (req.nextUrl.hostname === "localhost") {
    return NextResponse.next();
  }

  const jwt =
    req.cookies.get("CF_Authorization")?.value ??
    req.headers.get("Cf-Access-Jwt-Assertion");

  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verified = await verifyJwt(jwt, logger);

  event.waitUntil(logger.flush());

  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
