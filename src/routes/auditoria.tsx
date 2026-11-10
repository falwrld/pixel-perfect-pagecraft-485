import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Monitor FTP → SFTP" }, { name: "description", content: "Auditoria do Monitor FTP → SFTP (SPPREV)." }, { property: "og:title", content: "Auditoria — Monitor FTP → SFTP" }, { property: "og:description", content: "Auditoria do Monitor FTP → SFTP (SPPREV)." }] }),
  component: () => <PageHeader title="Auditoria" subtitle="Tela em construção." />,
});
