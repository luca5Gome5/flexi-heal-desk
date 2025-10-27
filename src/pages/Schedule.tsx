import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { ScheduleConfig } from "@/components/schedule/ScheduleConfig";
import { AppointmentDialog } from "@/components/schedule/AppointmentDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "day" | "week" | "month";

const Schedule = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

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

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsAppointmentDialogOpen(true);
  };

  const getDateLabel = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewMode === "week") {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Gerenciamento de consultas e procedimentos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleNewAppointment}
            className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Button>
          <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="flex items-center justify-between bg-card rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPeriod}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-lg font-semibold capitalize">
            {getDateLabel()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Unidade:</span>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className={viewMode === "day" ? "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90" : ""}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90" : ""}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className={viewMode === "month" ? "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90" : ""}
            >
              Mês
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <ScheduleCalendar
        viewMode={viewMode}
        currentDate={currentDate}
        selectedUnit={selectedUnit}
        onAppointmentClick={(appointment) => {
          setSelectedAppointment(appointment);
          setIsAppointmentDialogOpen(true);
        }}
      />

      {/* Configuration Dialog */}
      <ScheduleConfig
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
      />

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default Schedule;
