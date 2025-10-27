export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string | null
          doctor_id: string | null
          end_time: string
          id: string
          is_procedure: boolean | null
          notes: string | null
          patient_id: string | null
          procedure_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          doctor_id?: string | null
          end_time: string
          id?: string
          is_procedure?: boolean | null
          notes?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          doctor_id?: string | null
          end_time?: string
          id?: string
          is_procedure?: boolean | null
          notes?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_units: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_units_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string | null
          default_unit_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          professional_id: string
          specialty: string
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_unit_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          professional_id: string
          specialty: string
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_unit_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          professional_id?: string
          specialty?: string
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          media_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          media_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          media_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          message_body: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message_body: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          message_body?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          insurance: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      procedure_availability: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          procedure_id: string | null
          start_time: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          procedure_id?: string | null
          start_time: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          procedure_id?: string | null
          start_time?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_availability_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_availability_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_card: number | null
          price_fixed: number | null
          price_per_ml: number | null
          required_exams: string[] | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_card?: number | null
          price_fixed?: number | null
          price_per_ml?: number | null
          required_exams?: string[] | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_card?: number | null
          price_fixed?: number | null
          price_per_ml?: number | null
          required_exams?: string[] | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string
          city: string | null
          cnpj: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          status: boolean | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          status?: boolean | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          status?: boolean | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  },
} as const
