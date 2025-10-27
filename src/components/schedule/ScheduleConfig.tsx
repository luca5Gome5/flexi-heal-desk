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
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

type DayOfWeek = "segunda-feira" | "terça-feira" | "quarta-feira" | "quinta-feira" | "sexta-feira" | "sábado" | "domingo";
type DbDayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const daysOfWeek: DayOfWeek[] = [
  "segunda-feira",
  "terça-feira", 
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
  "domingo"
];

const dayOfWeekMapping: Record<DayOfWeek, DbDayOfWeek> = {
  "segunda-feira": "monday",
  "terça-feira": "tuesday",
  "quarta-feira": "wednesday",
  "quinta-feira": "thursday",
  "sexta-feira": "friday",
  "sábado": "saturday",
  "domingo": "sunday"
};

const dbToDayOfWeek: Record<DbDayOfWeek, DayOfWeek> = {
  "monday": "segunda-feira",
  "tuesday": "terça-feira",
  "wednesday": "quarta-feira",
  "thursday": "quinta-feira",
  "friday": "sexta-feira",
  "saturday": "sábado",
  "sunday": "domingo"
};

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ScheduleConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleConfig = ({ open, onOpenChange }: ScheduleConfigProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [viewingUnit, setViewingUnit] = useState<string>("");
  const [attendanceDates, setAttendanceDates] = useState<Date[]>([]);
  const [procedureDates, setProcedureDates] = useState<Date[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<Record<DayOfWeek, TimeSlot>>({
    "segunda-feira": { startTime: "08:00", endTime: "18:00" },
    "terça-feira": { startTime: "08:00", endTime: "18:00" },
    "quarta-feira": { startTime: "08:00", endTime: "18:00" },
    "quinta-feira": { startTime: "08:00", endTime: "18:00" },
    "sexta-feira": { startTime: "08:00", endTime: "18:00" },
    "sábado": { startTime: "08:00", endTime: "12:00" },
    "domingo": { startTime: "08:00", endTime: "12:00" },
  });
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

  const { data: allAvailabilities } = useQuery({
    queryKey: ["all-availabilities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedure_availability")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: viewingAvailabilities } = useQuery({
    queryKey: ["unit-availabilities", viewingUnit],
    queryFn: async () => {
      if (!viewingUnit) return [];
      const { data, error } = await supabase
        .from("procedure_availability")
        .select("*")
        .eq("unit_id", viewingUnit);
      if (error) throw error;
      return data;
    },
    enabled: !!viewingUnit,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit || attendanceDates.length === 0) {
        throw new Error("Selecione uma unidade e pelo menos uma data de atendimento");
      }

      // Para cada data de atendimento selecionada, criar availabilities
      const promises = attendanceDates.map((date) => {
        const dayOfWeekKey = format(date, "EEEE", { locale: ptBR }).toLowerCase() as DayOfWeek;
        const timeSlot = weekSchedule[dayOfWeekKey];
        const dbDayOfWeek = dayOfWeekMapping[dayOfWeekKey];
        
        return supabase.from("procedure_availability").insert({
          unit_id: selectedUnit,
          day_of_week: dbDayOfWeek,
          start_time: timeSlot.startTime,
          end_time: timeSlot.endTime,
          procedure_id: null,
        });
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-availabilities"] });
      toast.success("Configuração salva com sucesso!");
      handleReset();
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

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedUnit("");
    setViewingUnit("");
    setAttendanceDates([]);
    setProcedureDates([]);
    setSelectedProcedures([]);
    setWeekSchedule({
      "segunda-feira": { startTime: "08:00", endTime: "18:00" },
      "terça-feira": { startTime: "08:00", endTime: "18:00" },
      "quarta-feira": { startTime: "08:00", endTime: "18:00" },
      "quinta-feira": { startTime: "08:00", endTime: "18:00" },
      "sexta-feira": { startTime: "08:00", endTime: "18:00" },
      "sábado": { startTime: "08:00", endTime: "12:00" },
      "domingo": { startTime: "08:00", endTime: "12:00" },
    });
  };

  const getUnitAvailabilitySummary = (unitId: string) => {
    const unitAvails = allAvailabilities?.filter(a => a.unit_id === unitId) || [];
    const daysWithService = new Set(unitAvails.map(a => a.day_of_week));
    const daysWithProcedures = new Set(
      unitAvails.filter(a => a.procedure_id).map(a => a.day_of_week)
    );
    return { daysWithService, daysWithProcedures, availabilities: unitAvails };
  };

  const toggleProcedure = (procedureId: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(procedureId)
        ? prev.filter((id) => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  const updateTimeSlot = (day: DayOfWeek, field: "startTime" | "endTime", value: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) return selectedUnit !== "";
    if (currentStep === 2) return attendanceDates.length > 0;
    if (currentStep === 3) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
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
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? "bg-[hsl(var(--accent))] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? "bg-[hsl(var(--accent))]" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="min-h-[400px]">
              {/* Step 1: Selecionar Unidade */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Passo 1: Selecione a Unidade</h3>
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
                </div>
              )}

              {/* Step 2: Selecionar Datas de Atendimento */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Passo 2: Selecione os Dias de Atendimento</h3>
                  <div className="border rounded-lg p-4">
                    <Calendar
                      mode="multiple"
                      selected={attendanceDates}
                      onSelect={(dates) => setAttendanceDates(dates || [])}
                      locale={ptBR}
                      className="mx-auto"
                    />
                    {attendanceDates.length > 0 && (
                      <div className="mt-4 text-sm">
                        <strong>Datas selecionadas ({attendanceDates.length}):</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {attendanceDates.map((date) => (
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
              )}

              {/* Step 3: Configurar Horários por Dia da Semana */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Passo 3: Configure os Horários por Dia da Semana</h3>
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => (
                      <Card key={day} className="p-4">
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label className="capitalize font-medium">{day}</Label>
                          <div>
                            <Label className="text-xs text-muted-foreground">Início</Label>
                            <Input
                              type="time"
                              value={weekSchedule[day].startTime}
                              onChange={(e) => updateTimeSlot(day, "startTime", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Término</Label>
                            <Input
                              type="time"
                              value={weekSchedule[day].endTime}
                              onChange={(e) => updateTimeSlot(day, "endTime", e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Selecionar Dias de Procedimentos */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Passo 4: Selecione os Dias com Procedimentos (Opcional)</h3>
                  <div className="border rounded-lg p-4">
                    <Calendar
                      mode="multiple"
                      selected={procedureDates}
                      onSelect={(dates) => setProcedureDates(dates || [])}
                      locale={ptBR}
                      className="mx-auto"
                    />
                    {procedureDates.length > 0 && (
                      <div className="mt-4 text-sm">
                        <strong>Datas com procedimentos ({procedureDates.length}):</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {procedureDates.map((date) => (
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
                  
                  <div className="mt-4">
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
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canProceedToNextStep()}
                  className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!selectedUnit || attendanceDates.length === 0}
                  className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                >
                  Salvar Configuração
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {!viewingUnit ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Todas as Unidades</h3>
                <div className="grid gap-4">
                  {units?.map((unit) => {
                    const summary = getUnitAvailabilitySummary(unit.id);
                    return (
                      <Card
                        key={unit.id}
                        className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                        onClick={() => setViewingUnit(unit.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{unit.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {summary.daysWithService.size} dias com atendimento
                              {summary.daysWithProcedures.size > 0 && 
                                ` • ${summary.daysWithProcedures.size} com procedimentos`
                              }
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingUnit("")}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {units?.find(u => u.id === viewingUnit)?.name}
                  </h3>
                </div>

                {viewingAvailabilities && viewingAvailabilities.length > 0 ? (
                  <>
                    {/* Legenda */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500" />
                        <span>Com atendimento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[hsl(var(--accent))]/20 border-2 border-[hsl(var(--accent))]" />
                        <span>Com procedimentos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500" />
                        <span>Sem atendimento</span>
                      </div>
                    </div>

                    {/* Calendário Visual por Dia da Semana */}
                    <div className="grid grid-cols-7 gap-2">
                      {daysOfWeek.map((day) => {
                        const dbDay = dayOfWeekMapping[day];
                        const hasService = viewingAvailabilities.some(
                          a => a.day_of_week === dbDay && !a.procedure_id
                        );
                        const hasProcedure = viewingAvailabilities.some(
                          a => a.day_of_week === dbDay && a.procedure_id
                        );
                        
                        let bgColor = "bg-red-500/20 border-red-500";
                        if (hasProcedure) {
                          bgColor = "bg-[hsl(var(--accent))]/20 border-[hsl(var(--accent))]";
                        } else if (hasService) {
                          bgColor = "bg-green-500/20 border-green-500";
                        }

                        return (
                          <Card
                            key={day}
                            className={`p-3 text-center border-2 ${bgColor}`}
                          >
                            <p className="font-medium text-sm capitalize">{day}</p>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Horários por Dia da Semana */}
                    <div className="space-y-3 mt-6">
                      <h4 className="font-semibold">Horários de Atendimento</h4>
                      {daysOfWeek.map((day) => {
                        const dbDay = dayOfWeekMapping[day];
                        const dayAvails = viewingAvailabilities.filter(
                          a => a.day_of_week === dbDay
                        );
                        
                        if (dayAvails.length === 0) return null;

                        return (
                          <Card key={day} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium capitalize">{day}</p>
                                {dayAvails.map((avail, idx) => (
                                  <p key={idx} className="text-sm text-muted-foreground">
                                    {avail.start_time} - {avail.end_time}
                                    {avail.procedure_id && " (com procedimentos)"}
                                  </p>
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  dayAvails.forEach(avail => 
                                    deleteMutation.mutate(avail.id)
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma disponibilidade cadastrada para esta unidade
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
