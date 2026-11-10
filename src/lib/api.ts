// Camada única de acesso à API REST do Monitor FTP → SFTP.
// Para trocar a autenticação (ex.: SSO), altere apenas `authHeaders()`.

export type ItemStatus = "pendente" | "enviando" | "enviado" | "ignorado" | "manual";
export type Diagnostico = "ok" | "origem_diferente" | "nomenclatura_suspeita" | "nao_consta";

export interface Sugestao {
  regra: string;
  grupo: string;
  tipo: "pasta" | "email";
  destino: string | null;
  origem_ok: boolean;
  periodo_ok: boolean | null;
  bloqueante: boolean;
  avisos: string[];
}

export interface Item {
  id: number;
  pasta: string;
  nome: string;
  ts_ftp: number;
  tamanho: number;
  modificado_brt: string;
  detectado_em: string;
  status: ItemStatus;
  na_relacao: boolean;
  diagnostico: Diagnostico;
  sugestoes: Sugestao[];
  avisos_gerais: string[];
  destino_final: string | null;
  concluido_em: string | null;
  concluido_por: string | null;
  observacao: string;
  ultimo_erro: string | null;
  aviso?: string;
}

export interface Status {
  rodando: boolean;
  ciclos: number;
  ultima_varredura: string | null;
  ultimo_erro_geral: string | null;
  pastas_com_erro: Record<string, string>;
  novos_ultimo_ciclo: number;
  fila: Partial<Record<ItemStatus, number>>;
  agora: string;
}

export type AtrasoStatus = "completo" | "aguardando" | "corte_proximo" | "atrasado" | "fora_da_janela";
export interface Atraso {
  regra: string;
  grupo: string;
  janela: string;
  esperados: number;
  recebidos: number;
  status: AtrasoStatus;
}

export interface Evento {
  id: number;
  quando: string;
  item_id: number | null;
  usuario: string;
  acao: string;
  detalhe: string;
}

export interface DespacharBody {
  destino: string;
  usuario: string;
  sobrescrever?: boolean;
  forcar?: boolean;
  destino_livre?: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
  }
}

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
export const MODO_DEMO = !BASE;

function authHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_API_TOKEN as string | undefined;
  return token ? { "X-API-Key": token } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor");
  }
  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const j = await res.json();
      if (j?.detail) detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

// ---------------- MOCK (modo demonstração) ----------------
import { getMock } from "./mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const api = {
  status: async (): Promise<Status> => (MODO_DEMO ? (await delay(150), getMock().status()) : request("/status")),
  fila: async (status: ItemStatus | "todos" = "pendente", limite = 500, offset = 0): Promise<Item[]> =>
    MODO_DEMO
      ? (await delay(250), getMock().fila(status))
      : request(`/fila?status=${status}&limite=${limite}&offset=${offset}`),
  item: async (id: number): Promise<Item> => (MODO_DEMO ? (await delay(100), getMock().item(id)) : request(`/fila/${id}`)),
  despachar: async (id: number, body: DespacharBody): Promise<Item> =>
    MODO_DEMO ? (await delay(1500), getMock().despachar(id, body)) : post(`/fila/${id}/despachar`, body),
  ignorar: async (id: number, usuario: string, texto: string): Promise<Item> =>
    MODO_DEMO ? (await delay(400), getMock().concluir(id, "ignorado", usuario, texto)) : post(`/fila/${id}/ignorar`, { usuario, texto }),
  manual: async (id: number, usuario: string, texto: string): Promise<Item> =>
    MODO_DEMO ? (await delay(400), getMock().concluir(id, "manual", usuario, texto)) : post(`/fila/${id}/manual`, { usuario, texto }),
  destinos: async (): Promise<string[]> => (MODO_DEMO ? getMock().destinos : request("/destinos")),
  atrasos: async (): Promise<Atraso[]> => (MODO_DEMO ? (await delay(200), getMock().atrasos) : request("/atrasos")),
  eventos: async (limite = 200): Promise<Evento[]> =>
    MODO_DEMO ? (await delay(200), getMock().eventos.slice(0, limite)) : request(`/eventos?limite=${limite}`),
  exportarXlsx: async (): Promise<void> => {
    if (MODO_DEMO) throw new ApiError(0, "Exportação indisponível no modo demonstração");
    let res: Response;
    try {
      res = await fetch(`${BASE}/api/exportar.xlsx`, { headers: authHeaders() });
    } catch {
      throw new ApiError(0, "Sem conexão com o servidor");
    }
    if (!res.ok) throw new ApiError(res.status, `Erro ${res.status} ao exportar`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico_ftp.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
};
