export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          company_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          plan_id: string | null;
          name: string;
          slug: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id?: string | null;
          name: string;
          slug: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string | null;
          name?: string;
          slug?: string;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_feature_overrides: {
        Row: {
          id: string;
          company_id: string;
          feature_id: string;
          enabled: boolean;
          reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          feature_id: string;
          enabled: boolean;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
          reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role_id: string;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role_id: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
          status?: string;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_invitations: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          role: string;
          token: string;
          status: string;
          invited_by: string | null;
          expires_at: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          role: string;
          token: string;
          status?: string;
          invited_by?: string | null;
          expires_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          role?: string;
          token?: string;
          status?: string;
          invited_by?: string | null;
          expires_at?: string | null;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
      daily_work_entries: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          project_id: string;
          work_date: string;
          hours: number;
          overtime_hours: number;
          expense_amount: number;
          expense_description: string | null;
          work_description: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          project_id: string;
          work_date: string;
          hours?: number;
          overtime_hours?: number;
          expense_amount?: number;
          expense_description?: string | null;
          work_description?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          employee_id?: string;
          project_id?: string;
          work_date?: string;
          hours?: number;
          overtime_hours?: number;
          expense_amount?: number;
          expense_description?: string | null;
          work_description?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_payments: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          payment_date: string;
          amount: number;
          payment_method: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          payment_date: string;
          amount: number;
          payment_method: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          employee_id?: string;
          payment_date?: string;
          amount?: number;
          payment_method?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_benefits: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          month_key: string;
          benefit_type: string;
          amount: number;
          benefit_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          month_key: string;
          benefit_type: string;
          amount: number;
          benefit_date: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_id?: string;
          month_key?: string;
          benefit_type?: string;
          amount?: number;
          benefit_date?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_ika: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          ika_amount: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          employee_id: string;
          ika_amount: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          employee_id?: string;
          ika_amount?: number;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          expense_date: string;
          scope: string;
          category: string;
          description: string | null;
          amount: number;
          allocation_method: string;
          allocation_status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          expense_date: string;
          scope: string;
          category: string;
          description?: string | null;
          amount: number;
          allocation_method: string;
          allocation_status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          expense_date?: string;
          scope?: string;
          category?: string;
          description?: string | null;
          amount?: number;
          allocation_method?: string;
          allocation_status?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          employee_type: string;
          daily_rate: number | null;
          hourly_rate: number | null;
          overtime_rate: number | null;
          active: boolean;
          notes: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          full_name: string;
          employee_type?: string;
          daily_rate?: number | null;
          hourly_rate?: number | null;
          overtime_rate?: number | null;
          active?: boolean;
          notes?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          employee_type?: string;
          daily_rate?: number | null;
          hourly_rate?: number | null;
          overtime_rate?: number | null;
          active?: boolean;
          notes?: string | null;
          status?: string;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_project_contracts: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          project_id: string;
          contract_amount: number;
          notes: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          project_id: string;
          contract_amount?: number;
          notes?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_id?: string;
          project_id?: string;
          contract_amount?: number;
          notes?: string | null;
          status?: string;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      features: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_features: {
        Row: {
          id: string;
          plan_id: string;
          feature_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          feature_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      monthly_periods: {
        Row: {
          id: string;
          company_id: string;
          month_key: string;
          starts_on: string;
          ends_on: string;
          is_locked: boolean;
          status: string;
          locked_at: string | null;
          locked_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_key: string;
          starts_on: string;
          ends_on: string;
          is_locked?: boolean;
          status?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_key?: string;
          starts_on?: string;
          ends_on?: string;
          is_locked?: boolean;
          status?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          project_id: string;
          supplier_id: string | null;
          invoice_date: string;
          supplier_name: string;
          supplier_vat: string | null;
          invoice_number: string;
          description: string | null;
          net_amount: number;
          vat_amount: number;
          total_amount: number;
          payment_status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          project_id: string;
          supplier_id?: string | null;
          invoice_date: string;
          supplier_name: string;
          supplier_vat?: string | null;
          invoice_number: string;
          description?: string | null;
          net_amount?: number;
          vat_amount?: number;
          total_amount?: number;
          payment_status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          project_id?: string;
          supplier_id?: string | null;
          invoice_date?: string;
          supplier_name?: string;
          supplier_vat?: string | null;
          invoice_number?: string;
          description?: string | null;
          net_amount?: number;
          vat_amount?: number;
          total_amount?: number;
          payment_status?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          tax_id: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          tax_id: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          tax_id?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          active?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name: string;
          client_name: string | null;
          location: string | null;
          status: string;
          budget_amount: number | null;
          offer_date: string | null;
          start_date: string | null;
          end_date: string | null;
          cancellation_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name: string;
          client_name?: string | null;
          location?: string | null;
          status?: string;
          budget_amount?: number | null;
          offer_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cancellation_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          client_name?: string | null;
          location?: string | null;
          status?: string;
          budget_amount?: number | null;
          offer_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cancellation_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_quotes: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          quote_number: string;
          version: number;
          quote_type: string;
          title: string;
          description: string | null;
          amount: number;
          vat_amount: number;
          total_amount: number;
          quote_date: string;
          status: string;
          rejection_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          project_id: string;
          quote_number: string;
          version?: number;
          quote_type?: string;
          title: string;
          description?: string | null;
          amount?: number;
          vat_amount?: number;
          total_amount?: number;
          quote_date?: string;
          status?: string;
          rejection_reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quote_number?: string;
          version?: number;
          quote_type?: string;
          title?: string;
          description?: string | null;
          amount?: number;
          vat_amount?: number;
          total_amount?: number;
          quote_date?: string;
          status?: string;
          rejection_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      revenues: {
        Row: {
          id: string;
          company_id: string;
          month_id: string;
          project_id: string;
          revenue_date: string;
          client_name: string;
          invoice_number: string | null;
          revenue_type: string;
          invoiced_amount: number;
          received_amount: number;
          remaining_amount: number;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          month_id: string;
          project_id: string;
          revenue_date: string;
          client_name: string;
          invoice_number?: string | null;
          revenue_type: string;
          invoiced_amount?: number;
          received_amount?: number;
          remaining_amount?: number;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month_id?: string;
          project_id?: string;
          revenue_date?: string;
          client_name?: string;
          invoice_number?: string | null;
          revenue_type?: string;
          invoiced_amount?: number;
          received_amount?: number;
          remaining_amount?: number;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_company_for_current_user: {
        Args: {
          company_name: string;
          company_slug: string;
        };
        Returns: string;
      };
      accept_company_invitation: {
        Args: {
          invite_token: string;
        };
        Returns: string;
      };
      create_company_invitation: {
        Args: {
          target_company_id: string;
          invite_email: string;
          invite_role: string;
          invite_token: string;
          invite_expires_at: string;
        };
        Returns: {
          id: string;
          token: string;
          expires_at: string;
        }[];
      };
      disable_company_member: {
        Args: {
          target_membership_id: string;
        };
        Returns: undefined;
      };
      list_company_members: {
        Args: {
          target_company_id: string;
        };
        Returns: {
          membership_id: string;
          user_id: string;
          email: string | null;
          role: string;
          status: string;
          created_at: string;
        }[];
      };
      update_company_member_role: {
        Args: {
          target_membership_id: string;
          next_role: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
