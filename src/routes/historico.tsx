import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { FilaTabela } from "@/components/FilaTabela";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico — Monitor FTP → SFTP" }, { name: "description", content: "Arquivos já enviados, ignorados ou tratados manualmente." }, { property: "og:title", content: "Histórico — Monitor FTP → SFTP" }, { property: "og:description", content: "Arquivos já enviados, ignorados ou tratados manualmente." }] }),
  component: Historico,
});

type F = "todos" | "enviado" | "ignorado" | "manual";

function Historico() {
  const [f, setF] = useState<F>("todos");
  const q = useQuery({ queryKey: ["fila", "todos"], queryFn: () => api.fila("todos"), refetchInterval: 30_000 });
  const itens = q.data?.filter((i) => i.status !== "pendente" && i.status !== "enviando" && (f === "todos" || i.status === f));
  const exportar = async () => {
    try { await api.exportarXlsx(); } catch (e) { toast.error(e instanceof ApiError ? e.detail : "Falha ao exportar"); }
  };
  return (
    <>
      <PageHeader title="Histórico" subtitle="Arquivos concluídos." actions={<Button variant="outline" size="sm" onClick={exportar}><Download className="size-4" /> Exportar Excel</Button>} />
      <Tabs value={f} onValueChange={(v) => setF(v as F)} className="mb-3">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="enviado">Enviados</TabsTrigger>
          <TabsTrigger value="ignorado">Ignorados</TabsTrigger>
          <TabsTrigger value="manual">Manuais</TabsTrigger>
        </TabsList>
      </Tabs>
      <FilaTabela itens={itens} carregando={q.isLoading} historico />
    </>
  );
}
