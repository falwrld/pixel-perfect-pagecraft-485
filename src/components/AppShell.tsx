import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, History, Inbox, ShieldCheck, ArrowRightLeft, FlaskConical } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from "@/components/ui/sidebar";
import { StatusBar } from "./StatusBar";
import { ItemSheet } from "./ItemSheet";
import { NomeAnalistaDialog } from "./NomeAnalistaDialog";
import { MODO_DEMO } from "@/lib/api";

const NAV = [
  { to: "/", label: "Pendentes", icon: Inbox },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/atrasos", label: "Atrasos", icon: ClipboardList },
  { to: "/auditoria", label: "Auditoria", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
                <ArrowRightLeft className="size-4" />
              </div>
              <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-semibold">Monitor FTP → SFTP</div>
                <div className="text-[11px] opacity-70">SPPREV · Atlantic Solutions</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((n) => (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton asChild isActive={path === n.to} tooltip={n.label}>
                        <Link to={n.to}>
                          <n.icon />
                          <span>{n.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          {MODO_DEMO && (
            <div className="flex items-center gap-2 bg-warning px-4 py-1 text-xs font-medium text-warning-foreground">
              <FlaskConical className="size-3.5" /> Modo demonstração — dados fictícios. Defina VITE_API_BASE_URL para usar a API real.
            </div>
          )}
          <StatusBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <ItemSheet />
      <NomeAnalistaDialog />
    </SidebarProvider>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
