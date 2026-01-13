import { convexAuth } from "@convex-dev/auth/server";
import { WhatsAppPhone } from "./phoneAuth";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [WhatsAppPhone],
});
