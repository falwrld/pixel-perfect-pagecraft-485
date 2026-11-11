import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AppShell";
import { ATRASO, Tag } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/atrasos")({
  head: () => ({ meta: [{ title: "Atrasos — Monitor FTP → SFTP" }, { name: "description", content: "Entregas esperadas por regra e janela, com atrasos em destaque." }, { property: "og:title", content: "Atrasos — Monitor FTP → SFTP" }, { property: "og:description", content: "Entregas esperadas por regra e janela, com atrasos em destaque." }] }),
  component: Atrasos,
});

function Atrasos() {
  const q = useQuery({ queryKey: ["atrasos"], queryFn: api.atrasos, refetchInterval: 60_000 });
  const lista = [...(q.data ?? [])].sort((a, b) => ATRASO[a.status].ordem - ATRASO[b.status].ordem || a.regra.localeCompare(b.regra));
  return (
    <>
      <PageHeader title="Atrasos" subtitle="Recebidos × esperados em cada janela de entrega." />
      {q.isLoading && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>}
      {!q.isLoading && lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra com janela configurada.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((a) => {
          const m = ATRASO[a.status];
          const pct = a.esperados ? Math.min(100, (a.recebidos / a.esperados) * 100) : 0;
          return (
            <div key={a.regra} className="rounded-md border bg-card p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.regra}</div>
                  <div className="text-xs text-muted-foreground">{a.grupo} · janela {a.janela}</div>
                </div>
                <Tag tone={m.tone}>{m.label}</Tag>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className="h-2 flex-1 overflow-hidden rounded bg-muted"><div className={cn("h-full", m.bar)} style={{ width: `${pct}%` }} /></div>
                <span className="tabular-nums"><strong>{a.recebidos}</strong>/{a.esperados}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
