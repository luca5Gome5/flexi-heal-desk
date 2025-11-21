import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ExamPdfGenerator() {
  const [cpf, setCpf] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [gender, setGender] = useState("all");
  const [conditions, setConditions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<{
    html: string;
    patient_name: string;
    procedure_name: string;
    exam_count: number;
    exams: string[];
  } | null>(null);

  const { data: procedures } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .eq("status", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleGeneratePdf = async () => {
    if (!cpf || !procedureId) {
      toast.error("Por favor, preencha o CPF e selecione um procedimento");
      return;
    }

    setIsGenerating(true);

    try {
      const conditionsArray = conditions
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const { data, error } = await supabase.functions.invoke("generate-exam-pdf", {
        body: {
          cpf: cpf.replace(/\D/g, ""),
          procedure_id: procedureId,
          gender: gender !== "all" ? gender : undefined,
          conditions: conditionsArray.length > 0 ? conditionsArray : undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        setLastGeneratedPdf(data);
        toast.success(`PDF gerado com ${data.exam_count} exame(s)`);
      } else {
        throw new Error(data.error || "Erro ao gerar PDF");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!lastGeneratedPdf) return;

    // Criar um blob com o HTML e abrir para impressão/salvar como PDF
    const blob = new Blob([lastGeneratedPdf.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Gerar PDF de Exames</h1>
        <p className="text-muted-foreground">
          Gere requisições de exames personalizadas para pacientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Dados para Geração
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf">CPF do Paciente *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="procedure">Procedimento *</Label>
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures?.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gender">Gênero (opcional)</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conditions">Condições Adicionais (opcional)</Label>
              <Input
                id="conditions"
                type="text"
                placeholder="Ex: atividade sexual, hipertensão (separado por vírgula)"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separe múltiplas condições por vírgula
              </p>
            </div>

            <Button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </Card>

        {lastGeneratedPdf && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              PDF Gerado
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Paciente</Label>
                <p className="font-medium">{lastGeneratedPdf.patient_name}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Procedimento</Label>
                <p className="font-medium">{lastGeneratedPdf.procedure_name}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Exames Necessários</Label>
                <Badge variant="secondary" className="mt-1">
                  {lastGeneratedPdf.exam_count} exame(s)
                </Badge>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Lista de Exames</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {lastGeneratedPdf.exams.map((exam, idx) => (
                    <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                      {idx + 1}. {exam}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleDownloadPdf} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Imprimir/Salvar PDF
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">Integração com N8N</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>URL da Edge Function:</strong></p>
          <code className="block bg-background p-2 rounded text-xs">
            https://cvsaltjweqqkwalmjvcs.supabase.co/functions/v1/generate-exam-pdf
          </code>
          
          <p className="mt-4"><strong>Corpo da requisição (JSON):</strong></p>
          <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "cpf": "12345678900",
  "procedure_id": "uuid-do-procedimento",
  "gender": "female", // opcional: male, female, other
  "conditions": ["atividade sexual"] // opcional
}`}
          </pre>

          <p className="mt-4"><strong>Resposta de sucesso:</strong></p>
          <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "html": "html-content",
  "html_base64": "base64-encoded-html",
  "patient_name": "Nome do Paciente",
  "procedure_name": "Nome do Procedimento",
  "exam_count": 5,
  "exams": ["Exame 1", "Exame 2", ...]
}`}
          </pre>
          
          <p className="mt-4"><strong>Nota:</strong> O HTML retornado pode ser convertido em PDF usando ferramentas como Puppeteer, wkhtmltopdf, ou serviços online de conversão HTML para PDF no N8N.</p>
        </div>
      </Card>
    </div>
  );
}
