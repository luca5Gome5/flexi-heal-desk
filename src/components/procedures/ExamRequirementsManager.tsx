import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2, Users, Calendar } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

export interface ExamRequirement {
  id: string;
  gender: "male" | "female" | "other" | "all";
  age_min: number | null;
  age_max: number | null;
  conditions: string[];
  exams: string[];
}

interface ExamRequirementsManagerProps {
  requirements: ExamRequirement[];
  onChange: (requirements: ExamRequirement[]) => void;
}

const genderLabels = {
  all: "Todos",
  male: "Masculino",
  female: "Feminino",
  other: "Outros",
};

export function ExamRequirementsManager({ requirements, onChange }: ExamRequirementsManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addRequirement = () => {
    const newReq: ExamRequirement = {
      id: uuidv4(),
      gender: "all",
      age_min: null,
      age_max: null,
      conditions: [],
      exams: [],
    };
    onChange([...requirements, newReq]);
    setExpandedId(newReq.id);
  };

  const removeRequirement = (id: string) => {
    onChange(requirements.filter((r) => r.id !== id));
  };

  const updateRequirement = (id: string, updates: Partial<ExamRequirement>) => {
    onChange(
      requirements.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const addExam = (id: string, exam: string) => {
    const req = requirements.find((r) => r.id === id);
    if (req && exam.trim() && !req.exams.includes(exam.trim())) {
      updateRequirement(id, { exams: [...req.exams, exam.trim()] });
    }
  };

  const removeExam = (id: string, exam: string) => {
    const req = requirements.find((r) => r.id === id);
    if (req) {
      updateRequirement(id, { exams: req.exams.filter((e) => e !== exam) });
    }
  };

  const addCondition = (id: string, condition: string) => {
    const req = requirements.find((r) => r.id === id);
    if (req && condition.trim() && !req.conditions.includes(condition.trim())) {
      updateRequirement(id, { conditions: [...req.conditions, condition.trim()] });
    }
  };

  const removeCondition = (id: string, condition: string) => {
    const req = requirements.find((r) => r.id === id);
    if (req) {
      updateRequirement(id, { conditions: req.conditions.filter((c) => c !== condition) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Requisitos de Exames por Perfil</Label>
        <Button
          type="button"
          onClick={addRequirement}
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Grupo
        </Button>
      </div>

      {requirements.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Nenhum grupo de requisitos adicionado. Clique em "Adicionar Grupo" para começar.
        </p>
      )}

      <div className="space-y-3">
        {requirements.map((req, index) => (
          <Card key={req.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span className="font-medium text-sm">Grupo {index + 1}</span>
                <Badge variant="secondary" className="text-xs">
                  {genderLabels[req.gender]}
                </Badge>
                {(req.age_min || req.age_max) && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {req.age_min || 0} - {req.age_max || "∞"} anos
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                >
                  {expandedId === req.id ? "Recolher" : "Expandir"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRequirement(req.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedId === req.id && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select
                      value={req.gender}
                      onValueChange={(value: any) => updateRequirement(req.id, { gender: value })}
                    >
                      <SelectTrigger className="rounded-lg border-border">
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

                  <div className="space-y-2">
                    <Label>Idade Mínima</Label>
                    <Input
                      type="number"
                      min={0}
                      value={req.age_min || ""}
                      onChange={(e) =>
                        updateRequirement(req.id, {
                          age_min: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Ex: 18"
                      className="rounded-lg border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Idade Máxima</Label>
                    <Input
                      type="number"
                      min={0}
                      value={req.age_max || ""}
                      onChange={(e) =>
                        updateRequirement(req.id, {
                          age_max: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Ex: 45"
                      className="rounded-lg border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Condições Adicionais</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Atividade sexual"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCondition(req.id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="rounded-lg border-border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input) {
                          addCondition(req.id, input.value);
                          input.value = "";
                        }
                      }}
                      className="border-accent text-accent hover:bg-accent/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {req.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-secondary/30">
                      {req.conditions.map((condition) => (
                        <Badge
                          key={condition}
                          variant="secondary"
                          className="gap-1 bg-primary/10 text-primary"
                        >
                          {condition}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeCondition(req.id, condition)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Exames Necessários</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Hemograma completo"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addExam(req.id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="rounded-lg border-border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input) {
                          addExam(req.id, input.value);
                          input.value = "";
                        }
                      }}
                      className="border-accent text-accent hover:bg-accent/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {req.exams.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-secondary/30">
                      {req.exams.map((exam) => (
                        <Badge
                          key={exam}
                          variant="secondary"
                          className="gap-1 bg-accent/10 text-accent"
                        >
                          {exam}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeExam(req.id, exam)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
