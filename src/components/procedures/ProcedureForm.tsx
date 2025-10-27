import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProcedureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: {
    id: string;
    name: string;
    description: string | null;
    required_exams: string[] | null;
    duration_minutes: number | null;
    status: boolean | null;
    price_fixed: number | null;
    price_per_ml: number | null;
    price_card: number | null;
  } | null;
}

export function ProcedureForm({ open, onOpenChange, procedure }: ProcedureFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    status: true,
    price_fixed: "",
    price_per_ml: "",
    price_card: "",
  });
  const [requiredExams, setRequiredExams] = useState<string[]>([]);
  const [newExam, setNewExam] = useState("");

  // Update form data when procedure prop changes
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name || "",
        description: procedure.description || "",
        duration_minutes: procedure.duration_minutes || 60,
        status: procedure.status ?? true,
        price_fixed: procedure.price_fixed ? procedure.price_fixed.toString() : "",
        price_per_ml: procedure.price_per_ml ? procedure.price_per_ml.toString() : "",
        price_card: procedure.price_card ? procedure.price_card.toString() : "",
      });
      setRequiredExams(procedure.required_exams || []);
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        status: true,
        price_fixed: "",
        price_per_ml: "",
        price_card: "",
      });
      setRequiredExams([]);
    }
  }, [procedure, open]);

  const handleAddExam = () => {
    if (newExam.trim() && !requiredExams.includes(newExam.trim())) {
      setRequiredExams([...requiredExams, newExam.trim()]);
      setNewExam("");
    }
  };

  const handleRemoveExam = (exam: string) => {
    setRequiredExams(requiredExams.filter((e) => e !== exam));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        status: formData.status,
        price_fixed: formData.price_fixed ? parseFloat(formData.price_fixed) : null,
        price_per_ml: formData.price_per_ml ? parseFloat(formData.price_per_ml) : null,
        price_card: formData.price_card ? parseFloat(formData.price_card) : null,
        required_exams: requiredExams.length > 0 ? requiredExams : null,
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

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
              }
              className="rounded-lg border-border focus-visible:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_fixed">Valor Fixo (R$)</Label>
              <Input
                id="price_fixed"
                type="number"
                min={0}
                step={0.01}
                value={formData.price_fixed}
                onChange={(e) =>
                  setFormData({ ...formData, price_fixed: e.target.value })
                }
                placeholder="0.00"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_ml">Valor por ML (R$)</Label>
              <Input
                id="price_per_ml"
                type="number"
                min={0}
                step={0.01}
                value={formData.price_per_ml}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_ml: e.target.value })
                }
                placeholder="0.00"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_card">Valor no Cartão (R$)</Label>
              <Input
                id="price_card"
                type="number"
                min={0}
                step={0.01}
                value={formData.price_card}
                onChange={(e) =>
                  setFormData({ ...formData, price_card: e.target.value })
                }
                placeholder="0.00"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Exames Necessários</Label>
            <div className="flex gap-2">
              <Input
                value={newExam}
                onChange={(e) => setNewExam(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExam())}
                placeholder="Ex: Hemograma completo"
                className="rounded-lg border-border focus-visible:ring-accent"
              />
              <Button
                type="button"
                onClick={handleAddExam}
                variant="outline"
                size="icon"
                className="border-accent text-accent hover:bg-accent/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {requiredExams.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/30">
                {requiredExams.map((exam) => (
                  <Badge
                    key={exam}
                    variant="secondary"
                    className="gap-1 bg-accent/10 text-accent hover:bg-accent/20"
                  >
                    {exam}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveExam(exam)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

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
