import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stage {
  id: string;
  name: string;
  order_position: number;
  color: string;
}

interface StageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: Stage[];
}

export function StageDialog({ open, onOpenChange, stages }: StageDialogProps) {
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");
  const queryClient = useQueryClient();

  const addStageMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = Math.max(...stages.map((s) => s.order_position), 0);
      const { error } = await supabase.from("kanban_stages").insert({
        name: newStageName,
        order_position: maxOrder + 1,
        color: newStageColor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
      toast.success("Etapa adicionada!");
      setNewStageName("");
      setNewStageColor("#3b82f6");
    },
    onError: () => {
      toast.error("Erro ao adicionar etapa");
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from("kanban_stages")
        .delete()
        .eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Etapa excluída!");
    },
    onError: () => {
      toast.error("Erro ao excluir etapa");
    },
  });

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) {
      toast.error("Nome da etapa é obrigatório");
      return;
    }
    addStageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas do Kanban</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Etapas Existentes</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="flex-1">{stage.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStageMutation.mutate(stage.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Adicionar Nova Etapa</h3>
            <form onSubmit={handleAddStage} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="stageName">Nome da Etapa</Label>
                  <Input
                    id="stageName"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Ex: Proposta Enviada"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="stageColor">Cor</Label>
                  <Input
                    id="stageColor"
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={addStageMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Etapa
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
