import { StatsCard } from "@/components/dashboard/StatsCard";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [patients, appointments, doctors, units] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("units").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalPatients: patients.count || 0,
        totalAppointments: appointments.count || 0,
        totalDoctors: doctors.count || 0,
        totalUnits: units.count || 0,
      };
    },
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(name),
          doctor:doctors(name),
          unit:units(name)
        `)
        .eq("appointment_date", today)
        .order("start_time", { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão médica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Pacientes"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="accent"
        />
        <StatsCard
          title="Consultas Agendadas"
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          color="success"
        />
        <StatsCard
          title="Médicos Ativos"
          value={stats?.totalDoctors || 0}
          icon={CheckCircle}
          color="warning"
        />
        <StatsCard
          title="Unidades"
          value={stats?.totalUnits || 0}
          icon={Clock}
          color="destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Consultas de Hoje</h2>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10">
              Ver todas
            </Button>
          </div>
          
          <div className="space-y-4">
            {todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-accent/5 transition-smooth"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{appointment.patient?.name}</p>
                    <p className="text-sm text-muted-foreground">Dr. {appointment.doctor?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{appointment.unit?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent">{appointment.start_time}</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-success/10 text-success mt-1">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma consulta agendada para hoje</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 card-elevated">
          <h2 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button className="h-24 flex flex-col gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Calendar className="h-6 w-6" />
              <span>Nova Consulta</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 border-accent text-accent hover:bg-accent/10">
              <Users className="h-6 w-6" />
              <span>Novo Paciente</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 border-accent text-accent hover:bg-accent/10">
              <CheckCircle className="h-6 w-6" />
              <span>Ver Agenda</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 border-accent text-accent hover:bg-accent/10">
              <Clock className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
