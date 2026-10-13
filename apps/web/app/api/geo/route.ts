import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AuthOptions } from "@/app/api/auth/utils/auth";
import { prismaClient } from "@repo/db/client";

export async function GET(req: NextRequest) {
  const headers = req.headers;

  // Cloudflare Geolocation Headers (injected by Cloudflare Managed Transforms & IP Geolocation)
  const cfCity = headers.get("cf-ipcity");
  const cfCountry = headers.get("cf-ipcountry");
  const cfRegion = headers.get("cf-region");
  const cfIp = headers.get("cf-connecting-ip");

  // Vercel Geolocation Fallbacks (injected by Vercel Edge Network)
  const vercelCity = headers.get("x-vercel-ip-city");
  const vercelCountry = headers.get("x-vercel-ip-country");
  const vercelRegion = headers.get("x-vercel-ip-country-region");

  // Resolved values (Cloudflare first, then Vercel, then defaults)
  const rawCity = cfCity || vercelCity;
  const city = rawCity ? decodeURIComponent(rawCity) : null;
  const country = cfCountry || vercelCountry || null;
  const region = cfRegion || vercelRegion || null;
  const ip = cfIp || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  const isLocal = !cfCountry && !vercelCountry;
  const resolvedCity = city || (isLocal ? "Local Workspace" : "Unknown City");
  const resolvedCountry = country || (isLocal ? "Localhost" : "Global");

  try {
    const session = await getServerSession(AuthOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = (session?.user as any)?.email;

    if (userId || userEmail) {
      if (userId) {
        await prismaClient.$executeRawUnsafe(
          `UPDATE "User" SET "city" = $1, "country" = $2 WHERE "id" = $3`,
          resolvedCity,
          resolvedCountry,
          userId
        );
      } else if (userEmail) {
        await prismaClient.$executeRawUnsafe(
          `UPDATE "User" SET "city" = $1, "country" = $2 WHERE "email" = $3`,
          resolvedCity,
          resolvedCountry,
          userEmail
        );
      }
    }
  } catch (err) {
    console.error("Geo persistence error:", err);
  }

  return NextResponse.json({
    city: resolvedCity,
    country: resolvedCountry,
    region: region || "",
    ip,
    provider: cfCountry ? "Cloudflare Edge" : vercelCountry ? "Vercel Edge" : "Local Environment",
    isLocal,
  });
}
