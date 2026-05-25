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
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role_id: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
