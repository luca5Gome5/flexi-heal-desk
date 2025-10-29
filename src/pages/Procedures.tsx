import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Syringe, Edit, Trash2, Clock, FileText } from "lucide-react";
import { ProcedureForm } from "@/components/procedures/ProcedureForm";
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

export default function Procedures() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<string | null>(null);

  const { data: procedures, isLoading } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data: proceduresData, error } = await supabase
        .from("procedures")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return proceduresData || [];
    },
  });

  const filteredProcedures = procedures?.filter((procedure) =>
    procedure.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (procedure: any) => {
    setSelectedProcedure(procedure);
    setIsFormOpen(true);
  };

  const handleNewProcedure = () => {
    setSelectedProcedure(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (procedureId: string) => {
    setProcedureToDelete(procedureId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!procedureToDelete) return;

    try {
      const { error } = await supabase.from("procedures").delete().eq("id", procedureToDelete);

      if (error) throw error;

      toast.success("Procedimento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir procedimento");
    } finally {
      setDeleteDialogOpen(false);
      setProcedureToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedProcedure(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos médicos</p>
        </div>
        <Button
          onClick={handleNewProcedure}
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar procedimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg border-border focus-visible:ring-accent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando procedimentos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProcedures && filteredProcedures.length > 0 ? (
            filteredProcedures.map((procedure) => (
              <Card key={procedure.id} className="p-6 card-elevated hover:shadow-golden">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Syringe className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-lg text-foreground">
                          {procedure.name}
                        </h3>
                      </div>
                      {procedure.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {procedure.description.length > 150
                            ? `${procedure.description.substring(0, 150)}...`
                            : procedure.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          procedure.status
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {procedure.status ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {procedure.duration_minutes}{" "}
                        {procedure.duration_unit === "hours" ? "hora(s)" : "minuto(s)"}
                      </span>
                    </div>

                    {procedure.required_exams && procedure.required_exams.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Exames Necessários:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-6">
                          {procedure.required_exams.map((exam: string) => (
                            <Badge
                              key={exam}
                              variant="secondary"
                              className="text-xs bg-secondary/50"
                            >
                              {exam}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(procedure)}
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(procedure.id)}
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
              <Syringe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg mb-2">Nenhum procedimento encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando o primeiro procedimento"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleNewProcedure}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Procedimento
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <ProcedureForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        procedure={selectedProcedure}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita e
              pode afetar agendamentos relacionados.
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
