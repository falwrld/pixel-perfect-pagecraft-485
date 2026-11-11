import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { fmtData } from "@/lib/format";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Monitor FTP → SFTP" }, { name: "description", content: "Registro de todas as ações feitas pelos analistas." }, { property: "og:title", content: "Auditoria — Monitor FTP → SFTP" }, { property: "og:description", content: "Registro de todas as ações feitas pelos analistas." }] }),
  component: Auditoria,
});

function Auditoria() {
  const { abrirItem } = useApp();
  const [busca, setBusca] = useState("");
  const q = useQuery({ queryKey: ["eventos"], queryFn: () => api.eventos(500), refetchInterval: 30_000 });
  const t = busca.trim().toLowerCase();
  const ev = (q.data ?? []).filter((e) => !t || `${e.usuario} ${e.acao} ${e.detalhe} ${e.item_id ?? ""}`.toLowerCase().includes(t));
  return (
    <>
      <PageHeader title="Auditoria" subtitle="Últimas ações registradas." />
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Filtrar por analista, ação…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Analista</TableHead><TableHead>Ação</TableHead><TableHead>Item</TableHead><TableHead>Detalhe</TableHead></TableRow></TableHeader>
          <TableBody>
            {!q.isLoading && ev.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Nenhum evento.</TableCell></TableRow>}
            {ev.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs">{fmtData(e.quando)}</TableCell>
                <TableCell className="text-sm">{e.usuario}</TableCell>
                <TableCell className="font-mono text-xs">{e.acao}</TableCell>
                <TableCell>{e.item_id != null ? <button className="font-mono text-xs text-primary underline-offset-2 hover:underline" onClick={() => abrirItem(e.item_id)}>#{e.item_id}</button> : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.detalhe}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
