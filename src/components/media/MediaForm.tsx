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
import { Upload } from "lucide-react";

interface MediaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media?: any;
}

export function MediaForm({ open, onOpenChange, media }: MediaFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "",
    file_url: "",
    tags: "",
    procedure_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    if (media) {
      setFormData({
        title: media.title || "",
        description: media.description || "",
        media_type: media.media_type || "",
        file_url: media.file_url || "",
        tags: media.tags ? media.tags.join(", ") : "",
        procedure_id: media.procedure_id || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        media_type: "",
        file_url: "",
        tags: "",
        procedure_id: "",
      });
    }
    setSelectedFile(null);
  }, [media, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type based on media_type
      const validTypes: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        pdf: ['application/pdf'],
      };

      const mediaType = formData.media_type;
      if (mediaType && validTypes[mediaType]) {
        if (!validTypes[mediaType].includes(file.type)) {
          toast.error(`Por favor, selecione um arquivo do tipo ${mediaType.toUpperCase()}`);
          return;
        }
      }

      setSelectedFile(file);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return formData.file_url;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${formData.media_type}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload do arquivo");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !media?.id && !formData.file_url) {
      toast.error("Por favor, selecione um arquivo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload file if there's a new file selected
      const uploadedUrl = await uploadFile();
      if (selectedFile && !uploadedUrl) {
        setIsSubmitting(false);
        return;
      }

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const dataToSave = {
        title: formData.title,
        description: formData.description || null,
        media_type: formData.media_type,
        file_url: uploadedUrl || formData.file_url || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        procedure_id: formData.procedure_id || null,
      };

      if (media?.id) {
        const { error } = await supabase
          .from("media")
          .update(dataToSave)
          .eq("id", media.id);

        if (error) throw error;
        toast.success("Mídia atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("media").insert([dataToSave]);

        if (error) throw error;
        toast.success("Mídia cadastrada com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["media"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar mídia");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {media ? "Editar Mídia" : "Nova Mídia"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento *</Label>
              <Select
                value={formData.procedure_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, procedure_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures?.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Vídeo demonstrativo do procedimento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media_type">Tipo de Mídia *</Label>
              <Select
                value={formData.media_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, media_type: value });
                  setSelectedFile(null);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    formData.media_type === "image"
                      ? "image/*"
                      : formData.media_type === "video"
                      ? "video/*"
                      : formData.media_type === "pdf"
                      ? "application/pdf"
                      : "*"
                  }
                  className="flex-1"
                  disabled={!formData.media_type}
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
              {media?.file_url && !selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Arquivo atual:{" "}
                  <a
                    href={media.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Ver arquivo
                  </a>
                </p>
              )}
              {!formData.media_type && (
                <p className="text-xs text-muted-foreground">
                  Selecione o tipo de mídia primeiro
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o conteúdo da mídia..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="Ex: antes-depois, tutorial, cuidados (separar por vírgula)"
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
              disabled={isSubmitting || isUploading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-golden"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Enviando arquivo...
                </>
              ) : isSubmitting ? (
                "Salvando..."
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
