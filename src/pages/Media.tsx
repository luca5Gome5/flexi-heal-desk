import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Image as ImageIcon, Edit, Trash2, FileText, Video, File } from "lucide-react";
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

export default function Media() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
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

  const filteredMedia = mediaList?.filter((media) =>
    media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case "document":
        return "Documento";
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar mídias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg border-border focus-visible:ring-accent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando mídias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMedia && filteredMedia.length > 0 ? (
            filteredMedia.map((media) => (
              <Card key={media.id} className="p-6 card-elevated hover:shadow-golden">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getMediaIcon(media.media_type)}
                        <h3 className="font-semibold text-lg text-foreground">
                          {media.title}
                        </h3>
                      </div>
                      {media.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {media.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="secondary" className="bg-secondary/50">
                        {getMediaTypeLabel(media.media_type)}
                      </Badge>
                    </div>

                    {media.procedures && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Procedimento:</span>
                        <Badge variant="outline" className="border-accent text-accent">
                          {media.procedures.name}
                        </Badge>
                      </div>
                    )}

                    {media.tags && media.tags.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {media.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-secondary/30"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {media.file_url && (
                      <div className="text-sm">
                        <a
                          href={media.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline truncate block"
                        >
                          Ver arquivo
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(media)}
                      className="flex-1 border-accent text-accent hover:bg-accent/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(media.id)}
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
