import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MessageSquare, Edit, Trash2, Mail, X } from "lucide-react";
import { MessageForm } from "@/components/messages/MessageForm";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Messages() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProcedure, setFilterProcedure] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [messageToView, setMessageToView] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const { data: messageTemplates, isLoading } = useQuery({
    queryKey: ["message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select(`
          *,
          procedures (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: procedures } = useQuery({
    queryKey: ["procedures-filter"],
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

  const filteredMessages = messageTemplates?.filter((message) => {
    const matchesSearch =
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message_body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProcedure =
      filterProcedure === "all" ||
      (filterProcedure === "none" && !message.procedure_id) ||
      message.procedure_id === filterProcedure;

    const matchesChannel =
      filterChannel === "all" ||
      (filterChannel === "none" && !message.channel) ||
      message.channel === filterChannel;

    return matchesSearch && matchesProcedure && matchesChannel;
  });

  const handleView = (message: any) => {
    setMessageToView(message);
    setViewDialogOpen(true);
  };

  const handleEdit = (message: any) => {
    setSelectedMessage(message);
    setIsFormOpen(true);
  };

  const handleNewMessage = () => {
    setSelectedMessage(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", messageToDelete);

      if (error) throw error;

      toast.success("Mensagem excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir mensagem");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedMessage(null);
    }
  };

  const getChannelLabel = (channel: string | null) => {
    if (!channel) return "Não especificado";
    switch (channel) {
      case "whatsapp":
        return "WhatsApp";
      case "sms":
        return "SMS";
      case "email":
        return "E-mail";
      default:
        return channel;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mensagens</h1>
          <p className="text-muted-foreground">
            Gerencie os templates de mensagens de atendimento
          </p>
        </div>
        <Button
          onClick={handleNewMessage}
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Mensagem
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar mensagens por título ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-lg border-border focus-visible:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Filtrar por Procedimento
              </label>
              <Select value={filterProcedure} onValueChange={setFilterProcedure}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="none">Mensagens gerais (sem procedimento)</SelectItem>
                  {procedures?.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Filtrar por Canal
              </label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="none">Não especificado</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filterProcedure !== "all" || filterChannel !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterProcedure("all");
                setFilterChannel("all");
              }}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMessages && filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className="p-6 card-elevated hover:shadow-golden cursor-pointer transition-all"
                onClick={() => handleView(message)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-lg text-foreground">
                          {message.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.message_body}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {message.channel && (
                      <Badge variant="secondary" className="bg-secondary/50">
                        <Mail className="h-3 w-3 mr-1" />
                        {getChannelLabel(message.channel)}
                      </Badge>
                    )}
                    {message.procedures && (
                      <Badge variant="outline" className="border-accent text-accent">
                        {message.procedures.name}
                      </Badge>
                    )}
                    {!message.procedure_id && (
                      <Badge variant="outline">Mensagem Geral</Badge>
                    )}
                  </div>

                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-secondary/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div
                    className="flex gap-2 pt-2 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(message);
                      }}
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(message.id);
                      }}
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
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg mb-2">
                Nenhuma mensagem encontrada
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterProcedure !== "all" || filterChannel !== "all"
                  ? "Tente ajustar sua busca ou filtros"
                  : "Comece cadastrando o primeiro template de mensagem"}
              </p>
              {!searchTerm && filterProcedure === "all" && filterChannel === "all" && (
                <Button
                  onClick={handleNewMessage}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Mensagem
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <MessageForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        message={selectedMessage}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {messageToView?.title}
            </DialogTitle>
          </DialogHeader>

          {messageToView && (
            <div className="space-y-6">
              <div className="space-y-4">
                {messageToView.channel && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Canal de Envio
                    </label>
                    <p className="text-foreground">{getChannelLabel(messageToView.channel)}</p>
                  </div>
                )}

                {messageToView.procedures ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Procedimento
                    </label>
                    <p className="text-foreground">{messageToView.procedures.name}</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo
                    </label>
                    <p className="text-foreground">Mensagem Geral (sem procedimento específico)</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Mensagem
                  </label>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">
                      {messageToView.message_body}
                    </p>
                  </div>
                </div>

                {messageToView.tags && messageToView.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {messageToView.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template de mensagem? Esta ação não pode ser
              desfeita.
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
