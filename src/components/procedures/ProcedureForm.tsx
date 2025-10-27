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
  } | null;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

export function ProcedureForm({ open, onOpenChange, procedure }: ProcedureFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    status: true,
  });
  const [requiredExams, setRequiredExams] = useState<string[]>([]);
  const [newExam, setNewExam] = useState("");
  const [availability, setAvailability] = useState<
    Record<string, { days: string[]; start_time: string; end_time: string }>
  >({});

  // Fetch units
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

  // Fetch procedure availability if editing
  const { data: procedureAvailability } = useQuery({
    queryKey: ["procedure-availability", procedure?.id],
    queryFn: async () => {
      if (!procedure?.id) return [];
      const { data, error } = await supabase
        .from("procedure_availability")
        .select("*, unit:units(name)")
        .eq("procedure_id", procedure.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!procedure?.id && open,
  });

  // Update form data when procedure prop changes
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name || "",
        description: procedure.description || "",
        duration_minutes: procedure.duration_minutes || 60,
        status: procedure.status ?? true,
      });
      setRequiredExams(procedure.required_exams || []);
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        status: true,
      });
      setRequiredExams([]);
      setAvailability({});
    }
  }, [procedure, open]);

  // Group availability by unit when loaded
  useEffect(() => {
    if (procedureAvailability && procedureAvailability.length > 0) {
      const grouped: Record<string, { days: string[]; start_time: string; end_time: string }> = {};
      
      procedureAvailability.forEach((av: any) => {
        if (!grouped[av.unit_id]) {
          grouped[av.unit_id] = {
            days: [],
            start_time: av.start_time,
            end_time: av.end_time,
          };
        }
        grouped[av.unit_id].days.push(av.day_of_week);
      });

      setAvailability(grouped);
    }
  }, [procedureAvailability]);

  const handleAddExam = () => {
    if (newExam.trim() && !requiredExams.includes(newExam.trim())) {
      setRequiredExams([...requiredExams, newExam.trim()]);
      setNewExam("");
    }
  };

  const handleRemoveExam = (exam: string) => {
    setRequiredExams(requiredExams.filter((e) => e !== exam));
  };

  const handleDayToggle = (unitId: string, day: string) => {
    setAvailability((prev) => {
      const unitAvail = prev[unitId] || { days: [], start_time: "08:00", end_time: "18:00" };
      const days = unitAvail.days.includes(day)
        ? unitAvail.days.filter((d) => d !== day)
        : [...unitAvail.days, day];

      return { ...prev, [unitId]: { ...unitAvail, days } };
    });
  };

  const handleTimeChange = (unitId: string, field: "start_time" | "end_time", value: string) => {
    setAvailability((prev) => {
      const unitAvail = prev[unitId] || { days: [], start_time: "08:00", end_time: "18:00" };
      return { ...prev, [unitId]: { ...unitAvail, [field]: value } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        required_exams: requiredExams.length > 0 ? requiredExams : null,
      };

      let procedureId = procedure?.id;

      if (procedure?.id) {
        const { error } = await supabase
          .from("procedures")
          .update(dataToSave)
          .eq("id", procedure.id);

        if (error) throw error;
      } else {
        const { data: newProcedure, error } = await supabase
          .from("procedures")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        procedureId = newProcedure.id;
      }

      // Update procedure availability
      if (procedureId) {
        await supabase.from("procedure_availability").delete().eq("procedure_id", procedureId);

        const availabilityData: any[] = [];
        Object.entries(availability).forEach(([unitId, config]) => {
          config.days.forEach((day) => {
            availabilityData.push({
              procedure_id: procedureId,
              unit_id: unitId,
              day_of_week: day,
              start_time: config.start_time,
              end_time: config.end_time,
            });
          });
        });

        if (availabilityData.length > 0) {
          const { error: availError } = await supabase
            .from("procedure_availability")
            .insert(availabilityData);

          if (availError) throw availError;
        }
      }

      toast.success(
        procedure ? "Procedimento atualizado com sucesso!" : "Procedimento cadastrado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      queryClient.invalidateQueries({ queryKey: ["procedure-availability"] });
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

          <div className="space-y-3">
            <Label>Regras de Agendamento por Unidade</Label>
            <p className="text-xs text-muted-foreground">
              Defina em quais dias e horários este procedimento pode ser agendado em cada unidade
            </p>
            <div className="space-y-4">
              {units && units.length > 0 ? (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-4 rounded-lg border border-border bg-card space-y-3"
                  >
                    <h4 className="font-medium text-foreground">{unit.name}</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${unit.id}-${day.value}`}
                            checked={availability[unit.id]?.days.includes(day.value)}
                            onCheckedChange={() => handleDayToggle(unit.id, day.value)}
                            className="border-accent data-[state=checked]:bg-accent"
                          />
                          <Label
                            htmlFor={`${unit.id}-${day.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {availability[unit.id]?.days.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Horário Início</Label>
                          <Input
                            type="time"
                            value={availability[unit.id]?.start_time || "08:00"}
                            onChange={(e) => handleTimeChange(unit.id, "start_time", e.target.value)}
                            className="rounded-lg border-border focus-visible:ring-accent"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Horário Fim</Label>
                          <Input
                            type="time"
                            value={availability[unit.id]?.end_time || "18:00"}
                            onChange={(e) => handleTimeChange(unit.id, "end_time", e.target.value)}
                            className="rounded-lg border-border focus-visible:ring-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma unidade cadastrada
                </p>
              )}
            </div>
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
