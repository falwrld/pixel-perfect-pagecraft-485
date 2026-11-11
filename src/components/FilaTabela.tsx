import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import type { Item } from "@/lib/api";
import { fmtData, fmtTamanho, parseBrt } from "@/lib/format";
import { useApp } from "@/lib/app-context";
import { AlertasItem, StatusBadge } from "./badges";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Chave = "modificado" | "nome" | "pasta" | "concluido";

export function FilaTabela({ itens, carregando, historico = false }: { itens: Item[] | undefined; carregando: boolean; historico?: boolean }) {
  const { abrirItem } = useApp();
  const [busca, setBusca] = useState("");
  const [ord, setOrd] = useState<{ k: Chave; desc: boolean }>({ k: historico ? "concluido" : "modificado", desc: true });

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const l = (itens ?? []).filter((i) => !q || `${i.nome} ${i.pasta} ${i.concluido_por ?? ""} ${i.destino_final ?? ""}`.toLowerCase().includes(q));
    const v = (i: Item): string | number =>
      ord.k === "nome" ? i.nome.toLowerCase() : ord.k === "pasta" ? i.pasta : ord.k === "concluido" ? (i.concluido_em ?? "") : parseBrt(i.modificado_brt) || i.ts_ftp * 1000;
    return [...l].sort((a, b) => (v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0) * (ord.desc ? -1 : 1));
  }, [itens, busca, ord]);

  const H = ({ k, children }: { k: Chave; children: string }) => (
    <TableHead>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setOrd((o) => ({ k, desc: o.k === k ? !o.desc : true }))}>
        {children} <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar arquivo, pasta, analista…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <H k="nome">Arquivo</H>
              <H k="pasta">Pasta</H>
              <H k="modificado">Modificado</H>
              <TableHead>Tamanho</TableHead>
              {historico ? (<><TableHead>Status</TableHead><TableHead>Destino</TableHead><H k="concluido">Concluído</H></>) : <TableHead>Alertas</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={historico ? 7 : 5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            ))}
            {!carregando && linhas.length === 0 && (
              <TableRow><TableCell colSpan={historico ? 7 : 5} className="py-10 text-center text-muted-foreground">Nenhum arquivo encontrado.</TableCell></TableRow>
            )}
            {linhas.map((i) => (
              <TableRow key={i.id} className="cursor-pointer" onClick={() => abrirItem(i.id)}>
                <TableCell className="max-w-72 truncate font-mono text-xs font-medium">{i.nome}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{i.pasta}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{i.modificado_brt}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtTamanho(i.tamanho)}</TableCell>
                {historico ? (
                  <>
                    <TableCell><StatusBadge s={i.status} /></TableCell>
                    <TableCell className="max-w-56 truncate font-mono text-xs">{i.destino_final ?? i.observacao ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{fmtData(i.concluido_em)}<div className="text-muted-foreground">{i.concluido_por}</div></TableCell>
                  </>
                ) : (
                  <TableCell><AlertasItem item={i} /></TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
