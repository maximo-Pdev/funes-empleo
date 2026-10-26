"use client";

import type { ReactNode } from "react";
import { getRegistrationHref, HOME_REGISTRATION_EVENT, type RegistrationRole } from "@/features/accounts/registration-navigation";

export function HomeRegistrationLink({ role, className, children }: { role: RegistrationRole; className?: string; children: ReactNode }) {
  return <a href={getRegistrationHref(role)} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent(HOME_REGISTRATION_EVENT, { detail: role }));
  }}>{children}</a>;
}
