import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico — Monitor FTP → SFTP" }, { name: "description", content: "Histórico do Monitor FTP → SFTP (SPPREV)." }, { property: "og:title", content: "Histórico — Monitor FTP → SFTP" }, { property: "og:description", content: "Histórico do Monitor FTP → SFTP (SPPREV)." }] }),
  component: () => <PageHeader title="Histórico" subtitle="Tela em construção." />,
});
