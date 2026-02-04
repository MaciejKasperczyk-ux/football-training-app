// Fix 3: NextAuth route in App Router must export GET and POST as named exports
// Replace src/app/api/auth/[...nextauth]/route.ts with this

import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
