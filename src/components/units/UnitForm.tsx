import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    phone: string | null;
    cnpj: string | null;
    status: boolean | null;
  } | null;
}

export function UnitForm({ open, onOpenChange, unit }: UnitFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: unit?.name || "",
    address: unit?.address || "",
    city: unit?.city || "",
    state: unit?.state || "",
    zip_code: unit?.zip_code || "",
    phone: unit?.phone || "",
    cnpj: unit?.cnpj || "",
    status: unit?.status ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (unit?.id) {
        // Update existing unit
        const { error } = await supabase
          .from("units")
          .update(formData)
          .eq("id", unit.id);

        if (error) throw error;
        toast.success("Unidade atualizada com sucesso!");
      } else {
        // Create new unit
        const { error } = await supabase.from("units").insert([formData]);

        if (error) throw error;
        toast.success("Unidade criada com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["units"] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar unidade");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      phone: "",
      cnpj: "",
      status: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            {unit ? "Editar Unidade" : "Nova Unidade"}
          </DialogTitle>
          <DialogDescription>
            {unit
              ? "Atualize as informações da unidade"
              : "Preencha os dados para cadastrar uma nova unidade"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Unidade *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Clínica Centro"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, complemento"
              className="rounded-lg border-border focus-visible:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: São Paulo"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Ex: SP"
                maxLength={2}
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="00000-000"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 0000-0000"
              className="rounded-lg border-border focus-visible:ring-accent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
            />
            <Label htmlFor="status" className="cursor-pointer">
              Unidade ativa
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-border hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
            >
              {loading ? "Salvando..." : unit ? "Atualizar" : "Criar Unidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
