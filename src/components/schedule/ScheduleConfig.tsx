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
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Trash2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

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

// Feriados nacionais do Brasil (fixos)
const getBrazilianHolidays = (year: number): Date[] => {
  const holidays: Date[] = [
    new Date(year, 0, 1),   // Ano Novo
    new Date(year, 3, 21),  // Tiradentes
    new Date(year, 4, 1),   // Dia do Trabalho
    new Date(year, 8, 7),   // Independência
    new Date(year, 9, 12),  // Nossa Senhora Aparecida
    new Date(year, 10, 2),  // Finados
    new Date(year, 10, 15), // Proclamação da República
    new Date(year, 11, 25), // Natal
  ];

  // Calcular Páscoa e feriados móveis
  const easter = getEasterDate(year);
  holidays.push(
    new Date(easter.getTime() - 47 * 24 * 60 * 60 * 1000), // Carnaval (47 dias antes)
    new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000),  // Sexta-feira Santa
    new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000), // Corpus Christi
  );

  return holidays;
};

// Algoritmo para calcular a data da Páscoa
const getEasterDate = (year: number): Date => {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

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
  const [procedureWeekDays, setProcedureWeekDays] = useState<number[]>([]);
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
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ startTime: string; endTime: string }>({
    startTime: "08:00",
    endTime: "18:00"
  });
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dateSpecificSchedules, setDateSpecificSchedules] = useState<Record<string, TimeSlot>>({});
  
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
        .from("availabilities")
        .select(`
          *,
          units (name),
          procedures (name)
        `);
      if (error) throw error;
      return data;
    },
  });

  const { data: viewingAvailabilities } = useQuery({
    queryKey: ["unit-availabilities", viewingUnit],
    queryFn: async () => {
      if (!viewingUnit) return [];
      const { data, error } = await supabase
        .from("availabilities")
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

      // Criar um Set com as datas de procedimento para busca rápida
      const procedureDateStrings = new Set(
        procedureDates.map(date => format(date, "yyyy-MM-dd"))
      );

      // Para cada data de atendimento, criar registros na tabela availabilities
      const promises = attendanceDates.flatMap((date) => {
        const dateString = format(date, "yyyy-MM-dd");
        const timeSlot = dateSpecificSchedules[dateString] || { startTime: "08:00", endTime: "18:00" };
        const isProcedureDay = procedureDateStrings.has(dateString);
        
        const insertPromises = [];

        // Sempre criar um registro de disponibilidade geral (sem procedure_id)
        insertPromises.push(
          supabase.from("availabilities").insert({
            unit_id: selectedUnit,
            availability_date: dateString,
            start_time: timeSlot.startTime,
            end_time: timeSlot.endTime,
            is_procedure_day: isProcedureDay,
            procedure_id: null,
          })
        );

        // Se é dia de procedimento e há procedimentos selecionados, criar registros para cada procedimento
        if (isProcedureDay && selectedProcedures.length > 0) {
          selectedProcedures.forEach(procedureId => {
            insertPromises.push(
              supabase.from("availabilities").insert({
                unit_id: selectedUnit,
                availability_date: dateString,
                start_time: timeSlot.startTime,
                end_time: timeSlot.endTime,
                is_procedure_day: true,
                procedure_id: procedureId,
              })
            );
          });
        }

        return insertPromises;
      });

      const results = await Promise.all(promises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(errors[0].error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-availabilities"] });
      queryClient.invalidateQueries({ queryKey: ["unit-availabilities"] });
      toast.success("Configuração salva com sucesso!");
      handleReset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ dateStr, startTime, endTime }: { dateStr: string; startTime: string; endTime: string }) => {
      // Atualizar todos os registros dessa data
      const { error } = await supabase
        .from("availabilities")
        .update({ start_time: startTime, end_time: endTime })
        .eq("unit_id", viewingUnit)
        .eq("availability_date", dateStr);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-availabilities"] });
      toast.success("Horário atualizado com sucesso!");
      setEditingDate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("availabilities")
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
    setProcedureWeekDays([]);
    setSelectedProcedures([]);
    setEditingDate(null);
    setEditingValues({ startTime: "08:00", endTime: "18:00" });
    setSelectedMonth(new Date());
    setCurrentPage(1);
    setDateSpecificSchedules({});
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
    const uniqueDates = new Set(unitAvails.map(a => a.availability_date));
    const datesWithProcedures = new Set(
      unitAvails.filter(a => a.procedure_id).map(a => a.availability_date)
    );
    return { daysWithService: uniqueDates, daysWithProcedures: datesWithProcedures, availabilities: unitAvails };
  };

  const selectAllBusinessDays = () => {
    const today = new Date();
    const months = 12; // Próximos 12 meses
    const businessDays: Date[] = [];

    // Coletar feriados para os próximos 12 meses
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const holidays = [
      ...getBrazilianHolidays(currentYear),
      ...getBrazilianHolidays(nextYear)
    ];

    // Criar set de strings de feriados para comparação rápida
    const holidayStrings = new Set(
      holidays.map(h => format(h, "yyyy-MM-dd"))
    );

    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const daysInMonth = eachDayOfInterval({ start, end });
      
      daysInMonth.forEach(day => {
        const dayOfWeek = getDay(day);
        const dateString = format(day, "yyyy-MM-dd");
        
        // Incluir segunda (1) a sábado (6), excluir domingo (0)
        // E não incluir feriados
        if (dayOfWeek >= 1 && dayOfWeek <= 6 && !holidayStrings.has(dateString)) {
          businessDays.push(day);
        }
      });
    }

    setAttendanceDates(businessDays);
    toast.success(`${businessDays.length} dias úteis selecionados para os próximos 12 meses`);
  };

  const selectProcedureDaysByWeekDays = () => {
    if (procedureWeekDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    const today = new Date();
    const months = 12;
    const procedureDays: Date[] = [];

    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const holidays = [
      ...getBrazilianHolidays(currentYear),
      ...getBrazilianHolidays(nextYear)
    ];

    const holidayStrings = new Set(
      holidays.map(h => format(h, "yyyy-MM-dd"))
    );

    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const daysInMonth = eachDayOfInterval({ start, end });
      
      daysInMonth.forEach(day => {
        const dayOfWeek = getDay(day);
        const dateString = format(day, "yyyy-MM-dd");
        
        // Incluir apenas os dias da semana selecionados e não incluir feriados
        if (procedureWeekDays.includes(dayOfWeek) && !holidayStrings.has(dateString)) {
          procedureDays.push(day);
        }
      });
    }

    setProcedureDates(procedureDays);
    
    const dayNames = procedureWeekDays.map(d => {
      const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      return names[d];
    }).join(", ");
    
    toast.success(`${procedureDays.length} datas selecionadas para ${dayNames}`);
  };

  const toggleProcedureWeekDay = (day: number) => {
    setProcedureWeekDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
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

  const updateDateSpecificTime = (dateString: string, field: "startTime" | "endTime", value: string) => {
    setDateSpecificSchedules((prev) => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        [field]: value,
      },
    }));
  };

  const initializeDateSpecificSchedules = () => {
    const schedules: Record<string, TimeSlot> = {};
    attendanceDates.forEach(date => {
      const dateString = format(date, "yyyy-MM-dd");
      schedules[dateString] = { startTime: "08:00", endTime: "18:00" };
    });
    setDateSpecificSchedules(schedules);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) return selectedUnit !== "";
    if (currentStep === 2) return attendanceDates.length > 0;
    if (currentStep === 3) return true;
    if (currentStep === 4) return true;
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
              {[1, 2, 3, 4, 5].map((step) => (
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
                  {step < 5 && (
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Passo 2: Selecione os Dias de Atendimento</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllBusinessDays}
                      className="gap-2"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Selecionar Todos os Dias Úteis
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você pode selecionar manualmente ou usar o botão acima para selecionar automaticamente 
                    todos os dias úteis (segunda a sábado) dos próximos 12 meses, excluindo feriados nacionais.
                  </p>
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
                        <div className="flex flex-wrap gap-2 mt-2 max-h-[150px] overflow-y-auto">
                          {attendanceDates.slice(0, 20).map((date) => (
                            <span
                              key={date.toISOString()}
                              className="bg-accent text-white px-2 py-1 rounded text-xs"
                            >
                              {format(date, "dd/MM/yyyy")}
                            </span>
                          ))}
                          {attendanceDates.length > 20 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{attendanceDates.length - 20} datas...
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Configurar Horários por Dia da Semana */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Passo 3: Configure os Horários Padrão (Opcional)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estes horários são apenas referência. Na etapa final, você poderá ajustar os horários individualmente para cada data.
                  </p>
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
                  
                  {/* Seleção rápida por dias da semana */}
                  <Card className="p-4 bg-accent/5">
                    <h4 className="font-medium mb-3">Seleção Rápida por Dias da Semana</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Selecione os dias da semana que terão procedimentos durante todo o ano:
                    </p>
                    <div className="grid grid-cols-7 gap-2 mb-3">
                      {[
                        { day: 0, name: "Dom" },
                        { day: 1, name: "Seg" },
                        { day: 2, name: "Ter" },
                        { day: 3, name: "Qua" },
                        { day: 4, name: "Qui" },
                        { day: 5, name: "Sex" },
                        { day: 6, name: "Sáb" },
                      ].map(({ day, name }) => (
                        <Button
                          key={day}
                          variant={procedureWeekDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleProcedureWeekDay(day)}
                          className={procedureWeekDays.includes(day) ? "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90" : ""}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={selectProcedureDaysByWeekDays}
                      disabled={procedureWeekDays.length === 0}
                      className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Aplicar para o Ano Todo
                    </Button>
                  </Card>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        ou selecione manualmente
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Marque as datas específicas em que haverá procedimentos disponíveis:
                  </p>
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
                        <div className="flex flex-wrap gap-2 mt-2 max-h-[150px] overflow-y-auto">
                          {procedureDates.slice(0, 20).map((date) => (
                            <span
                              key={date.toISOString()}
                              className="bg-[hsl(var(--accent))] text-white px-2 py-1 rounded text-xs"
                            >
                              {format(date, "dd/MM/yyyy")}
                            </span>
                          ))}
                          {procedureDates.length > 20 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{procedureDates.length - 20} datas...
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Revisar e Editar Horários de Cada Dia */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Passo 5: Revisar e Ajustar Horários</h3>
                  <p className="text-sm text-muted-foreground">
                    Revise os horários para cada data. Por padrão, todos os dias estão configurados das 08:00 às 18:00, mas você pode ajustar individualmente.
                  </p>
                  
                  <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                    {attendanceDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date) => {
                        const dateString = format(date, "yyyy-MM-dd");
                        const schedule = dateSpecificSchedules[dateString] || { startTime: "08:00", endTime: "18:00" };
                        const isProcedureDay = procedureDates.some(pDate => format(pDate, "yyyy-MM-dd") === dateString);
                        
                        return (
                          <Card key={dateString} className={`p-3 ${isProcedureDay ? 'border-[hsl(var(--accent))] border-2' : ''}`}>
                            <div className="grid grid-cols-4 gap-3 items-center">
                              <div>
                                <p className="font-medium">{format(date, "dd/MM/yyyy")}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {format(date, "EEEE", { locale: ptBR })}
                                  {isProcedureDay && (
                                    <span className="ml-2 text-[hsl(var(--accent))] font-semibold">• Procedimento</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Início</Label>
                                <Input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) => updateDateSpecificTime(dateString, "startTime", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Término</Label>
                                <Input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) => updateDateSpecificTime(dateString, "endTime", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(() => {
                                  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                                  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                                  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                                  const hours = Math.floor(totalMinutes / 60);
                                  const mins = totalMinutes % 60;
                                  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
                                })()}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                  
                  <div className="bg-accent/5 p-4 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Resumo da Configuração:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {attendanceDates.length} dias de atendimento</li>
                      <li>• {procedureDates.length} dias com procedimentos</li>
                      <li>• Unidade: {units?.find(u => u.id === selectedUnit)?.name}</li>
                    </ul>
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

              {currentStep < 5 ? (
                <Button
                  onClick={() => {
                    if (currentStep === 4) {
                      // Inicializar horários específicos antes de ir para o Step 5
                      initializeDateSpecificSchedules();
                    }
                    setCurrentStep((prev) => prev + 1);
                  }}
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
                    {/* Calendário com Datas */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Calendário de Disponibilidades</h4>
                      <div className="flex justify-center">
                        <Calendar
                          mode="multiple"
                          selected={viewingAvailabilities.map(a => new Date(a.availability_date + 'T00:00:00'))}
                          modifiers={{
                            withProcedures: viewingAvailabilities
                              .filter(a => a.procedure_id)
                              .map(a => new Date(a.availability_date + 'T00:00:00'))
                          }}
                          modifiersClassNames={{
                            selected: "bg-amber-500 text-white hover:bg-amber-600",
                            withProcedures: "bg-amber-600 text-white hover:bg-amber-700 font-bold"
                          }}
                          className="rounded-md border"
                        />
                      </div>
                      <div className="flex gap-4 text-sm justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-amber-500" />
                          <span>Dias com atendimento</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-amber-600" />
                          <span>Dias com procedimentos</span>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Disponibilidades por Data */}
                    <div className="space-y-3 mt-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Disponibilidades Cadastradas</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMonth(prev => addMonths(prev, -1));
                              setCurrentPage(1);
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium min-w-[120px] text-center">
                            {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMonth(prev => addMonths(prev, 1));
                              setCurrentPage(1);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // Filtrar por mês selecionado e datas futuras
                        const filteredDates = Array.from(new Set(viewingAvailabilities.map(a => a.availability_date)))
                          .filter(dateStr => {
                            const date = new Date(dateStr + 'T00:00:00');
                            return date >= today &&
                              date.getMonth() === selectedMonth.getMonth() &&
                              date.getFullYear() === selectedMonth.getFullYear();
                          })
                          .sort();
                        
                        // Paginação
                        const totalPages = Math.ceil(filteredDates.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedDates = filteredDates.slice(startIndex, startIndex + itemsPerPage);
                        
                        if (filteredDates.length === 0) {
                          return (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhuma disponibilidade cadastrada para este mês
                            </p>
                          );
                        }
                        
                        return (
                          <>
                            {paginatedDates.map((dateStr) => {
                              const dateAvails = viewingAvailabilities.filter(a => a.availability_date === dateStr);
                              const date = new Date(dateStr + 'T00:00:00');
                              const dayOfWeekKey = format(date, "EEEE", { locale: ptBR });
                              const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
                              const withProcedure = dateAvails.find(a => a.procedure_id);
                              const withoutProcedure = dateAvails.find(a => !a.procedure_id);
                              const isEditing = editingDate === dateStr;

                              return (
                                <Card key={dateStr} className="p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="font-medium capitalize">
                                        {dayOfWeekKey} - {formattedDate}
                                      </p>
                                      {isEditing ? (
                                        <div className="flex gap-2 mt-2">
                                          <Input
                                            type="time"
                                            value={editingValues.startTime}
                                            onChange={(e) => setEditingValues(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="w-32"
                                          />
                                          <span className="self-center">-</span>
                                          <Input
                                            type="time"
                                            value={editingValues.endTime}
                                            onChange={(e) => setEditingValues(prev => ({ ...prev, endTime: e.target.value }))}
                                            className="w-32"
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              updateMutation.mutate({
                                                dateStr,
                                                startTime: editingValues.startTime,
                                                endTime: editingValues.endTime
                                              });
                                            }}
                                          >
                                            Salvar
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingDate(null)}
                                          >
                                            Cancelar
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          {withoutProcedure && (
                                            <p className="text-sm text-muted-foreground">
                                              {withoutProcedure.start_time} - {withoutProcedure.end_time}
                                            </p>
                                          )}
                                          {withProcedure && (
                                            <p className="text-sm text-amber-600 font-medium">
                                              Com procedimentos disponíveis
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    {!isEditing && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingDate(dateStr);
                                            setEditingValues({
                                              startTime: withoutProcedure?.start_time || "08:00",
                                              endTime: withoutProcedure?.end_time || "18:00"
                                            });
                                          }}
                                        >
                                          <CalendarDays className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            dateAvails.forEach(avail => 
                                              deleteMutation.mutate(avail.id)
                                            );
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                            
                            {/* Paginação */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Anterior
                                </Button>
                                <span className="text-sm">
                                  Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentPage === totalPages}
                                >
                                  Próxima
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
