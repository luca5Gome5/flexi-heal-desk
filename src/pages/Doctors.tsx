import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Phone, Mail, Building2, Edit, Trash2, Stethoscope } from "lucide-react";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Doctors() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data: doctorsData, error } = await supabase
        .from("doctors")
        .select(`
          *,
          unit:units(name),
          doctor_units(unit:units(id, name))
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      return doctorsData || [];
    },
  });

  const filteredDoctors = doctors?.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.professional_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleNewDoctor = () => {
    setSelectedDoctor(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (doctorId: string) => {
    setDoctorToDelete(doctorId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;

    try {
      const { error } = await supabase.from("doctors").delete().eq("id", doctorToDelete);

      if (error) throw error;

      toast.success("Médico excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir médico");
    } finally {
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedDoctor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Médicos</h1>
          <p className="text-muted-foreground">Gerencie os profissionais de saúde</p>
        </div>
        <Button
          onClick={handleNewDoctor}
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Médico
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome, especialidade ou registro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg border-border focus-visible:ring-accent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando médicos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors && filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="p-6 card-elevated hover:shadow-golden">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-lg text-foreground">{doctor.name}</h3>
                      </div>
                      <p className="text-sm text-accent font-medium">{doctor.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doctor.professional_id}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          doctor.status
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {doctor.status ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {doctor.doctor_units && doctor.doctor_units.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-sm">
                          <Building2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1">
                              {doctor.doctor_units.map((du: any, index: number) => (
                                <span
                                  key={du.unit.id}
                                  className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                    doctor.default_unit_id === du.unit.id
                                      ? "bg-accent/20 text-accent font-medium"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {du.unit.name}
                                  {doctor.default_unit_id === du.unit.id && " ★"}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {doctor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}

                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(doctor)}
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(doctor.id)}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg mb-2">Nenhum médico encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando o primeiro médico"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleNewDoctor}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Médico
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <DoctorForm open={isFormOpen} onOpenChange={handleFormClose} doctor={selectedDoctor} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este médico? Esta ação não pode ser desfeita e pode
              afetar agendamentos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
