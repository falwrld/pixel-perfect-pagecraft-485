import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/app-context";

export function NomeAnalistaDialog() {
  const { usuario, setUsuario, pedirNome, setPedirNome } = useApp();
  const [nome, setNome] = useState("");
  useEffect(() => { if (pedirNome) setNome(usuario); }, [pedirNome, usuario]);
  const obrigatorio = !usuario;
  const salvar = () => { if (nome.trim()) { setUsuario(nome.trim()); setPedirNome(false); } };

  return (
    <Dialog open={pedirNome} onOpenChange={(v) => !obrigatorio && setPedirNome(v)}>
      <DialogContent onInteractOutside={(e) => obrigatorio && e.preventDefault()} onEscapeKeyDown={(e) => obrigatorio && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Nome do analista</DialogTitle>
          <DialogDescription>Seu nome fica registrado em todas as ações (envios, ignorados, tratados).</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); salvar(); }} className="space-y-2">
          <Label htmlFor="nome-analista">Nome</Label>
          <Input id="nome-analista" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Souza" />
        </form>
        <DialogFooter>
          <Button onClick={salvar} disabled={!nome.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
