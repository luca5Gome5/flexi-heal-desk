import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  doctor_id: z.string().min(1, "Selecione um médico"),
  unit_id: z.string().min(1, "Selecione uma unidade"),
  procedure_id: z.string().optional(),
  appointment_date: z.string().min(1, "Selecione uma data"),
  start_time: z.string().min(1, "Informe o horário de início"),
  end_time: z.string().min(1, "Informe o horário de término"),
  is_procedure: z.boolean().default(false),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: any;
}

export const AppointmentDialog = ({
  open,
  onOpenChange,
  appointment,
}: AppointmentDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      unit_id: "",
      procedure_id: "",
      appointment_date: format(new Date(), "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "10:00",
      is_procedure: false,
      status: "scheduled",
      notes: "",
    },
  });

  useEffect(() => {
    if (appointment) {
      form.reset({
        patient_id: appointment.patient_id || "",
        doctor_id: appointment.doctor_id || "",
        unit_id: appointment.unit_id || "",
        procedure_id: appointment.procedure_id || "",
        appointment_date: appointment.appointment_date || "",
        start_time: appointment.start_time || "",
        end_time: appointment.end_time || "",
        is_procedure: appointment.is_procedure || false,
        status: appointment.status || "scheduled",
        notes: appointment.notes || "",
      });
    } else {
      form.reset({
        patient_id: "",
        doctor_id: "",
        unit_id: "",
        procedure_id: "",
        appointment_date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "10:00",
        is_procedure: false,
        status: "scheduled",
        notes: "",
      });
    }
  }, [appointment, form]);

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .eq("status", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
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
        .select("id, name")
        .eq("status", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      // Converter strings vazias para null nos campos UUID
      const dataToSave = {
        ...values,
        patient_id: values.patient_id || null,
        doctor_id: values.doctor_id || null,
        unit_id: values.unit_id || null,
        procedure_id: values.procedure_id || null,
      };

      // Validar conflitos de horário
      const { data: conflictingAppointments, error: checkError } = await supabase
        .from("appointments")
        .select("id, start_time, end_time")
        .eq("appointment_date", values.appointment_date)
        .eq("unit_id", values.unit_id)
        .neq("id", appointment?.id || "");

      if (checkError) throw checkError;

      // Verificar se há conflito de horário
      if (conflictingAppointments && conflictingAppointments.length > 0) {
        const newStart = values.start_time;
        const newEnd = values.end_time;

        for (const existing of conflictingAppointments) {
          const existingStart = existing.start_time;
          const existingEnd = existing.end_time;

          // Verificar sobreposição de horários
          if (
            (newStart >= existingStart && newStart < existingEnd) || // Novo começa durante existente
            (newEnd > existingStart && newEnd <= existingEnd) || // Novo termina durante existente
            (newStart <= existingStart && newEnd >= existingEnd) // Novo engloba existente
          ) {
            throw new Error(
              `Já existe uma consulta agendada entre ${existingStart.slice(0, 5)} e ${existingEnd.slice(0, 5)} neste horário.`
            );
          }
        }
      }

      if (appointment?.id) {
        const { error } = await supabase
          .from("appointments")
          .update(dataToSave as any)
          .eq("id", appointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert(dataToSave as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(appointment ? "Agendamento atualizado!" : "Agendamento criado!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!appointment?.id) return;
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento excluído!");
      onOpenChange(false);
    },
  });

  const onSubmit = (values: AppointmentFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médico</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um médico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="procedure_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um procedimento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {procedures?.map((procedure) => (
                        <SelectItem key={procedure.id} value={procedure.id}>
                          {procedure.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appointment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                disabled={saveMutation.isPending}
              >
                {appointment ? "Atualizar" : "Criar"} Agendamento
              </Button>
              {appointment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  Excluir
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
