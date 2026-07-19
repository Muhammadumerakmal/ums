import { redirect } from "next/navigation";

export default function Home() {
  // Entry point routes to sign-in; authenticated users are sent onward by the login flow.
  redirect("/login");
}
