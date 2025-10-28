import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { LeadCard } from "@/components/kanban/LeadCard";
import { LeadDialog } from "@/components/kanban/LeadDialog";
import { StageDialog } from "@/components/kanban/StageDialog";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  notes: string | null;
  created_at: string;
}

interface Stage {
  id: string;
  name: string;
  order_position: number;
  color: string;
}

export default function Kanban() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["kanban-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_stages")
        .select("*")
        .order("order_position");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ stage_id: stageId })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead movido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao mover lead");
    },
  });

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (draggedLead && draggedLead.stage_id !== stageId) {
      moveLeadMutation.mutate({ leadId: draggedLead.id, stageId });
    }
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage_id === stageId);
  };

  const handleAddLead = () => {
    setSelectedLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(true);
  };

  if (stagesLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kanban de Leads</h1>
          <p className="text-muted-foreground">Gerencie seus leads por etapas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsStageDialogOpen(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Etapas
          </Button>
          <Button onClick={handleAddLead}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-card rounded-lg border shadow-sm"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <div
              className="p-4 border-b"
              style={{ borderTopColor: stage.color, borderTopWidth: "4px" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{stage.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {getLeadsByStage(stage.id).length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {getLeadsByStage(stage.id).map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onDragStart={() => handleDragStart(lead)}
                  onEdit={() => handleEditLead(lead)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <LeadDialog
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        lead={selectedLead}
        stages={stages}
      />

      <StageDialog
        open={isStageDialogOpen}
        onOpenChange={setIsStageDialogOpen}
        stages={stages}
      />
    </div>
  );
}
