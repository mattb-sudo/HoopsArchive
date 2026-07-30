import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const next = searchParams?.next;
  const safeNext = next && next.startsWith("/") ? next : "/accueil";
  return <LoginForm next={safeNext} />;
}
