import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExamRequirement {
  gender: 'male' | 'female' | 'other' | 'all';
  age_min?: number;
  age_max?: number;
  conditions?: string[];
  exams: string[];
}

// Função simples para gerar HTML que pode ser convertido em PDF
function generatePdfHtml(data: {
  patientName: string;
  patientCpf: string;
  patientAge: number | null;
  patientPhone: string | null;
  procedureName: string;
  exams: string[];
}): string {
  const examsList = data.exams.length > 0
    ? data.exams.map((exam, idx) => `<li>${idx + 1}. ${exam}</li>`).join('')
    : '<li>Nenhum exame necessário para este perfil.</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .info { margin: 10px 0; }
    .info strong { color: #333; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px; margin: 5px 0; background: #f5f5f5; border-left: 3px solid #666; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Requisição de Exames</h1>
  
  <h2>Dados do Paciente</h2>
  <div class="info"><strong>Nome:</strong> ${data.patientName}</div>
  <div class="info"><strong>CPF:</strong> ${data.patientCpf || 'Não informado'}</div>
  ${data.patientAge !== null ? `<div class="info"><strong>Idade:</strong> ${data.patientAge} anos</div>` : ''}
  ${data.patientPhone ? `<div class="info"><strong>Telefone:</strong> ${data.patientPhone}</div>` : ''}
  
  <h2>Procedimento</h2>
  <div class="info">${data.procedureName}</div>
  
  <h2>Exames Necessários</h2>
  <ul>
    ${examsList}
  </ul>
  
  <div class="footer">
    Gerado em: ${new Date().toLocaleString('pt-BR')}
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cpf, procedure_id, gender, conditions } = await req.json();

    if (!cpf || !procedure_id) {
      return new Response(
        JSON.stringify({ error: 'CPF e ID do procedimento são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando paciente com CPF:', cpf);

    // Buscar paciente pelo CPF
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (patientError || !patient) {
      console.error('Erro ao buscar paciente:', patientError);
      return new Response(
        JSON.stringify({ error: 'Paciente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Paciente encontrado:', patient.name);

    // Calcular idade
    let age = null;
    if (patient.birth_date) {
      const birthDate = new Date(patient.birth_date);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    console.log('Idade calculada:', age);

    // Buscar procedimento
    const { data: procedure, error: procedureError } = await supabase
      .from('procedures')
      .select('*')
      .eq('id', procedure_id)
      .single();

    if (procedureError || !procedure) {
      console.error('Erro ao buscar procedimento:', procedureError);
      return new Response(
        JSON.stringify({ error: 'Procedimento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Procedimento encontrado:', procedure.name);

    // Filtrar exam_requirements
    const examRequirements: ExamRequirement[] = procedure.exam_requirements || [];
    const patientGender = gender || 'all';
    const patientConditions = conditions || [];

    console.log('Total de grupos de requisitos:', examRequirements.length);

    const applicableExams = new Set<string>();

    examRequirements.forEach((req) => {
      // Verificar gênero
      if (req.gender !== 'all' && req.gender !== patientGender) {
        return;
      }

      // Verificar idade
      if (age !== null) {
        if (req.age_min !== undefined && age < req.age_min) {
          return;
        }
        if (req.age_max !== undefined && age > req.age_max) {
          return;
        }
      }

      // Verificar condições (se o requisito tem condições, o paciente deve ter pelo menos uma delas)
      if (req.conditions && req.conditions.length > 0) {
        const hasCondition = req.conditions.some(c => patientConditions.includes(c));
        if (!hasCondition) {
          return;
        }
      }

      // Adicionar exames
      req.exams.forEach(exam => applicableExams.add(exam));
    });

    const examArray = Array.from(applicableExams);
    console.log('Exames aplicáveis:', examArray);

    // Gerar HTML
    const htmlContent = generatePdfHtml({
      patientName: patient.name,
      patientCpf: patient.cpf,
      patientAge: age,
      patientPhone: patient.phone,
      procedureName: procedure.name,
      exams: examArray
    });

    // Converter HTML para base64
    const htmlBase64 = btoa(unescape(encodeURIComponent(htmlContent)));

    console.log('HTML gerado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        html_base64: htmlBase64,
        patient_name: patient.name,
        procedure_name: procedure.name,
        exam_count: examArray.length,
        exams: examArray
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
