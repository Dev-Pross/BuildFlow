import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions as NextAuthOptions, SessionStrategy } from "next-auth";
import bcrypt from "bcryptjs";
import { prismaClient } from "@repo/db/client";

export const AuthOptions: NextAuthOptions = {
  debug : true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prismaClient.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy, // Typed correctly to fit AuthOptions interface
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user ?? {};
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};