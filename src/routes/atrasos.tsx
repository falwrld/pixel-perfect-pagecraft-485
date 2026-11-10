import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/atrasos")({
  head: () => ({ meta: [{ title: "Atrasos — Monitor FTP → SFTP" }, { name: "description", content: "Atrasos do Monitor FTP → SFTP (SPPREV)." }, { property: "og:title", content: "Atrasos — Monitor FTP → SFTP" }, { property: "og:description", content: "Atrasos do Monitor FTP → SFTP (SPPREV)." }] }),
  component: () => <PageHeader title="Atrasos" subtitle="Tela em construção." />,
});
