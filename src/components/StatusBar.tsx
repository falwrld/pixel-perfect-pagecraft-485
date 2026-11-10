import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Inbox, Moon, Sun, UserRound, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { minutosDesde } from "@/lib/format";
import { useApp } from "@/lib/app-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const { usuario, setPedirNome, escuro, toggleEscuro } = useApp();
  const status = useQuery({ queryKey: ["status"], queryFn: api.status, refetchInterval: 10_000, retry: 1 });
  const pend = useQuery({ queryKey: ["fila", "pendente"], queryFn: () => api.fila("pendente"), refetchInterval: 10_000 });
  const vistos = useRef<Set<number> | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pend.data) return;
    const ids = new Set(pend.data.map((i) => i.id));
    if (vistos.current) {
      const novos = [...ids].filter((id) => !vistos.current!.has(id)).length;
      if (novos > 0) toast.info(`${novos} novo(s) arquivo(s)`);
    }
    vistos.current = ids;
  }, [pend.data]);

  const s = status.data;
  const semConexao = status.isError;
  const min = minutosDesde(s?.ultima_varredura ?? null, agora);
  const corVarredura = min == null ? "text-muted-foreground" : min > 10 ? "text-destructive" : min > 3 ? "text-warning-foreground dark:text-warning" : "text-muted-foreground";
  const erros = Object.entries(s?.pastas_com_erro ?? {});

  return (
    <div className="sticky top-0 z-20 border-b bg-card">
      {semConexao && (
        <div role="alert" className="flex items-center gap-2 bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground">
          <WifiOff className="size-4" /> Sem conexão com o servidor
        </div>
      )}
      <header className="flex h-12 items-center gap-3 px-3 text-sm">
        <SidebarTrigger />
        {s && (
          <>
            <span className="flex items-center gap-1.5 font-medium">
              <span className={cn("size-2.5 rounded-full", s.rodando ? "bg-success" : "bg-destructive")} aria-hidden />
              {s.rodando ? "Monitor ativo" : "Parado"}
            </span>
            <span className={cn("hidden items-center gap-1 sm:flex", corVarredura)}>
              <Clock className="size-3.5" />
              {min == null ? "Sem varredura" : `Última varredura há ${min} min`}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Inbox className="size-3.5" />
              <strong className="text-foreground">{s.fila.pendente ?? 0}</strong> pendentes
            </span>
            {erros.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive hover:text-destructive">
                    <AlertTriangle className="size-4" /> {erros.length} pasta(s) com erro
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm">
                  <ul className="space-y-2">
                    {erros.map(([p, e]) => (
                      <li key={p}>
                        <div className="font-mono text-xs font-semibold">{p}</div>
                        <div className="text-destructive">{e}</div>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setPedirNome(true)} title="Trocar analista">
            <UserRound className="size-4" />
            <span className="max-w-40 truncate">{usuario || "Definir analista"}</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleEscuro} aria-label={escuro ? "Tema claro" : "Tema escuro"}>
            {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>
    </div>
  );
}
