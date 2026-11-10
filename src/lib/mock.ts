import { ApiError, type Atraso, type DespacharBody, type Evento, type Item, type ItemStatus, type Status } from "./api";

const DESTINOS = [
  "/SPPREV/Entrada/Folha/ALESP",
  "/SPPREV/Entrada/Folha/TJSP",
  "/SPPREV/Entrada/Folha/USP",
  "/SPPREV/Entrada/Folha/UNICAMP",
  "/SPPREV/Entrada/Contribuicoes/MPSP",
  "/SPPREV/Entrada/Contribuicoes/DPE",
  "/SPPREV/Entrada/Cadastro/TCE",
  "/SPPREV/Entrada/Diversos",
];

function mkItem(p: Partial<Item> & Pick<Item, "id" | "nome" | "pasta">, minutosAtras: number): Item {
  const d = new Date(Date.now() - minutosAtras * 60000);
  const brt = d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", "");
  return {
    ts_ftp: Math.floor(d.getTime() / 1000),
    tamanho: 120_000,
    modificado_brt: brt,
    detectado_em: d.toISOString(),
    status: "pendente",
    na_relacao: true,
    diagnostico: "ok",
    sugestoes: [],
    avisos_gerais: [],
    destino_final: null,
    concluido_em: null,
    concluido_por: null,
    observacao: "",
    ultimo_erro: null,
    ...p,
  };
}

