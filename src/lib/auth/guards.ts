import "server-only";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { readAccountSession } from "./session";

export async function requireActiveAccount(roles?: readonly Database["public"]["Enums"]["account_role"][]) {
  const session = await readAccountSession();
  if (!session) redirect("/session-expired");
  if (session.account.status === "suspended") redirect("/account-suspended");
  if (session.account.status !== "active") redirect("/session-expired");
  if (roles && !roles.includes(session.account.role)) redirect("/account");
  return session;
}
