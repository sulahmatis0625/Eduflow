import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

if (!hasDatabase && process.env.NODE_ENV !== "production") {
  console.warn(
    "No DATABASE_URL or DIRECT_URL configured. Using in-memory fallback for auth. " +
      "Registered users will not persist across restarts."
  );
}

const demoUsers = {
  "admin@eduflow.com": {
    id: "demo-admin",
    email: "admin@eduflow.com",
    name: "Admin User",
    image: null,
    role: "ADMIN",
  },
  "instructor@eduflow.com": {
    id: "demo-instructor",
    email: "instructor@eduflow.com",
    name: "Instructor User",
    image: null,
    role: "INSTRUCTOR",
  },
  "student@eduflow.com": {
    id: "demo-student",
    email: "student@eduflow.com",
    name: "Student User",
    image: null,
    role: "STUDENT",
  },
} as const;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: hasDatabase ? PrismaAdapter(db as any) : undefined,
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        // Prefer real DB users when DATABASE_URL is configured (seeded demo accounts).
        if (hasDatabase) {
          const user = await db.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
          });

          if (user?.hashedPassword) {
            const isActive = user.isActive ?? true;
            if (!isActive) return null;

            const isValid = await bcrypt.compare(password, user.hashedPassword);
            if (!isValid) return null;

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
            };
          }
        }

        // Fallback demo users only when there is no DB (or user not found in DB).
        const demoUser = demoUsers[email as keyof typeof demoUsers];
        if (demoUser && password === "password123") {
          return demoUser;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
