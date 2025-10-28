import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface LeadCardProps {
  lead: Lead;
  onDragStart: () => void;
  onEdit: () => void;
}

export function LeadCard({ lead, onDragStart, onEdit }: LeadCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir lead");
    },
  });

  return (
    <Card
      className="p-4 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{lead.name}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteMutation.mutate()}
              className="text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {lead.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Phone className="h-3 w-3" />
          <span>{lead.phone}</span>
        </div>
      )}
      {lead.notes && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {lead.notes}
        </p>
      )}
    </Card>
  );
}
