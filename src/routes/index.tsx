import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { FilaTabela } from "@/components/FilaTabela";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Pendentes — Monitor FTP → SFTP" }, { name: "description", content: "Arquivos recebidos no FTP aguardando despacho para o SFTP." }, { property: "og:title", content: "Pendentes — Monitor FTP → SFTP" }, { property: "og:description", content: "Arquivos recebidos no FTP aguardando despacho para o SFTP." }] }),
  component: Pendentes,
});

function Pendentes() {
  const q = useQuery({ queryKey: ["fila", "pendente"], queryFn: () => api.fila("pendente"), refetchInterval: 10_000 });
  return (
    <>
      <PageHeader title="Pendentes" subtitle="Clique em um arquivo para conferir e despachar." />
      <FilaTabela itens={q.data} carregando={q.isLoading} />
    </>
  );
}
