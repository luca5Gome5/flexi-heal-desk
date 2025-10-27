import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MessageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: any;
}

export function MessageForm({ open, onOpenChange, message }: MessageFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message_body: "",
    channel: "",
    tags: "",
    procedure_id: "",
  });

  const { data: procedures } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("id, name")
        .eq("status", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (message) {
      setFormData({
        title: message.title || "",
        message_body: message.message_body || "",
        channel: message.channel || "",
        tags: message.tags ? message.tags.join(", ") : "",
        procedure_id: message.procedure_id || "",
      });
    } else {
      setFormData({
        title: "",
        message_body: "",
        channel: "",
        tags: "",
        procedure_id: "",
      });
    }
  }, [message, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const dataToSave = {
        title: formData.title,
        message_body: formData.message_body,
        channel: formData.channel || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        procedure_id: formData.procedure_id || null,
      };

      if (message?.id) {
        const { error } = await supabase
          .from("message_templates")
          .update(dataToSave)
          .eq("id", message.id);

        if (error) throw error;
        toast.success("Mensagem atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("message_templates").insert([dataToSave]);

        if (error) throw error;
        toast.success("Mensagem cadastrada com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar mensagem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {message ? "Editar Mensagem" : "Nova Mensagem"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Confirmação de Agendamento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento (Opcional)</Label>
              <Select
                value={formData.procedure_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, procedure_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (mensagem geral)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (mensagem geral)</SelectItem>
                  {procedures?.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para mensagens que não são específicas de um procedimento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Canal de Envio</Label>
              <Select
                value={formData.channel || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, channel: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_body">Mensagem *</Label>
              <Textarea
                id="message_body"
                value={formData.message_body}
                onChange={(e) =>
                  setFormData({ ...formData, message_body: e.target.value })
                }
                placeholder="Digite o conteúdo da mensagem..."
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Você pode usar variáveis como: {"{nome}"}, {"{data}"}, {"{hora}"}, {"{procedimento}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="Ex: confirmacao, lembrete, pos-procedimento (separar por vírgula)"
              />
              <p className="text-xs text-muted-foreground">
                Separe as tags com vírgula
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
