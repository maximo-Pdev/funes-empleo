"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import styles from "@/app/(auth)/account/account.module.css";

/** Keep the role-specific server composition outside the interactive boundary. */
export function DashboardSidebar({ label, navigation, logout, identity }: {
  label: string;
  navigation: ReactNode;
  logout: ReactNode;
  identity: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const id = useId();
  return <Sidebar aria-label={label} className={styles.sidebar} data-collapsed={collapsed}>
    <SidebarContent id={`${id}-navigation`}>{navigation}</SidebarContent>
    <SidebarFooter className={styles.footer}>
      <div id={`${id}-logout`} className={styles.sidebarLogout}>{logout}</div>
      {identity}
      <Button variant="ghost" size="icon" className={styles.sidebarToggle}
        aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        aria-expanded={!collapsed} aria-controls={`${id}-navigation ${id}-logout`}
        onClick={() => setCollapsed(value => !value)}>
        <ChevronsDown className="size-6" aria-hidden="true" />
      </Button>
    </SidebarFooter>
  </Sidebar>;
}
