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
          start_date: string | null;
          end_date: string | null;
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
          start_date?: string | null;
          end_date?: string | null;
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
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
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
