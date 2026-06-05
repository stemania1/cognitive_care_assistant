import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Root route. Redirect on the server so it works even when client-side
 * JavaScript is slow or stalls (e.g. iPad Safari during the intro animation),
 * which previously left the page stuck on "Redirecting to sign in…".
 * Signed-in users go straight to the dashboard; everyone else to sign-in.
 */
export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? "/dashboard" : "/signin");
}
