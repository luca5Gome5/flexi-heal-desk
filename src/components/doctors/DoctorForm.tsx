import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

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

  // Fetch doctor units if editing
  const { data: doctorUnits } = useQuery({
    queryKey: ["doctor-units", doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      const { data, error } = await supabase
        .from("doctor_units")
        .select("unit_id")
        .eq("doctor_id", doctor.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!doctor?.id && open,
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
      setSelectedUnits([]);
    }
  }, [doctor, open]);

  // Update selected units when doctor units are loaded
  useEffect(() => {
    if (doctorUnits) {
      setSelectedUnits(doctorUnits.map((du) => du.unit_id));
    }
  }, [doctorUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        default_unit_id: formData.default_unit_id || null,
      };

      let doctorId = doctor?.id;

      if (doctor?.id) {
        // Update existing doctor
        const { error } = await supabase
          .from("doctors")
          .update(dataToSave)
          .eq("id", doctor.id);

        if (error) throw error;
      } else {
        // Create new doctor
        const { data: newDoctor, error } = await supabase
          .from("doctors")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        doctorId = newDoctor.id;
      }

      // Update doctor-units relationship
      if (doctorId) {
        // Delete existing relationships
        await supabase.from("doctor_units").delete().eq("doctor_id", doctorId);

        // Insert new relationships
        if (selectedUnits.length > 0) {
          const doctorUnitsData = selectedUnits.map((unitId) => ({
            doctor_id: doctorId,
            unit_id: unitId,
          }));

          const { error: unitsError } = await supabase
            .from("doctor_units")
            .insert(doctorUnitsData);

          if (unitsError) throw unitsError;
        }
      }

      toast.success(doctor ? "Médico atualizado com sucesso!" : "Médico cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-units"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar médico");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
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

          <div className="space-y-3">
            <Label>Unidades de Atendimento *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-border bg-secondary/30 max-h-[200px] overflow-y-auto">
              {units && units.length > 0 ? (
                units.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit.id}`}
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => handleUnitToggle(unit.id)}
                      className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />
                    <Label
                      htmlFor={`unit-${unit.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {unit.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm text-muted-foreground text-center py-2">
                  Nenhuma unidade cadastrada
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione todas as unidades onde o médico atende
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_unit">Unidade Padrão</Label>
            <Select
              value={formData.default_unit_id}
              onValueChange={(value) => setFormData({ ...formData, default_unit_id: value })}
            >
              <SelectTrigger className="rounded-lg border-border focus:ring-accent">
                <SelectValue placeholder="Selecione a unidade principal" />
              </SelectTrigger>
              <SelectContent>
                {selectedUnits.length > 0 ? (
                  units
                    ?.filter((unit) => selectedUnits.includes(unit.id))
                    .map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Selecione as unidades primeiro
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Unidade principal de atendimento (deve estar selecionada acima)
            </p>
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
