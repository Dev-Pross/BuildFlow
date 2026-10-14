import type { AuthOptions as NextAuthOptions, SessionStrategy } from "next-auth";
import { prismaClient } from "@repo/db/client";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
export const AuthOptions: NextAuthOptions = {
  debug: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",

      async profile(profile, tokens) {
        let email = profile.email;
        if (!email && tokens.access_token) {
          try {
            const res = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                "User-Agent": "BuildFlow",
              },
            });
            if (res.ok) {
              const emails = await res.json();
              const primaryEmail = emails.find(
                (item: any) => item.primary && item.verified
              );
              email = primaryEmail ? primaryEmail.email : emails[0]?.email;
            }
          } catch (err) {
            console.error("Failed to fetch GitHub private email:", err);
          }
        }

        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: email,
          image: profile.avatar_url,
        };
      },
    }),


  ],
  session: {
    strategy: "jwt" as SessionStrategy, // Typed correctly to fit AuthOptions interface
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        let city: string | undefined = undefined;
        let country: string | undefined = undefined;

        try {
          const reqHeaders = await headers();
          const cfCity = reqHeaders.get("cf-ipcity") || reqHeaders.get("x-vercel-ip-city");
          const cfCountry = reqHeaders.get("cf-ipcountry") || reqHeaders.get("x-vercel-ip-country");
          if (cfCity) city = decodeURIComponent(cfCity);
          if (cfCountry) country = cfCountry;
        } catch {
          // headers() may not be accessible in all background contexts
        }

        const dbUser = await (prismaClient.user as any).upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name,
            password: "",
            image: user.image,
          }
        });

        if (city || country) {
          try {
            await prismaClient.$executeRawUnsafe(
              `UPDATE "User" SET "city" = COALESCE($1, "city"), "country" = COALESCE($2, "country") WHERE "id" = $3`,
              city || null,
              country || null,
              dbUser.id
            );
          } catch (geoErr) {
            console.error("Non-blocking geo update error in signIn:", geoErr);
          }
        }

        user.id = dbUser.id;
        (user as any).city = city || dbUser.city || null;
        (user as any).country = country || dbUser.country || null;
        return true;
      }
      catch (e) {
        console.error("Error saving OAuth user:", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.picture = user.image;
        token.city = (user as any).city;
        token.country = (user as any).country;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user ?? {};
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        session.user.image = (token.picture as string) || null;
        (session.user as any).city = (token.city as string) || null;
        (session.user as any).country = (token.country as string) || null;

        (session as any).accessToken = jwt.sign(
          { id: token.id, sub: token.id, email: token.email },
          SECRET,
          { expiresIn: "7d" }
        );
      }
      return session;
    },

  },
  secret: SECRET,
};