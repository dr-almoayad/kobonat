import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Fix for Next.js 15 ESM Interop
const authHandler = NextAuth.default || NextAuth;
const credentials = CredentialsProvider.default || CredentialsProvider;

export const authOptions = {
  providers: [
    credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentialsData) {
        if (!credentialsData?.email || !credentialsData?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentialsData.email }
        });

        if (!admin || !admin.isActive) return null;

        const isValid = await bcrypt.compare(credentialsData.password, admin.password);
        if (!isValid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isAdmin: true
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: { signIn: '/admin/login' },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = authHandler(authOptions);
export { handler as GET, handler as POST };