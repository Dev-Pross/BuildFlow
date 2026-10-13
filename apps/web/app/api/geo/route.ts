import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json({
    city: city || (isLocal ? "Local Workspace" : "Unknown City"),
    country: country || (isLocal ? "Localhost" : "Global"),
    region: region || "",
    ip,
    provider: cfCountry ? "Cloudflare Edge" : vercelCountry ? "Vercel Edge" : "Local Environment",
    isLocal,
  });
}
