import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AtrasoStatus, Diagnostico, Item, ItemStatus } from "@/lib/api";

export const tagVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none",
  {
    variants: {
      tone: {
        success: "bg-success/15 text-success border border-success/30",
        warning: "bg-warning/25 text-warning-foreground border border-warning/50 dark:text-warning",
        orange: "bg-orange/15 text-orange border border-orange/40",
        danger: "bg-destructive/12 text-destructive border border-destructive/35",
        info: "bg-info/12 text-info border border-info/35",
        muted: "bg-muted text-muted-foreground border border-border",
        primary: "bg-primary/15 text-primary border border-primary/35",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);
export type Tone = "success" | "warning" | "orange" | "danger" | "info" | "muted" | "primary";

export function Tag({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn(tagVariants({ tone }), className)}>{children}</span>;
}

export const DIAG: Record<Diagnostico, { label: string; tone: Tone }> = {
  ok: { label: "Na relação", tone: "success" },
  origem_diferente: { label: "Origem diferente", tone: "orange" },
  nomenclatura_suspeita: { label: "Nomenclatura suspeita", tone: "danger" },
  nao_consta: { label: "Fora da relação", tone: "muted" },
};

export function DiagnosticoBadge({ d }: { d: Diagnostico }) {
  return <Tag tone={DIAG[d].tone}>{DIAG[d].label}</Tag>;
}

export function AlertasItem({ item }: { item: Item }) {
  const foraPeriodo = item.sugestoes.some((s) => s.periodo_ok === false);
  return (
    <div className="flex flex-wrap gap-1">
      <DiagnosticoBadge d={item.diagnostico} />
      {foraPeriodo && <Tag tone="warning">Fora do período</Tag>}
      {item.ultimo_erro && <Tag tone="danger">Falhou</Tag>}
    </div>
  );
}

const ST: Record<ItemStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Pendente", tone: "info" },
  enviando: { label: "Enviando", tone: "warning" },
  enviado: { label: "Enviado", tone: "success" },
  ignorado: { label: "Ignorado", tone: "muted" },
  manual: { label: "Manual", tone: "primary" },
};
export function StatusBadge({ s }: { s: ItemStatus }) {
  return <Tag tone={ST[s].tone}>{ST[s].label}</Tag>;
}

export const ATRASO: Record<AtrasoStatus, { label: string; tone: Tone; bar: string; ordem: number }> = {
  atrasado: { label: "Atrasado", tone: "danger", bar: "bg-destructive", ordem: 0 },
  corte_proximo: { label: "Corte próximo", tone: "warning", bar: "bg-warning", ordem: 1 },
  aguardando: { label: "Aguardando", tone: "info", bar: "bg-info", ordem: 2 },
  completo: { label: "Completo", tone: "success", bar: "bg-success", ordem: 3 },
  fora_da_janela: { label: "Fora da janela", tone: "muted", bar: "bg-muted-foreground", ordem: 4 },
};
