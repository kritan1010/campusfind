export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CollegeStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      campus_zones: {
        Row: {
          centroid_lat: number | null;
          centroid_lng: number | null;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      colleges: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          publicly_discoverable: boolean;
          requested_by: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: CollegeStatus;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          publicly_discoverable?: boolean;
          requested_by?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: CollegeStatus;
          updated_at?: string;
        };
        Update: {
          name?: string;
          publicly_discoverable?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: CollegeStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          college_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_admin: boolean;
          onboarding_completed_at: string | null;
          show_independent_posts: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          college_id?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          is_admin?: boolean;
          onboarding_completed_at?: string | null;
          show_independent_posts?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          college_id?: string | null;
          display_name?: string;
          onboarding_completed_at?: string | null;
          show_independent_posts?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_join_college: {
        Args: { target_college_id: string | null };
        Returns: boolean;
      };
      current_user_is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      request_college: {
        Args: { requested_name: string };
        Returns: string;
      };
    };
    Enums: {
      college_status: CollegeStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
