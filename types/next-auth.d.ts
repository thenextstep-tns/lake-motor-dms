import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            companyId?: string
            lotId?: string | null
            roles?: string[]
            permissions?: string[]
        } & DefaultSession["user"]
    }
}