function criar() {
  let nextId = 1050;
  const itens: Item[] = [
    mkItem({ id: 1041, nome: "FOLHA_ALESP_202611.txt", pasta: "/ALESP/out", tamanho: 2_458_112,
      sugestoes: [{ regra: "Folha ALESP", grupo: "Legislativo", tipo: "pasta", destino: DESTINOS[0]!, origem_ok: true, periodo_ok: true, bloqueante: false, avisos: [] }] }, 4),
    mkItem({ id: 1042, nome: "TJSP_FOLHA_11_2026.zip", pasta: "/TJSP/remessa", tamanho: 15_872_000,
      sugestoes: [{ regra: "Folha TJSP", grupo: "Judiciário", tipo: "pasta", destino: DESTINOS[1]!, origem_ok: true, periodo_ok: false, bloqueante: false, avisos: ["Arquivo recebido fora da janela (dias 02 a 08)."] }] }, 22),
    mkItem({ id: 1043, nome: "USP_CONTRIB_202611.csv", pasta: "/UNICAMP/out", tamanho: 845_000, diagnostico: "origem_diferente",
      sugestoes: [{ regra: "Contribuições USP", grupo: "Universidades", tipo: "pasta", destino: DESTINOS[2]!, origem_ok: false, periodo_ok: true, bloqueante: true, avisos: ["Origem esperada: /USP/out — recebido em /UNICAMP/out."] }] }, 48),
    mkItem({ id: 1044, nome: "arquivo_final_v2 (1).txt", pasta: "/MPSP/out", tamanho: 12_400, diagnostico: "nomenclatura_suspeita", na_relacao: false,
      avisos_gerais: ["Nome fora do padrão esperado pela entidade."] }, 75),
    mkItem({ id: 1045, nome: "RELATORIO_XPTO_2026.pdf", pasta: "/DIVERSOS", tamanho: 310_000, diagnostico: "nao_consta", na_relacao: false,
      avisos_gerais: ["Arquivo não consta na relação de entregas."] }, 130),
    mkItem({ id: 1046, nome: "IAMSPE_CONTRIB_202611.xlsx", pasta: "/IAMSPE/out", tamanho: 98_000,
      sugestoes: [{ regra: "IAMSPE (e-mail)", grupo: "Saúde", tipo: "email", destino: null, origem_ok: true, periodo_ok: true, bloqueante: false, avisos: ["Este arquivo deve ser encaminhado por e-mail."] }] }, 200),
    mkItem({ id: 1047, nome: "DPE_FOLHA_202611.txt", pasta: "/DPE/out", tamanho: 640_000, ultimo_erro: "Timeout na conexão SFTP (30s)",
      sugestoes: [{ regra: "Folha DPE", grupo: "Defensoria", tipo: "pasta", destino: DESTINOS[5]!, origem_ok: true, periodo_ok: true, bloqueante: false, avisos: [] }] }, 310),
    mkItem({ id: 1030, nome: "TCE_CADASTRO_202610.txt", pasta: "/TCE/out", status: "enviado", destino_final: DESTINOS[6]!, concluido_por: "Maria Souza",
      concluido_em: new Date(Date.now() - 86400000).toISOString(), observacao: "" }, 1500),
    mkItem({ id: 1031, nome: "teste.txt", pasta: "/ALESP/out", status: "ignorado", diagnostico: "nao_consta", concluido_por: "João Lima",
      concluido_em: new Date(Date.now() - 2 * 86400000).toISOString(), observacao: "Arquivo de teste da entidade" }, 3000),
    mkItem({ id: 1032, nome: "IAMSPE_CONTRIB_202610.xlsx", pasta: "/IAMSPE/out", status: "manual", concluido_por: "Maria Souza",
      concluido_em: new Date(Date.now() - 5 * 86400000).toISOString(), observacao: "Encaminhado por e-mail em 05/10" }, 8000),
  ];
  const eventos: Evento[] = [
    { id: 9, quando: new Date(Date.now() - 86400000).toISOString(), item_id: 1030, usuario: "Maria Souza", acao: "ENVIADO", detalhe: `→ ${DESTINOS[6]!} (FORÇADO)` },
    { id: 8, quando: new Date(Date.now() - 2 * 86400000).toISOString(), item_id: 1031, usuario: "João Lima", acao: "IGNORADO", detalhe: "Arquivo de teste da entidade" },
    { id: 7, quando: new Date(Date.now() - 3 * 86400000).toISOString(), item_id: 1047, usuario: "João Lima", acao: "FALHA", detalhe: "Timeout na conexão SFTP (30s)" },
    { id: 6, quando: new Date(Date.now() - 4 * 86400000).toISOString(), item_id: 1029, usuario: "Maria Souza", acao: "ENVIADO", detalhe: `→ ${DESTINOS[0]!} SOBRESCREVEU` },
    { id: 5, quando: new Date(Date.now() - 5 * 86400000).toISOString(), item_id: 1032, usuario: "Maria Souza", acao: "MANUAL", detalhe: "Encaminhado por e-mail" },
    { id: 4, quando: new Date(Date.now() - 5 * 3600000).toISOString(), item_id: 1047, usuario: "monitor", acao: "DETECTADO", detalhe: "/DPE/out" },
  ];
  const atrasos: Atraso[] = [
    { regra: "Folha ALESP", grupo: "Legislativo", janela: "02 a 11", esperados: 1, recebidos: 1, status: "completo" },
    { regra: "Folha TJSP", grupo: "Judiciário", janela: "02 a 08", esperados: 2, recebidos: 1, status: "atrasado" },
    { regra: "Contribuições MPSP", grupo: "Judiciário", janela: "05 a 11", esperados: 1, recebidos: 0, status: "corte_proximo" },
    { regra: "Contribuições USP", grupo: "Universidades", janela: "08 a 15", esperados: 3, recebidos: 1, status: "aguardando" },
    { regra: "Folha UNICAMP", grupo: "Universidades", janela: "08 a 15", esperados: 1, recebidos: 0, status: "aguardando" },
    { regra: "Cadastro TCE", grupo: "Controle", janela: "20 a 25", esperados: 1, recebidos: 0, status: "fora_da_janela" },
    { regra: "Folha DPE", grupo: "Defensoria", janela: "02 a 09", esperados: 1, recebidos: 0, status: "atrasado" },
  ];
  const conflitos = new Set<string>([`${DESTINOS[0]!}/FOLHA_ALESP_202611.txt`]);

  const get = (id: number) => {
    const it = itens.find((i) => i.id === id);
    if (!it) throw new ApiError(404, "Item não encontrado");
    return it;
  };
  const log = (item_id: number, usuario: string, acao: string, detalhe: string) =>
    eventos.unshift({ id: ++nextId, quando: new Date().toISOString(), item_id, usuario, acao, detalhe });

  return {
    destinos: DESTINOS,
    atrasos,
    eventos,
    status(): Status {
      const fila: Status["fila"] = {};
      for (const i of itens) fila[i.status] = (fila[i.status] ?? 0) + 1;
      return {
        rodando: true, ciclos: 412, ultima_varredura: new Date(Date.now() - 70000).toISOString(),
        ultimo_erro_geral: null, pastas_com_erro: { "/UNESP/out": "Permissão negada (550)" },
        novos_ultimo_ciclo: 0, fila, agora: new Date().toISOString(),
      };
    },
    fila(status: ItemStatus | "todos") {
      return structuredClone(status === "todos" ? itens : itens.filter((i) => i.status === status));
    },
    item: (id: number) => structuredClone(get(id)),
    despachar(id: number, b: DespacharBody): Item {
      const it = get(id);
      const chave = `${b.destino}/${it.nome}`;
      if (conflitos.has(chave) && !b.sobrescrever) throw new ApiError(409, "Já existe um arquivo com este nome no destino.");
      const sug = it.sugestoes.find((s) => s.destino === b.destino);
      if ((!sug || sug.bloqueante) && !b.forcar) throw new ApiError(400, "Destino fora da sugestão: é necessário forçar.");
      Object.assign(it, { status: "enviado", destino_final: b.destino, concluido_por: b.usuario, concluido_em: new Date().toISOString(), ultimo_erro: null });
      log(id, b.usuario, "ENVIADO", `→ ${b.destino}${b.forcar ? " (FORÇADO)" : ""}${b.sobrescrever ? " SOBRESCREVEU" : ""}`);
      const r: Item = structuredClone(it);
      if (new Date().getHours() >= 21) r.aviso = "Enviado após 22h: o processamento ocorrerá apenas no próximo dia útil.";
      return r;
    },
    concluir(id: number, status: "ignorado" | "manual", usuario: string, texto: string): Item {
      const it = get(id);
      Object.assign(it, { status, observacao: texto, concluido_por: usuario, concluido_em: new Date().toISOString() });
      log(id, usuario, status === "ignorado" ? "IGNORADO" : "MANUAL", texto);
      return structuredClone(it);
    },
  };
}

let state: ReturnType<typeof criar> | null = null;
export function getMock() {
  if (!state) state = criar();
  return state;
}
