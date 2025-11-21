import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExamRequirementsManager, ExamRequirement } from "./ExamRequirementsManager";

interface ProcedureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: {
    id: string;
    name: string;
    description: string | null;
    required_exams: string[] | null;
    exam_requirements: ExamRequirement[] | null;
    duration_minutes: number | null;
    duration_unit: string | null;
    status: boolean | null;
    pricing_type: string | null;
    price_cash: number | null;
    price_card: number | null;
    max_installments: number | null;
  } | null;
}

export function ProcedureForm({ open, onOpenChange, procedure }: ProcedureFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    duration_unit: "minutes",
    status: true,
  });
  const [examRequirements, setExamRequirements] = useState<ExamRequirement[]>([]);

  // Update form data when procedure prop changes
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name || "",
        description: procedure.description || "",
        duration_minutes: procedure.duration_minutes || 60,
        duration_unit: procedure.duration_unit || "minutes",
        status: procedure.status ?? true,
      });
      setExamRequirements(procedure.exam_requirements || []);
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        duration_unit: "minutes",
        status: true,
      });
      setExamRequirements([]);
    }
  }, [procedure, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        duration_unit: formData.duration_unit,
        status: formData.status,
        exam_requirements: examRequirements.length > 0 ? (examRequirements as any) : [],
      };

      if (procedure?.id) {
        const { error } = await supabase
          .from("procedures")
          .update(dataToSave)
          .eq("id", procedure.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("procedures")
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast.success(
        procedure ? "Procedimento atualizado com sucesso!" : "Procedimento cadastrado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar procedimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            {procedure ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
          <DialogDescription>
            {procedure
              ? "Atualize as informações do procedimento"
              : "Preencha os dados para cadastrar um novo procedimento"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Procedimento *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cirurgia Cardíaca"
              className="rounded-lg border-border focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o procedimento..."
              rows={3}
              className="rounded-lg border-border focus-visible:ring-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 1 })
                }
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_unit">Unidade</Label>
              <Select
                value={formData.duration_unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration_unit: value })
                }
              >
                <SelectTrigger className="rounded-lg border-border focus-visible:ring-accent">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ExamRequirementsManager
            requirements={examRequirements}
            onChange={setExamRequirements}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
            />
            <Label htmlFor="status" className="cursor-pointer">
              Procedimento ativo
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
              {loading ? "Salvando..." : procedure ? "Atualizar" : "Cadastrar Procedimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
