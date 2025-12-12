import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRoleType, DEFAULT_ROLES } from "@/app/domain/constants";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Explicitly merge strategy
  callbacks: {
    ...authConfig.callbacks, // Keep authorized callback
    async signIn({ user }) {
      if (!user.email) return false;

      // Log Sign In
      const { SystemLogger } = await import('@/lib/logger');
      await SystemLogger.log('USER_LOGIN', { email: user.email }, { id: user.id, name: user.name, companyId: null });

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
          // Fetch Default Lot (Main Location)
          const defaultLot = await prisma.lot.findFirst({
            where: { companyId: defaultCompany.id }
          });

          // Check existing members count to decide if this is the First User (Owner)
          const memberCount = await prisma.companyMember.count({
            where: { companyId: defaultCompany.id }
          });

          // Determine Role: Owner if first, else Sales Manager
          const targetRoleName = memberCount === 0 ? DEFAULT_ROLES[UserRoleType.CompanyOwner] : DEFAULT_ROLES[UserRoleType.SalesManager];

          const roleToAssign = await prisma.role.findFirst({
            where: {
              companyId: defaultCompany.id,
              name: targetRoleName
            }
          });

          if (roleToAssign) {
            await prisma.companyMember.create({
              data: {
                userId: dbUser.id,
                companyId: defaultCompany.id,
                lotId: defaultLot?.id,
                accessibleLots: defaultLot ? {
                  connect: { id: defaultLot.id }
                } : undefined,
                roles: {
                  connect: { id: roleToAssign.id }
                }
              }
            });
            console.log(`Auto-assigned ${user.email} to Default Company as ${targetRoleName}`);
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Fetch fresh member data/context using token.sub (userId)
        session.user.id = token.sub; // Ensure ID is set from token

        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
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
              if (rp.permission.action === 'manage' && rp.permission.resource === 'all') {
                perms.add('admin');
              }
            });
          });
          session.user.permissions = Array.from(perms);
        }
      }
      // Ensure structure logic
      return session;
    },
  },
});
