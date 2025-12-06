import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRoleType, DEFAULT_ROLES } from "@/app/domain/constants";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Auto-assignment Logic for Orphans
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { memberships: true },
      });

      // If user exists and has no memberships, try to assign to Default Company
      if (dbUser && dbUser.memberships.length === 0) {
        // Find the Default Company (from Seed)
        const defaultCompany = await prisma.company.findFirst({
          where: { name: "Lake Motor DMS" }
        });

        if (defaultCompany) {
          // Decide Role: If it's the VERY FIRST user (ignoring the seed logic if it created users, but my seed didn't), make them Admin?
          // Or just make everyone "Pending" / "Sales"?
          // User request: "I want all of my users to be google users for now... standard users see lots created for them"
          // Let's assign them as "Sales Manager" by default to "Main Location" if exists.

          const defaultLot = await prisma.lot.findFirst({
            where: { companyId: defaultCompany.id }
          });

          // Find Sales Manager Role
          const salesRole = await prisma.role.findFirst({
            where: {
              companyId: defaultCompany.id,
              name: DEFAULT_ROLES[UserRoleType.SalesManager]
            }
          });

          if (salesRole) {
            await prisma.companyMember.create({
              data: {
                userId: dbUser.id,
                companyId: defaultCompany.id,
                lotId: defaultLot?.id,
                roles: {
                  connect: { id: salesRole.id }
                }
              }
            });
            console.log(`Auto-assigned ${user.email} to Default Company as Sales Manager`);
          }
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        // Fetch fresh member data/context
        // Note: 'user' arg in session callback might be stale or structure depends on strategy (jwt vs db). 
        // With PrismaAdapter, session strategy is usually "database" by default, so 'user' is the DB user.

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              include: {
                roles: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            }
          }
        });

        if (dbUser && dbUser.memberships.length > 0) {
          // Resolve Context: Prefer currentLotId, else first membership
          let activeMembership = dbUser.memberships[0];

          if (dbUser.currentLotId) {
            const found = dbUser.memberships.find(m => m.lotId === dbUser.currentLotId);
            if (found) activeMembership = found;
          }

          session.user.companyId = activeMembership.companyId;
          session.user.lotId = activeMembership.lotId;
          session.user.roles = activeMembership.roles.map(r => r.name);

          // Flatten Permissions
          const perms = new Set<string>();
          activeMembership.roles.forEach(r => {
            r.permissions.forEach(rp => {
              perms.add(`${rp.permission.action}:${rp.permission.resource}`);
              // If Manage:all, maybe add specific flag?
              if (rp.permission.action === 'manage' && rp.permission.resource === 'all') {
                perms.add('admin');
              }
            });
          });
          session.user.permissions = Array.from(perms);
        }
      }
      return session;
    },
  },
});
