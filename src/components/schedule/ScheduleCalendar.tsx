import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { getStatusColor } from "@/lib/appointmentUtils";

interface ScheduleCalendarProps {
  viewMode: "day" | "week" | "month";
  currentDate: Date;
  selectedUnit: string;
  onAppointmentClick: (appointment: any) => void;
}

export const ScheduleCalendar = ({
  viewMode,
  currentDate,
  selectedUnit,
  onAppointmentClick,
}: ScheduleCalendarProps) => {
  const { data: appointments } = useQuery({
    queryKey: ["appointments", currentDate, selectedUnit],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(name),
          doctor:doctors(name),
          unit:units(name),
          procedure:procedures(name)
        `);

      if (selectedUnit !== "all") {
        query = query.eq("unit_id", selectedUnit);
      }

      const { data, error } = await query.order("appointment_date").order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  const getDaysToDisplay = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getAppointmentsForDayAndTime = (day: Date, time: string) => {
    if (!appointments) return [];
    const dateStr = format(day, "yyyy-MM-dd");
    return appointments.filter(
      (apt) => apt.appointment_date === dateStr && apt.start_time.startsWith(time.slice(0, 2))
    );
  };

  const timeSlots = getTimeSlots();
  const days = getDaysToDisplay();

  if (viewMode === "month") {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = appointments?.filter(
              (apt) => apt.appointment_date === format(day, "yyyy-MM-dd")
            ) || [];
            
            return (
              <div
                key={day.toISOString()}
                className="min-h-[100px] border rounded-lg p-2 hover:bg-accent/5 transition-colors"
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className={`text-xs p-1 ${getStatusColor(apt.status)} text-white rounded cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="font-medium truncate">{apt.patient?.name}</div>
                      <div className="opacity-90">{apt.start_time.slice(0, 5)}</div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="flex min-w-[800px]">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          <div className="h-12" /> {/* Header spacer */}
          {timeSlots.map((time) => (
            <div key={time} className="h-20 border-t text-sm text-muted-foreground pr-2 text-right pt-1">
              {time}
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex-1 flex">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 border-l">
              <div className="h-12 border-b flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, "d")}
                  </div>
                </div>
              </div>
              {timeSlots.map((time) => {
                const slotAppointments = getAppointmentsForDayAndTime(day, time);
                return (
                  <div key={`${day}-${time}`} className="h-20 border-t relative group">
                    {slotAppointments.map((apt, idx) => (
                      <div
                        key={apt.id}
                        onClick={() => onAppointmentClick(apt)}
                        className={`absolute inset-x-1 ${getStatusColor(apt.status)} rounded p-2 cursor-pointer hover:opacity-90 transition-opacity border border-white/20 m-0.5`}
                        style={{
                          top: `${idx * 45}px`,
                          height: "42px",
                        }}
                      >
                        <div className="text-xs font-medium text-white truncate">
                          {apt.patient?.name}
                        </div>
                        <div className="text-xs text-white/90 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.start_time.slice(0, 5)}
                        </div>
                      </div>
                    ))}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-accent/5 transition-opacity pointer-events-none" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
