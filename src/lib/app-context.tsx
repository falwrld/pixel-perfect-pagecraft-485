import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface AppCtx {
  usuario: string;
  setUsuario: (n: string) => void;
  pedirNome: boolean;
  setPedirNome: (v: boolean) => void;
  itemAberto: number | null;
  abrirItem: (id: number | null) => void;
  escuro: boolean;
  toggleEscuro: () => void;
}

const Ctx = createContext<AppCtx | null>(null);
const KEY_NOME = "monitor.analista";
const KEY_TEMA = "monitor.tema";

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setU] = useState("");
  const [pedirNome, setPedirNome] = useState(false);
  const [itemAberto, abrirItem] = useState<number | null>(null);
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem(KEY_NOME);
    if (n) setU(n);
    else setPedirNome(true);
    setEscuro(localStorage.getItem(KEY_TEMA) === "escuro");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", escuro);
  }, [escuro]);

  const setUsuario = useCallback((n: string) => {
    localStorage.setItem(KEY_NOME, n);
    setU(n);
  }, []);
  const toggleEscuro = useCallback(() => {
    setEscuro((e) => {
      localStorage.setItem(KEY_TEMA, e ? "claro" : "escuro");
      return !e;
    });
  }, []);

  return (
    <Ctx.Provider value={{ usuario, setUsuario, pedirNome, setPedirNome, itemAberto, abrirItem, escuro, toggleEscuro }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
}
