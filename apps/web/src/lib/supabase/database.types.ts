export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CollegeStatus = "pending" | "approved" | "rejected";
export type ListingKind = "lost" | "found";
export type ListingStatus =
  | "open"
  | "possible_match"
  | "claimed"
  | "return_pending"
  | "returned"
  | "closed";
export type ClaimStatus = "pending" | "accepted" | "rejected";

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
      item_attributes: {
        Row: { created_at: string; id: string; key: string; listing_id: string; value: string };
        Insert: { created_at?: string; id?: string; key: string; listing_id: string; value: string };
        Update: { key?: string; listing_id?: string; value?: string };
        Relationships: [];
      };
      listing_images: {
        Row: { created_at: string; id: string; listing_id: string; position: number; storage_path: string };
        Insert: { created_at?: string; id?: string; listing_id: string; position?: number; storage_path: string };
        Update: { listing_id?: string; position?: number; storage_path?: string };
        Relationships: [];
      };
      listings: {
        Row: {
          brand: string | null; category: string; colour: string | null; created_at: string;
          description: string; event_date: string; exact_lat: number | null; exact_lng: number | null;
          id: string; kind: ListingKind; model: string | null; poster_id: string;
          search_document: unknown; status: ListingStatus; title: string; updated_at: string; zone_id: string | null;
        };
        Insert: {
          brand?: string | null; category: string; colour?: string | null; created_at?: string;
          description: string; event_date: string; exact_lat?: number | null; exact_lng?: number | null;
          id?: string; kind: ListingKind; model?: string | null; poster_id: string;
          status?: ListingStatus; title: string; updated_at?: string; zone_id?: string | null;
        };
        Update: {
          brand?: string | null; category?: string; colour?: string | null; description?: string;
          event_date?: string; exact_lat?: number | null; exact_lng?: number | null; kind?: ListingKind;
          model?: string | null; title?: string; zone_id?: string | null;
        };
        Relationships: [];
      };
      match_suggestions: {
        Row: { id: string; lost_listing_id: string; found_listing_id: string; score: number; dismissed_by_lost_poster: boolean; dismissed_by_found_poster: boolean; created_at: string };
        Insert: { id?: string; lost_listing_id: string; found_listing_id: string; score: number; dismissed_by_lost_poster?: boolean; dismissed_by_found_poster?: boolean; created_at?: string };
        Update: { dismissed_by_lost_poster?: boolean; dismissed_by_found_poster?: boolean };
        Relationships: [];
      };
      claims: {
        Row: { id: string; listing_id: string; claimant_id: string; status: ClaimStatus; created_at: string; decided_at: string | null };
        Insert: { id?: string; listing_id: string; claimant_id: string; status?: ClaimStatus; created_at?: string; decided_at?: string | null };
        Update: { status?: ClaimStatus; decided_at?: string | null };
        Relationships: [];
      };
      proof_questions: {
        Row: { id: string; listing_id: string; question: string; position: number };
        Insert: { id?: string; listing_id: string; question: string; position?: number };
        Update: { question?: string; position?: number };
        Relationships: [];
      };
      proof_answers: {
        Row: { id: string; claim_id: string; proof_question_id: string; answer: string; created_at: string };
        Insert: { id?: string; claim_id: string; proof_question_id: string; answer: string; created_at?: string };
        Update: Record<string, never>;
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
    Views: {
      listings_public: {
        Row: {
          brand: string | null; category: string | null; colour: string | null; created_at: string | null;
          description: string | null; event_date: string | null; id: string | null; kind: ListingKind | null;
          model: string | null; poster_id: string | null; search_document: unknown; status: ListingStatus | null;
          title: string | null; updated_at: string | null; zone_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Functions: {
      can_join_college: {
        Args: { target_college_id: string | null };
        Returns: boolean;
      };
      current_user_is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_view_listing: {
        Args: { p_poster_id: string; p_viewer_id: string };
        Returns: boolean;
      };
      close_listing: {
        Args: { p_listing_id: string };
        Returns: ListingStatus;
      };
      get_listing_exact_location: {
        Args: { p_listing_id: string };
        Returns: { exact_lat: number | null; exact_lng: number | null }[];
      };
      get_proof_questions_for_claim: {
        Args: { p_listing_id: string };
        Returns: { question_id: string; question: string; sort_position: number }[];
      };
      create_claim_with_answers: {
        Args: { p_listing_id: string; p_answers: Json };
        Returns: string;
      };
      decide_claim: {
        Args: { p_claim_id: string; p_accept: boolean };
        Returns: ClaimStatus;
      };
      dismiss_match: { Args: { p_match_id: string }; Returns: undefined; };
      start_conversation: { Args: { p_listing_id: string; p_other_user_id: string }; Returns: string; };
      confirm_handover: { Args: { p_claim_id: string }; Returns: ListingStatus; };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined; };
      request_college: {
        Args: { requested_name: string };
        Returns: string;
      };
      review_college: {
        Args: { p_college_id: string; p_approve: boolean; p_publicly_discoverable?: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      college_status: CollegeStatus;
      listing_kind: ListingKind;
      listing_status: ListingStatus;
      claim_status: ClaimStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
