import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    professional_id: string;
    phone: string | null;
    email: string | null;
    default_unit_id: string | null;
    status: boolean | null;
  } | null;
}

export function DoctorForm({ open, onOpenChange, doctor }: DoctorFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    professional_id: "",
    phone: "",
    email: "",
    default_unit_id: "",
    status: true,
  });

  // Fetch units for the select
  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
        .eq("status", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Update form data when doctor prop changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || "",
        specialty: doctor.specialty || "",
        professional_id: doctor.professional_id || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        default_unit_id: doctor.default_unit_id || "",
        status: doctor.status ?? true,
      });
    } else {
      // Reset form for new doctor
      setFormData({
        name: "",
        specialty: "",
        professional_id: "",
        phone: "",
        email: "",
        default_unit_id: "",
        status: true,
      });
    }
  }, [doctor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        default_unit_id: formData.default_unit_id || null,
      };

      if (doctor?.id) {
        // Update existing doctor
        const { error } = await supabase
          .from("doctors")
          .update(dataToSave)
          .eq("id", doctor.id);

        if (error) throw error;
        toast.success("Médico atualizado com sucesso!");
      } else {
        // Create new doctor
        const { error } = await supabase.from("doctors").insert([dataToSave]);

        if (error) throw error;
        toast.success("Médico cadastrado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar médico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            {doctor ? "Editar Médico" : "Novo Médico"}
          </DialogTitle>
          <DialogDescription>
            {doctor
              ? "Atualize as informações do médico"
              : "Preencha os dados para cadastrar um novo médico"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Dr. João Silva"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade *</Label>
              <Input
                id="specialty"
                required
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Ex: Cardiologia"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="professional_id">Registro Profissional *</Label>
              <Input
                id="professional_id"
                required
                value={formData.professional_id}
                onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                placeholder="Ex: CRM 12345"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_unit">Unidade Padrão</Label>
              <Select
                value={formData.default_unit_id}
                onValueChange={(value) => setFormData({ ...formData, default_unit_id: value })}
              >
                <SelectTrigger className="rounded-lg border-border focus:ring-accent">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units && units.length > 0 ? (
                    units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma unidade cadastrada
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="medico@email.com"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
            />
            <Label htmlFor="status" className="cursor-pointer">
              Médico ativo
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
              {loading ? "Salvando..." : doctor ? "Atualizar" : "Cadastrar Médico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
