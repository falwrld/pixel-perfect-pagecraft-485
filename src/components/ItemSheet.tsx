import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Ban, CheckCheck, Loader2, Mail, OctagonAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, type Item } from "@/lib/api";
import { fmtData, fmtTamanho } from "@/lib/format";
import { useApp } from "@/lib/app-context";
import { AlertasItem, StatusBadge } from "./badges";
import { ConfirmDialog } from "./ConfirmDialog";

export function ItemSheet() {
  const { itemAberto, abrirItem } = useApp();
  const q = useQuery({
    queryKey: ["item", itemAberto],
    queryFn: () => api.item(itemAberto!),
    enabled: itemAberto != null,
  });
  return (
    <Sheet open={itemAberto != null} onOpenChange={(v) => !v && abrirItem(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {q.isLoading && (
          <div className="space-y-3 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {q.isError && (
          <div className="pt-8 text-sm text-destructive">Não foi possível carregar o arquivo: {(q.error as Error).message}</div>
        )}
        {q.data && <Detalhe key={q.data.id} item={q.data} />}
      </SheetContent>
    </Sheet>
  );
}

function Campo({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : "text-sm"}>{v}</dd>
    </div>
  );
}

function Detalhe({ item }: { item: Item }) {
  const { usuario, abrirItem, setPedirNome } = useApp();
  const qc = useQueryClient();
  const destinos = useQuery({ queryKey: ["destinos"], queryFn: api.destinos, staleTime: 300_000 });

  const sugPasta = item.sugestoes.filter((s) => s.tipo === "pasta" && s.destino);
  const sugEmail = item.sugestoes.find((s) => s.tipo === "email");
  const somenteEmail = !!sugEmail && sugPasta.length === 0;
  const semSugestao = item.sugestoes.length === 0;
  const pendente = item.status === "pendente";

  const [sel, setSel] = useState<string>(sugPasta.length === 1 && !sugPasta[0].bloqueante ? `s:0` : "");
  const [confirmar, setConfirmar] = useState(false);
  const [risco, setRisco] = useState(false);
  const [sobrescrever, setSobrescrever] = useState(false);
  const [acao, setAcao] = useState<null | "ignorar" | "manual">(null);
  const [texto, setTexto] = useState("");

  const outros = (destinos.data ?? []).filter((d) => !sugPasta.some((s) => s.destino === d));
  const escolha = useMemo(() => {
    if (sel.startsWith("s:")) {
      const s = sugPasta[+sel.slice(2)];
      return s ? { destino: s.destino!, sug: s } : null;
    }
    if (sel.startsWith("o:")) return { destino: sel.slice(2), sug: null };
    return null;
  }, [sel, sugPasta]);

  const arriscado = !!escolha && (!escolha.sug || escolha.sug.bloqueante);
  const avisosEnvio = escolha
    ? [
        ...(!escolha.sug ? ["Destino fora da sugestão do sistema."] : []),
        ...(escolha.sug ? escolha.sug.avisos : item.sugestoes.flatMap((s) => s.avisos)),
        ...item.avisos_gerais,
      ]
    : [];

  const atualizar = () => {
    qc.invalidateQueries({ queryKey: ["fila"] });
    qc.invalidateQueries({ queryKey: ["status"] });
    qc.invalidateQueries({ queryKey: ["eventos"] });
    qc.invalidateQueries({ queryKey: ["item", item.id] });
  };

  const despachar = useMutation({
    mutationFn: (sob: boolean) =>
      api.despachar(item.id, {
        destino: escolha!.destino,
        usuario,
        sobrescrever: sob,
        forcar: arriscado,
        destino_livre: !escolha!.sug,
      }),
    onSuccess: (r) => {
      setConfirmar(false);
      setSobrescrever(false);
      toast.success(`Enviado para ${r.destino_final ?? escolha?.destino}`);
      if (r.aviso) toast.warning(r.aviso, { duration: Infinity, closeButton: true });
      atualizar();
      abrirItem(null);
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.detail : (e as Error).message;
      if (e instanceof ApiError && e.status === 409 && msg.startsWith("Já existe")) {
        setConfirmar(false);
        setSobrescrever(true);
        return;
      }
      setSobrescrever(false);
      toast.error(msg);
      atualizar();
    },
  });

  const concluir = useMutation({
    mutationFn: ({ tipo, t }: { tipo: "ignorar" | "manual"; t: string }) =>
      tipo === "ignorar" ? api.ignorar(item.id, usuario, t) : api.manual(item.id, usuario, t),
    onSuccess: (r) => {
      toast.success(r.status === "ignorado" ? "Arquivo ignorado" : "Marcado como tratado manualmente");
      setAcao(null);
      atualizar();
      abrirItem(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.detail : (e as Error).message),
  });

  const ocupado = despachar.isPending || concluir.isPending;
  const exigirNome = () => {
    if (!usuario) { setPedirNome(true); return true; }
    return false;
  };
  const todosAvisos = [...item.avisos_gerais, ...item.sugestoes.flatMap((s) => s.avisos)];

  useEffect(() => { setRisco(false); }, [sel]);

  return (
    <>
      <SheetHeader className="pr-6">
        <SheetTitle className="break-all font-mono text-base text-heading">{item.nome}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge s={item.status} />
            <AlertasItem item={item} />
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-5">
        <dl className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3">
          <Campo k="Pasta de origem" v={item.pasta} mono />
          <Campo k="ID" v={item.id} mono />
          <Campo k="Modificado (BRT)" v={item.modificado_brt} />
          <Campo k="Detectado em" v={fmtData(item.detectado_em)} />
          <Campo k="Tamanho" v={fmtTamanho(item.tamanho)} />
          {item.destino_final && <Campo k="Destino final" v={item.destino_final} mono />}
          {item.concluido_por && <Campo k="Concluído por" v={`${item.concluido_por} · ${fmtData(item.concluido_em)}`} />}
          {item.observacao && <Campo k="Observação" v={item.observacao} />}
        </dl>

        {item.ultimo_erro && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Última tentativa falhou:</strong> {item.ultimo_erro}
          </div>
        )}

        {todosAvisos.length > 0 && (
          <ul className="space-y-1.5">
            {todosAvisos.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange" /> {a}
              </li>
            ))}
          </ul>
        )}

        {pendente && semSugestao && (
          <div className="flex gap-3 rounded-md border-2 border-destructive bg-destructive/10 p-4 text-sm font-semibold text-destructive">
            <OctagonAlert className="size-6 shrink-0" />
            Este arquivo não bate com a relação. Não envie sem confirmar com a entidade.
          </div>
        )}

        {pendente && (
          <section className="space-y-3 rounded-md border p-3">
            <h3 className="text-sm font-semibold">Ação</h3>
            {somenteEmail ? (
              <Button className="w-full" disabled={ocupado} onClick={() => { if (!exigirNome()) { setTexto(""); setAcao("manual"); } }}>
                <Mail /> Marcar como tratado por e-mail
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="destino">Selecione o destino</Label>
                  <Select value={sel} onValueChange={setSel} disabled={ocupado}>
                    <SelectTrigger id="destino" className="h-auto min-h-9 text-left">
                      <SelectValue placeholder="Escolha a pasta do SFTP…" />
                    </SelectTrigger>
                    <SelectContent>
                      {sugPasta.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Sugestões</SelectLabel>
                          {sugPasta.map((s, i) => (
                            <SelectItem key={i} value={`s:${i}`}>
                              <span className="font-medium">{s.regra}</span>
                              <span className="ml-2 font-mono text-xs text-muted-foreground">{s.destino}</span>
                              {s.bloqueante && <span className="ml-2 text-xs text-destructive">(bloqueante)</span>}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {sugPasta.length > 0 && outros.length > 0 && <SelectSeparator />}
                      {outros.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Outros destinos (fora da sugestão)</SelectLabel>
                          {outros.map((d) => (
                            <SelectItem key={d} value={`o:${d}`}><span className="font-mono text-xs">{d}</span></SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={!escolha || ocupado} onClick={() => { if (!exigirNome()) setConfirmar(true); }}>
                  {despachar.isPending ? <Loader2 className="animate-spin" /> : <Send />} Enviar para o SFTP
                </Button>
              </>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" disabled={ocupado} onClick={() => { if (!exigirNome()) { setTexto(""); setAcao("ignorar"); } }}>
                <Ban /> Ignorar
              </Button>
              {!somenteEmail && (
                <Button variant="outline" size="sm" disabled={ocupado} onClick={() => { if (!exigirNome()) { setTexto(""); setAcao("manual"); } }}>
                  <CheckCheck /> Tratado manualmente
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      {escolha && (
        <ConfirmDialog
          open={confirmar}
          onOpenChange={setConfirmar}
          danger={arriscado}
          title={arriscado ? "Envio fora da sugestão" : "Confirmar envio"}
          confirmLabel={arriscado ? "Enviar mesmo assim" : "Enviar"}
          loading={despachar.isPending}
          disabled={arriscado && !risco}
          onConfirm={() => despachar.mutate(false)}
          description={<span className="break-all font-mono text-xs">{item.nome}</span>}
        >
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-xs">
            <span className="break-all">{item.pasta}</span>
            <ArrowRight className="size-4 shrink-0 text-primary" />
            <span className="break-all font-semibold">{escolha.destino}</span>
          </div>
          {arriscado && (
            <>
              <ul className="space-y-1">
                {avisosEnvio.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{a}</li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={risco} onCheckedChange={(v) => setRisco(v === true)} />
                Entendo o risco e quero enviar mesmo assim
              </label>
            </>
          )}
          {despachar.isPending && <p className="text-xs text-muted-foreground">Enviando… isso pode levar alguns segundos.</p>}
        </ConfirmDialog>
      )}

      <ConfirmDialog
        open={sobrescrever}
        onOpenChange={setSobrescrever}
        danger
        title="Arquivo já existe"
        description="Já existe um arquivo com este nome no destino. Substituir?"
        confirmLabel="Substituir"
        loading={despachar.isPending}
        onConfirm={() => despachar.mutate(true)}
      />

      <ConfirmDialog
        open={acao != null}
        onOpenChange={(v) => !v && setAcao(null)}
        title={acao === "ignorar" ? "Ignorar arquivo" : somenteEmail ? "Tratado por e-mail" : "Marcar como tratado manualmente"}
        confirmLabel="Confirmar"
        loading={concluir.isPending}
        disabled={acao === "ignorar" && !texto.trim()}
        onConfirm={() => acao && concluir.mutate({ tipo: acao, t: texto.trim() })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="acao-texto">{acao === "ignorar" ? "Motivo (obrigatório)" : "Observação"}</Label>
          <Textarea id="acao-texto" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
        </div>
      </ConfirmDialog>
    </>
  );
}
