import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/PatientForm";
import { Plus, Search, Phone, Mail, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir paciente: " + error.message);
    },
  });

  const filteredPatients = patients?.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (patient: any) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (patient: any) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleViewDialogClose = () => {
    setIsViewDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleCopyData = (patient: any) => {
    const data = [
      `Nome: ${patient.name}`,
      patient.cpf && `CPF: ${patient.cpf}`,
      patient.rg && `RG: ${patient.rg}`,
      patient.birth_date && `Data de Nascimento: ${new Date(patient.birth_date).toLocaleDateString('pt-BR')}`,
      patient.email && `E-mail: ${patient.email}`,
      patient.phone && `Telefone: ${patient.phone}`,
      patient.address && `Endereço: ${patient.address}`,
      patient.address_number && `Número: ${patient.address_number}`,
      patient.neighborhood && `Bairro: ${patient.neighborhood}`,
      patient.city && `Cidade: ${patient.city}`,
      patient.state && `Estado: ${patient.state}`,
      patient.zip_code && `CEP: ${patient.zip_code}`,
      patient.marital_status && `Estado Civil: ${patient.marital_status.replace('_', ' ')}`,
      patient.occupation && `Profissão: ${patient.occupation}`,
      patient.insurance && `Convênio: ${patient.insurance}`,
      patient.consultation_reason && `Motivo da Consulta: ${patient.consultation_reason}`,
      patient.notes && `Observações: ${patient.notes}`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(data).then(() => {
      toast.success("Dados copiados para a área de transferência!");
    }).catch(() => {
      toast.error("Erro ao copiar dados");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg border-border focus-visible:ring-accent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando pacientes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients && filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card 
                key={patient.id} 
                className="p-6 card-elevated hover:shadow-golden cursor-pointer transition-all"
                onClick={() => handleView(patient)}
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">CPF: {patient.cpf || "Não informado"}</p>
                  </div>
                  
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{patient.email}</span>
                    </div>
                  )}

                  {patient.insurance && (
                    <div className="pt-3 border-t border-border">
                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-accent/10 text-accent">
                        {patient.insurance}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(patient);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(patient.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Nenhum paciente encontrado</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
          </DialogHeader>
          <PatientForm patient={selectedPatient} onSuccess={handleDialogClose} />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="font-medium">{selectedPatient.name}</p>
                </div>
                {selectedPatient.cpf && (
                  <div>
                    <Label className="text-muted-foreground">CPF</Label>
                    <p className="font-medium">{selectedPatient.cpf}</p>
                  </div>
                )}
                {selectedPatient.rg && (
                  <div>
                    <Label className="text-muted-foreground">RG</Label>
                    <p className="font-medium">{selectedPatient.rg}</p>
                  </div>
                )}
                {selectedPatient.birth_date && (
                  <div>
                    <Label className="text-muted-foreground">Data de Nascimento</Label>
                    <p className="font-medium">{new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                {selectedPatient.email && (
                  <div>
                    <Label className="text-muted-foreground">E-mail</Label>
                    <p className="font-medium">{selectedPatient.email}</p>
                  </div>
                )}
                {selectedPatient.phone && (
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedPatient.phone}</p>
                  </div>
                )}
              </div>

              {(selectedPatient.address || selectedPatient.city || selectedPatient.state) && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPatient.address && (
                      <div>
                        <Label className="text-muted-foreground">Logradouro</Label>
                        <p className="font-medium">{selectedPatient.address}</p>
                      </div>
                    )}
                    {selectedPatient.address_number && (
                      <div>
                        <Label className="text-muted-foreground">Número</Label>
                        <p className="font-medium">{selectedPatient.address_number}</p>
                      </div>
                    )}
                    {selectedPatient.neighborhood && (
                      <div>
                        <Label className="text-muted-foreground">Bairro</Label>
                        <p className="font-medium">{selectedPatient.neighborhood}</p>
                      </div>
                    )}
                    {selectedPatient.city && (
                      <div>
                        <Label className="text-muted-foreground">Cidade</Label>
                        <p className="font-medium">{selectedPatient.city}</p>
                      </div>
                    )}
                    {selectedPatient.state && (
                      <div>
                        <Label className="text-muted-foreground">Estado</Label>
                        <p className="font-medium">{selectedPatient.state}</p>
                      </div>
                    )}
                    {selectedPatient.zip_code && (
                      <div>
                        <Label className="text-muted-foreground">CEP</Label>
                        <p className="font-medium">{selectedPatient.zip_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPatient.marital_status && (
                  <div>
                    <Label className="text-muted-foreground">Estado Civil</Label>
                    <p className="font-medium capitalize">{selectedPatient.marital_status.replace('_', ' ')}</p>
                  </div>
                )}
                {selectedPatient.occupation && (
                  <div>
                    <Label className="text-muted-foreground">Profissão</Label>
                    <p className="font-medium">{selectedPatient.occupation}</p>
                  </div>
                )}
                {selectedPatient.insurance && (
                  <div>
                    <Label className="text-muted-foreground">Convênio</Label>
                    <p className="font-medium">{selectedPatient.insurance}</p>
                  </div>
                )}
              </div>

              {selectedPatient.consultation_reason && (
                <div>
                  <Label className="text-muted-foreground">Motivo da Consulta</Label>
                  <p className="font-medium">{selectedPatient.consultation_reason}</p>
                </div>
              )}

              {selectedPatient.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="font-medium">{selectedPatient.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleCopyData(selectedPatient)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Dados
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedPatient);
                  }}
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
