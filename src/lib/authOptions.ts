// Fix 4: make sure you are importing authOptions from the right place
// src/lib/authOptions.ts must export authOptions (named export)

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        await dbConnect();
        const user = await User.findOne({ email }).lean();
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          hasPasswordChanged: user.hasPasswordChanged,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.name = (user as any).name;
        token.hasPasswordChanged = (user as any).hasPasswordChanged;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = session.user ?? {};
      (session.user as any).role = token.role;
      (session.user as any).name = token.name as any;
      (session.user as any).hasPasswordChanged = token.hasPasswordChanged;
      return session;
    },
  },
};
