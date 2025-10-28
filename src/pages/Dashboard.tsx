import { StatsCard } from "@/components/dashboard/StatsCard";
import { Calendar, Users, Clock, CheckCircle, FileText, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function Dashboard() {
  const navigate = useNavigate();

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

  // Gráfico de consultas por status
  const { data: appointmentsByStatus } = useQuery({
    queryKey: ["appointments-by-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("status");

      if (!data) return [];

      const statusCount = data.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(statusCount).map(([name, value]) => ({
        name: name === 'scheduled' ? 'Agendada' : name === 'completed' ? 'Concluída' : name === 'cancelled' ? 'Cancelada' : name,
        value
      }));
    },
  });

  // Gráfico de consultas dos últimos 7 dias
  const { data: appointmentsLast7Days } = useQuery({
    queryKey: ["appointments-last-7-days"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split("T")[0]);
      }

      const { data } = await supabase
        .from("appointments")
        .select("appointment_date")
        .in("appointment_date", days);

      if (!data) return [];

      const countByDate = days.map(date => {
        const count = data.filter(app => app.appointment_date === date).length;
        const dateObj = new Date(date);
        return {
          name: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          consultas: count
        };
      });

      return countByDate;
    },
  });

  // Gráfico de procedimentos mais realizados
  const { data: topProcedures } = useQuery({
    queryKey: ["top-procedures"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select(`
          procedure:procedures(name)
        `)
        .not("procedure_id", "is", null);

      if (!data) return [];

      const procedureCount = data.reduce((acc: any, curr) => {
        const name = curr.procedure?.name || "Sem procedimento";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(procedureCount)
        .map(([name, value]) => ({ name, total: value }))
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);
    },
  });

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral completa do sistema de gestão médica</p>
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
          icon={Building2}
          color="destructive"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 card-elevated">
          <h2 className="text-xl font-semibold text-foreground mb-6">Consultas nos Últimos 7 Dias</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentsLast7Days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="consultas" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 card-elevated">
          <h2 className="text-xl font-semibold text-foreground mb-6">Status das Consultas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointmentsByStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="hsl(var(--accent))"
                dataKey="value"
              >
                {appointmentsByStatus?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 card-elevated">
          <h2 className="text-xl font-semibold text-foreground mb-6">Procedimentos Mais Realizados</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProcedures || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="total" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Consultas de Hoje</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent hover:text-accent hover:bg-accent/10"
              onClick={() => navigate('/calendar')}
            >
              Ver todas
            </Button>
          </div>
          
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-accent/5 transition-smooth cursor-pointer"
                  onClick={() => navigate('/calendar')}
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{appointment.patient?.name}</p>
                    <p className="text-xs text-muted-foreground">{appointment.doctor?.name}</p>
                    <p className="text-xs text-muted-foreground">{appointment.unit?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent">{appointment.start_time?.slice(0, 5)}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                      appointment.status === 'completed' ? 'bg-success/10 text-success' :
                      appointment.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {appointment.status === 'scheduled' ? 'Agendada' : 
                       appointment.status === 'completed' ? 'Concluída' : 
                       appointment.status === 'cancelled' ? 'Cancelada' : appointment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma consulta agendada para hoje</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="p-6 card-elevated">
        <h2 className="text-xl font-semibold text-foreground mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            className="h-28 flex flex-col gap-2 bg-accent hover:bg-accent/90 text-accent-foreground transition-smooth"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="h-7 w-7" />
            <span className="text-sm font-medium">Nova Consulta</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-28 flex flex-col gap-2 border-2 border-accent text-accent hover:bg-accent/10 transition-smooth"
            onClick={() => navigate('/patients')}
          >
            <Users className="h-7 w-7" />
            <span className="text-sm font-medium">Novo Paciente</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-28 flex flex-col gap-2 border-2 border-success text-success hover:bg-success/10 transition-smooth"
            onClick={() => navigate('/calendar')}
          >
            <CheckCircle className="h-7 w-7" />
            <span className="text-sm font-medium">Ver Agenda</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-28 flex flex-col gap-2 border-2 border-warning text-warning hover:bg-warning/10 transition-smooth"
            onClick={() => navigate('/procedures')}
          >
            <FileText className="h-7 w-7" />
            <span className="text-sm font-medium">Procedimentos</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
