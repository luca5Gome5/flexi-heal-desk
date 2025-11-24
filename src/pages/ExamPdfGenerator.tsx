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
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          Integração com N8N - Passo a Passo Completo
        </h3>
        
        <div className="space-y-6 text-sm">
          {/* Passo 1 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-base text-foreground">📋 Passo 1: Entendendo o Conceito</h4>
            <p className="text-muted-foreground">
              Vamos configurar uma <strong>Tool (Ferramenta)</strong> no agente de IA do N8N. 
              Uma Tool permite que o agente de IA chame nossa API de geração de PDF automaticamente quando necessário.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">🔧 Passo 2: Criar a Tool no N8N</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
              <li>No N8N, adicione um node <strong>"AI Agent"</strong> ao seu workflow</li>
              <li>Dentro do AI Agent, adicione um node <strong>"HTTP Request Tool"</strong></li>
              <li>Configure o HTTP Request Tool com as informações abaixo:</li>
            </ol>
          </div>

          {/* Configuração da Tool */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">⚙️ Passo 3: Configuração da Tool</h4>
            
            <div className="bg-background p-4 rounded-lg space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Nome da Tool:</p>
                <code className="block bg-muted p-2 rounded text-xs">generate_exam_pdf</code>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Descrição da Tool:</p>
                <code className="block bg-muted p-2 rounded text-xs">
                  Gera um PDF com requisição de exames médicos para um paciente baseado no CPF e procedimento. 
                  Retorna HTML que pode ser convertido em PDF.
                </code>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">URL:</p>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  https://cvsaltjweqqkwalmjvcs.supabase.co/functions/v1/generate-exam-pdf
                </code>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Método HTTP:</p>
                <code className="block bg-muted p-2 rounded text-xs">POST</code>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">Headers:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Content-Type: application/json`}
                </pre>
              </div>
            </div>
          </div>

          {/* Schema da Tool */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">📝 Passo 4: Schema da Tool (JSON Schema)</h4>
            <p className="text-muted-foreground">
              Cole este schema na seção "Input Schema" do HTTP Request Tool:
            </p>
            <pre className="bg-background p-4 rounded text-xs overflow-x-auto border">
{`{
  "type": "object",
  "properties": {
    "cpf": {
      "type": "string",
      "description": "CPF do paciente (apenas números, sem formatação)"
    },
    "procedure_id": {
      "type": "string",
      "description": "UUID do procedimento médico"
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "other"],
      "description": "Gênero do paciente (opcional)"
    },
    "conditions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de condições médicas adicionais (opcional)"
    }
  },
  "required": ["cpf", "procedure_id"]
}`}
            </pre>
          </div>

          {/* Exemplo de uso */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">💬 Passo 5: Como o Agente Vai Usar</h4>
            <p className="text-muted-foreground">
              Agora o agente de IA pode gerar PDFs automaticamente! Exemplos de comandos:
            </p>
            <div className="bg-background p-4 rounded space-y-2">
              <p className="text-xs text-muted-foreground">• "Gere o PDF de exames para o CPF 12345678900 do procedimento de mamografia"</p>
              <p className="text-xs text-muted-foreground">• "Preciso dos exames pré-operatórios para a paciente CPF 98765432100"</p>
              <p className="text-xs text-muted-foreground">• "Crie a requisição de exames para procedimento X do paciente Y"</p>
            </div>
          </div>

          {/* Resposta da API */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">📤 Passo 6: Resposta da API</h4>
            <p className="text-muted-foreground">A Tool retorna este formato:</p>
            <pre className="bg-background p-4 rounded text-xs overflow-x-auto border">
{`{
  "success": true,
  "html": "<html>...conteúdo completo...</html>",
  "html_base64": "PGh0bWw+Li4uPC9odG1sPg==",
  "patient_name": "João da Silva",
  "procedure_name": "Mamografia Bilateral",
  "exam_count": 3,
  "exams": [
    "Hemograma Completo",
    "Glicemia em Jejum", 
    "Ureia e Creatinina"
  ]
}`}
            </pre>
          </div>

          {/* Converter HTML em PDF */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">📄 Passo 7: Converter HTML em PDF</h4>
            <p className="text-muted-foreground">
              Após o agente chamar a Tool, você precisa converter o HTML em PDF. Opções:
            </p>
            
            <div className="bg-background p-4 rounded-lg space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">Opção 1: Node "HTML to Image/PDF" (N8N)</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>Adicione um node "Convert to File"</li>
                  <li>Selecione "HTML to PDF"</li>
                  <li>No campo HTML, use: <code className="bg-muted px-1 rounded">{`{{ $json.html }}`}</code></li>
                  <li>Configure opções de PDF (tamanho A4, margens, etc.)</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-foreground mb-2">Opção 2: API Externa (Exemplo: HTML2PDF.app)</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                  <li>Adicione um node "HTTP Request"</li>
                  <li>POST para <code className="bg-muted px-1 rounded">https://api.html2pdf.app/v1/generate</code></li>
                  <li>Body: <code className="bg-muted px-1 rounded">{`{ "html": "{{ $json.html }}" }`}</code></li>
                  <li>Receba o PDF em binário</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-foreground mb-2">Opção 3: Usar o HTML Base64 diretamente</p>
                <p className="text-xs text-muted-foreground">
                  O campo <code className="bg-muted px-1 rounded">html_base64</code> já vem pronto para ser usado em sistemas que aceitam HTML codificado.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Completo */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">🔄 Passo 8: Exemplo de Workflow Completo</h4>
            <div className="bg-background p-4 rounded-lg">
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`1. [Trigger] Chat Message / Webhook
   ↓
2. [AI Agent] com Tool "generate_exam_pdf"
   ↓
3. [IF] Tool foi chamada?
   ↓ Sim
4. [Convert] HTML to PDF
   ↓
5. [Send] Enviar PDF para paciente/sistema
   - Por email (Gmail, SendGrid)
   - Por WhatsApp (Evolution API, Twilio)
   - Salvar no Google Drive / Dropbox
   - Upload no prontuário eletrônico`}
              </pre>
            </div>
          </div>

          {/* Dicas importantes */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground">💡 Dicas Importantes</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>O CPF deve ser enviado <strong>apenas com números</strong> (sem pontos, hífen ou espaços)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>O <code className="bg-muted px-1 rounded text-xs">procedure_id</code> é o UUID do procedimento cadastrado no sistema</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Os campos <code className="bg-muted px-1 rounded text-xs">gender</code> e <code className="bg-muted px-1 rounded text-xs">conditions</code> são opcionais</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>A API já filtra os exames baseado no perfil do paciente (idade, gênero, condições)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Esta API é pública (não requer autenticação) para facilitar integração com N8N</span>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>✅ Tudo pronto!</strong> Agora seu agente de IA pode gerar PDFs de exames automaticamente 
              quando solicitado pelos usuários, sem intervenção manual.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
