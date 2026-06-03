import { redirect } from "next/navigation";

// Login is Google OAuth-only — there is no separate signup step. First Google login creates the
// account automatically. Keep /signup as an entry point but funnel it to the single sign-in screen.
export default function SignUpPage() {
  redirect("/signin");
}
