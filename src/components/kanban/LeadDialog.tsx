import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  notes: string | null;
}

interface Stage {
  id: string;
  name: string;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  stages: Stage[];
}

export function LeadDialog({ open, onOpenChange, lead, stages }: LeadDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    stage_id: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        stage_id: lead.stage_id || (stages[0]?.id || ""),
        notes: lead.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        stage_id: stages[0]?.id || "",
        notes: "",
      });
    }
  }, [lead, stages, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        stage_id: formData.stage_id || null,
        notes: formData.notes || null,
      };

      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update(dataToSave)
          .eq("id", lead.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(dataToSave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(lead ? "Lead atualizado!" : "Lead criado!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao salvar lead");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stage">Etapa</Label>
            <Select
              value={formData.stage_id}
              onValueChange={(value) => setFormData({ ...formData, stage_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
