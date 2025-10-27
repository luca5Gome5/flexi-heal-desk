import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface ScheduleConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleConfig = ({ open, onOpenChange }: ScheduleConfigProps) => {
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("status", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: procedures } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .eq("status", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: availabilities } = useQuery({
    queryKey: ["unit-availabilities", selectedUnit],
    queryFn: async () => {
      if (!selectedUnit) return [];
      const { data, error } = await supabase
        .from("procedure_availability")
        .select("*")
        .eq("unit_id", selectedUnit);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnit,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit || selectedDates.length === 0) {
        throw new Error("Selecione uma unidade e pelo menos uma data");
      }

      // Para cada data selecionada, criar availabilities
      const promises = selectedDates.map((date) => {
        const dayOfWeek = format(date, "EEEE", { locale: ptBR }).toLowerCase();
        
        return supabase.from("procedure_availability").insert({
          unit_id: selectedUnit,
          day_of_week: dayOfWeek as any,
          start_time: startTime,
          end_time: endTime,
          procedure_id: selectedProcedures[0] || null, // Simplificado para o primeiro procedimento
        });
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-availabilities"] });
      toast.success("Disponibilidade configurada com sucesso!");
      setSelectedDates([]);
      setSelectedProcedures([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("procedure_availability")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-availabilities"] });
      toast.success("Disponibilidade removida!");
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const toggleProcedure = (procedureId: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(procedureId)
        ? prev.filter((id) => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração de Disponibilidade</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Nova Configuração</TabsTrigger>
            <TabsTrigger value="list">Disponibilidades Cadastradas</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Unidade</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Selecione as Datas de Atendimento</Label>
                <div className="border rounded-lg p-4 mt-2">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    locale={ptBR}
                    className="mx-auto"
                  />
                  {selectedDates.length > 0 && (
                    <div className="mt-4 text-sm">
                      <strong>Datas selecionadas:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDates.map((date) => (
                          <span
                            key={date.toISOString()}
                            className="bg-accent text-white px-2 py-1 rounded text-xs"
                          >
                            {format(date, "dd/MM/yyyy")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Horário de Término</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Procedimentos Disponíveis</Label>
                <div className="border rounded-lg p-4 mt-2 max-h-[200px] overflow-y-auto">
                  <div className="space-y-2">
                    {procedures?.map((procedure) => (
                      <label
                        key={procedure.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent/5 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProcedures.includes(procedure.id)}
                          onChange={() => toggleProcedure(procedure.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{procedure.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={!selectedUnit || selectedDates.length === 0}
                className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
              >
                Salvar Configuração
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {!selectedUnit ? (
              <p className="text-center text-muted-foreground py-8">
                Selecione uma unidade para ver as disponibilidades
              </p>
            ) : availabilities && availabilities.length > 0 ? (
              <div className="space-y-2">
                {availabilities.map((availability) => (
                  <Card key={availability.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{availability.day_of_week}</p>
                        <p className="text-sm text-muted-foreground">
                          {availability.start_time} - {availability.end_time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(availability.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma disponibilidade cadastrada para esta unidade
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
