import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Image as ImageIcon, Edit, Trash2, FileText, Video, File, X, ExternalLink } from "lucide-react";
import { MediaForm } from "@/components/media/MediaForm";
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

export default function Media() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProcedure, setFilterProcedure] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [mediaToView, setMediaToView] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  const { data: mediaList, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data: mediaData, error } = await supabase
        .from("media")
        .select(`
          *,
          procedures (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return mediaData || [];
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

  const filteredMedia = mediaList?.filter((media) => {
    const matchesSearch =
      media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProcedure =
      filterProcedure === "all" || media.procedure_id === filterProcedure;

    const matchesType = filterType === "all" || media.media_type === filterType;

    return matchesSearch && matchesProcedure && matchesType;
  });

  const handleView = (media: any) => {
    setMediaToView(media);
    setViewDialogOpen(true);
  };

  const handleEdit = (media: any) => {
    setSelectedMedia(media);
    setIsFormOpen(true);
  };

  const handleNewMedia = () => {
    setSelectedMedia(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (mediaId: string) => {
    setMediaToDelete(mediaId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return;

    try {
      const { error } = await supabase.from("media").delete().eq("id", mediaToDelete);

      if (error) throw error;

      toast.success("Mídia excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["media"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir mídia");
    } finally {
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedMedia(null);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-accent" />;
      case "video":
        return <Video className="h-5 w-5 text-accent" />;
      case "document":
        return <FileText className="h-5 w-5 text-accent" />;
      default:
        return <File className="h-5 w-5 text-accent" />;
    }
  };

  const getMediaTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case "image":
        return "Imagem";
      case "video":
        return "Vídeo";
      case "pdf":
        return "PDF";
      default:
        return "Outro";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mídias</h1>
          <p className="text-muted-foreground">Gerencie as mídias dos procedimentos</p>
        </div>
        <Button
          onClick={handleNewMedia}
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Mídia
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar mídias por título..."
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
                  <SelectValue placeholder="Todos os procedimentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os procedimentos</SelectItem>
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
                Filtrar por Tipo
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filterProcedure !== "all" || filterType !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterProcedure("all");
                setFilterType("all");
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
          <p className="text-muted-foreground">Carregando mídias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredMedia && filteredMedia.length > 0 ? (
            filteredMedia.map((media) => (
              <Card
                key={media.id}
                className="group overflow-hidden card-elevated hover:shadow-golden cursor-pointer transition-all"
                onClick={() => handleView(media)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {media.media_type === "image" && media.file_url && (
                    <img
                      src={media.file_url}
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  {media.media_type === "video" && media.file_url && (
                    <video
                      src={media.file_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  {media.media_type === "pdf" && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
                      <FileText className="h-20 w-20 text-accent/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {getMediaTypeLabel(media.media_type)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {media.title}
                  </h3>
                  {media.procedures && (
                    <Badge variant="outline" className="border-accent text-accent">
                      {media.procedures.name}
                    </Badge>
                  )}
                </div>

                <div
                  className="px-4 pb-4 flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(media);
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
                      handleDeleteClick(media.id);
                    }}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg mb-2">Nenhuma mídia encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando a primeira mídia"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleNewMedia}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Mídia
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <MediaForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        media={selectedMedia}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {mediaToView?.title}
            </DialogTitle>
          </DialogHeader>

          {mediaToView && (
            <div className="space-y-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {mediaToView.media_type === "image" && mediaToView.file_url && (
                  <img
                    src={mediaToView.file_url}
                    alt={mediaToView.title}
                    className="w-full h-full object-contain"
                  />
                )}
                {mediaToView.media_type === "video" && mediaToView.file_url && (
                  <video
                    src={mediaToView.file_url}
                    controls
                    className="w-full h-full"
                  />
                )}
                {mediaToView.media_type === "pdf" && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <FileText className="h-32 w-32 text-accent/50" />
                    <Button
                      onClick={() => window.open(mediaToView.file_url, "_blank")}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir PDF
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo
                  </label>
                  <p className="text-foreground">
                    {getMediaTypeLabel(mediaToView.media_type)}
                  </p>
                </div>

                {mediaToView.procedures && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Procedimento
                    </label>
                    <p className="text-foreground">{mediaToView.procedures.name}</p>
                  </div>
                )}

                {mediaToView.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Descrição
                    </label>
                    <p className="text-foreground">{mediaToView.description}</p>
                  </div>
                )}

                {mediaToView.tags && mediaToView.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {mediaToView.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mediaToView.file_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Arquivo
                    </label>
                    <a
                      href={mediaToView.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-2 mt-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver arquivo original
                    </a>
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
              Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.
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
