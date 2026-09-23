export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          auth_user_id: string
          created_at: string
          id: string
          last_sign_in_at: string | null
          role: Database["public"]["Enums"]["account_role"]
          status: Database["public"]["Enums"]["account_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          updated_at: string
          version: number
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          auth_user_id: string
          created_at?: string
          id?: string
          last_sign_in_at?: string | null
          role: Database["public"]["Enums"]["account_role"]
          status?: Database["public"]["Enums"]["account_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          auth_user_id?: string
          created_at?: string
          id?: string
          last_sign_in_at?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          status?: Database["public"]["Enums"]["account_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_account_id: string | null
          actor_type: string
          entity_id: string
          entity_type: string
          id: string
          metadata_safe: Json
          new_state: string | null
          occurred_at: string
          previous_state: string | null
          reason_code: string | null
          reason_text: string | null
          request_id: string
        }
        Insert: {
          action: string
          actor_account_id?: string | null
          actor_type: string
          entity_id: string
          entity_type: string
          id?: string
          metadata_safe?: Json
          new_state?: string | null
          occurred_at?: string
          previous_state?: string | null
          reason_code?: string | null
          reason_text?: string | null
          request_id?: string
        }
        Update: {
          action?: string
          actor_account_id?: string | null
          actor_type?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata_safe?: Json
          new_state?: string | null
          occurred_at?: string
          previous_state?: string | null
          reason_code?: string | null
          reason_text?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_account_id_fkey"
            columns: ["actor_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_categories: {
        Row: {
          candidate_id: string
          category_id: string
          created_at: string
          kind: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          category_id: string
          created_at?: string
          kind: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          category_id?: string
          created_at?: string
          kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_categories_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_consents: {
        Row: {
          candidate_id: string
          id: string
          policy_hash: string
          policy_version: string
          recorded_at: string
          recorded_by: string
          source: string
          status: Database["public"]["Enums"]["consent_status"]
        }
        Insert: {
          candidate_id: string
          id?: string
          policy_hash: string
          policy_version: string
          recorded_at?: string
          recorded_by: string
          source: string
          status: Database["public"]["Enums"]["consent_status"]
        }
        Update: {
          candidate_id?: string
          id?: string
          policy_hash?: string
          policy_version?: string
          recorded_at?: string
          recorded_by?: string
          source?: string
          status?: Database["public"]["Enums"]["consent_status"]
        }
        Relationships: [
          {
            foreignKeyName: "candidate_consents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_consents_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_contacts: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          candidate_id: string
          created_at: string
          id: string
          is_primary: boolean
          kind: string
          normalized_value: string
          updated_at: string
          value: string
          verified_at: string | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          candidate_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          kind: string
          normalized_value: string
          updated_at?: string
          value: string
          verified_at?: string | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          candidate_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: string
          normalized_value?: string
          updated_at?: string
          value?: string
          verified_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_contacts_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_contacts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_private_data: {
        Row: {
          address: string | null
          candidate_id: string
          created_at: string
          dni_display: string
          dni_normalized: string
          updated_at: string
          version: number
        }
        Insert: {
          address?: string | null
          candidate_id: string
          created_at?: string
          dni_display: string
          dni_normalized: string
          updated_at?: string
          version?: number
        }
        Update: {
          address?: string | null
          candidate_id?: string
          created_at?: string
          dni_display?: string
          dni_normalized?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_private_data_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          account_id: string | null
          activated_at: string | null
          archived_at: string | null
          archived_by: string | null
          availability: string | null
          availability_detail: string | null
          created_at: string
          display_name: string
          id: string
          last_confirmed_at: string | null
          locality: string | null
          managed_by_admin_id: string | null
          origin: string
          refresh_due_at: string | null
          skills_experience_summary: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
          version: number
        }
        Insert: {
          account_id?: string | null
          activated_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          availability?: string | null
          availability_detail?: string | null
          created_at?: string
          display_name: string
          id?: string
          last_confirmed_at?: string | null
          locality?: string | null
          managed_by_admin_id?: string | null
          origin: string
          refresh_due_at?: string | null
          skills_experience_summary?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string | null
          activated_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          availability?: string | null
          availability_detail?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_confirmed_at?: string | null
          locality?: string | null
          managed_by_admin_id?: string | null
          origin?: string
          refresh_due_at?: string | null
          skills_experience_summary?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_managed_by_admin_id_fkey"
            columns: ["managed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_feedback: {
        Row: {
          id: string
          message: string | null
          referral_id: string
          reported_at: string
          reported_by: string
          reported_outcome: string
          review_status: string
        }
        Insert: {
          id?: string
          message?: string | null
          referral_id: string
          reported_at?: string
          reported_by: string
          reported_outcome: string
          review_status?: string
        }
        Update: {
          id?: string
          message?: string | null
          referral_id?: string
          reported_at?: string
          reported_by?: string
          reported_outcome?: string
          review_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_feedback_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_feedback_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_interviews: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          company_message: string | null
          created_at: string
          held_at: string | null
          id: string
          internal_note: string | null
          recorded_by: string
          referral_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          company_message?: string | null
          created_at?: string
          held_at?: string | null
          id?: string
          internal_note?: string | null
          recorded_by: string
          referral_id: string
          scheduled_at?: string | null
          status: string
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          company_message?: string | null
          created_at?: string
          held_at?: string | null
          id?: string
          internal_note?: string | null
          recorded_by?: string
          referral_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_interviews_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_interviews_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_interviews_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          account_id: string
          activity: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          cuit_display: string | null
          cuit_normalized: string | null
          email: string | null
          id: string
          legal_name: string | null
          locality: string | null
          phone: string | null
          responsible_name: string | null
          status: Database["public"]["Enums"]["company_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          activity?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          cuit_display?: string | null
          cuit_normalized?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          phone?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          activity?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          cuit_display?: string | null
          cuit_normalized?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          phone?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_events: {
        Row: {
          candidate_id: string | null
          channel: string
          company_id: string | null
          created_at: string
          direction: string
          id: string
          next_action_at: string | null
          occurred_at: string
          opening_id: string | null
          participation_id: string | null
          recorded_by: string
          summary_internal: string
        }
        Insert: {
          candidate_id?: string | null
          channel: string
          company_id?: string | null
          created_at?: string
          direction: string
          id?: string
          next_action_at?: string | null
          occurred_at: string
          opening_id?: string | null
          participation_id?: string | null
          recorded_by: string
          summary_internal: string
        }
        Update: {
          candidate_id?: string | null
          channel?: string
          company_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          next_action_at?: string | null
          occurred_at?: string
          opening_id?: string | null
          participation_id?: string | null
          recorded_by?: string
          summary_internal?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_documents: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          byte_size: number
          candidate_id: string
          created_at: string
          id: string
          mime_type: string
          original_name_safe: string
          sha256: string
          status: Database["public"]["Enums"]["cv_status"]
          storage_path: string
          superseded_at: string | null
          updated_at: string
          uploaded_by: string
          validation_result: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          byte_size: number
          candidate_id: string
          created_at?: string
          id?: string
          mime_type: string
          original_name_safe: string
          sha256: string
          status: Database["public"]["Enums"]["cv_status"]
          storage_path: string
          superseded_at?: string | null
          updated_at?: string
          uploaded_by: string
          validation_result: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          byte_size?: number
          candidate_id?: string
          created_at?: string
          id?: string
          mime_type?: string
          original_name_safe?: string
          sha256?: string
          status?: Database["public"]["Enums"]["cv_status"]
          storage_path?: string
          superseded_at?: string | null
          updated_at?: string
          uploaded_by?: string
          validation_result?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cv_documents_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_reviews: {
        Row: {
          created_at: string
          decision: string | null
          id: string
          match_basis: string
          matched_candidate_id: string
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          source_id: string
          source_type: string
          status: string
          version: number
        }
        Insert: {
          created_at?: string
          decision?: string | null
          id?: string
          match_basis: string
          matched_candidate_id: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_id: string
          source_type: string
          status?: string
          version?: number
        }
        Update: {
          created_at?: string
          decision?: string | null
          id?: string
          match_basis?: string
          matched_candidate_id?: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_id?: string
          source_type?: string
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_reviews_matched_candidate_id_fkey"
            columns: ["matched_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_reviews_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          duplicate_rows: number
          failure_code: string | null
          file_sha256: string
          id: string
          invalid_rows: number
          mapping_version: string | null
          retry_of_batch_id: string | null
          source_reference_safe: string | null
          status: Database["public"]["Enums"]["import_status"]
          total_rows: number
          updated_at: string
          valid_rows: number
          version: number
          warning_rows: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          duplicate_rows?: number
          failure_code?: string | null
          file_sha256: string
          id?: string
          invalid_rows?: number
          mapping_version?: string | null
          retry_of_batch_id?: string | null
          source_reference_safe?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          total_rows?: number
          updated_at?: string
          valid_rows?: number
          version?: number
          warning_rows?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          duplicate_rows?: number
          failure_code?: string | null
          file_sha256?: string
          id?: string
          invalid_rows?: number
          mapping_version?: string | null
          retry_of_batch_id?: string | null
          source_reference_safe?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          total_rows?: number
          updated_at?: string
          valid_rows?: number
          version?: number
          warning_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_retry_of_batch_id_fkey"
            columns: ["retry_of_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          batch_id: string
          created_at: string
          created_candidate_id: string | null
          error_codes: string[]
          id: string
          matched_candidate_id: string | null
          normalized_payload: Json
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
          version: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_candidate_id?: string | null
          error_codes?: string[]
          id?: string
          matched_candidate_id?: string | null
          normalized_payload?: Json
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
          version?: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_candidate_id?: string | null
          error_codes?: string[]
          id?: string
          matched_candidate_id?: string | null
          normalized_payload?: Json
          row_number?: number
          status?: Database["public"]["Enums"]["import_row_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_created_candidate_id_fkey"
            columns: ["created_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_matched_candidate_id_fkey"
            columns: ["matched_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          archived_at: string | null
          body: string
          candidate_id: string | null
          created_at: string
          created_by: string
          id: string
          note_kind: string
          participation_id: string | null
          supersedes_note_id: string | null
        }
        Insert: {
          archived_at?: string | null
          body: string
          candidate_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          note_kind: string
          participation_id?: string | null
          supersedes_note_id?: string | null
        }
        Update: {
          archived_at?: string | null
          body?: string
          candidate_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          note_kind?: string
          participation_id?: string | null
          supersedes_note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_supersedes_note_id_fkey"
            columns: ["supersedes_note_id"]
            isOneToOne: false
            referencedRelation: "internal_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          version: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          benefits: string | null
          closed_at: string | null
          closing_date: string | null
          company_id: string
          contract_type: string | null
          created_at: string
          id: string
          location: string | null
          modality: string | null
          moderation_message_public: string | null
          published_at: string | null
          requirements: string | null
          salary: string | null
          schedule: string | null
          status: Database["public"]["Enums"]["opening_status"]
          tasks: string | null
          title: string | null
          updated_at: string
          vacancies: number | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          closed_at?: string | null
          closing_date?: string | null
          company_id: string
          contract_type?: string | null
          created_at?: string
          id?: string
          location?: string | null
          modality?: string | null
          moderation_message_public?: string | null
          published_at?: string | null
          requirements?: string | null
          salary?: string | null
          schedule?: string | null
          status?: Database["public"]["Enums"]["opening_status"]
          tasks?: string | null
          title?: string | null
          updated_at?: string
          vacancies?: number | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          closed_at?: string | null
          closing_date?: string | null
          company_id?: string
          contract_type?: string | null
          created_at?: string
          id?: string
          location?: string | null
          modality?: string | null
          moderation_message_public?: string | null
          published_at?: string | null
          requirements?: string | null
          salary?: string | null
          schedule?: string | null
          status?: Database["public"]["Enums"]["opening_status"]
          tasks?: string | null
          title?: string | null
          updated_at?: string
          vacancies?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_categories: {
        Row: {
          category_id: string
          created_at: string
          opening_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          opening_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          opening_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_categories_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_moderation_events: {
        Row: {
          actor_account_id: string | null
          actor_type: string
          company_message: string | null
          created_at: string
          decision: string
          id: string
          internal_reason: string | null
          new_status: Database["public"]["Enums"]["opening_status"]
          opening_id: string
          previous_status: Database["public"]["Enums"]["opening_status"] | null
        }
        Insert: {
          actor_account_id?: string | null
          actor_type: string
          company_message?: string | null
          created_at?: string
          decision: string
          id?: string
          internal_reason?: string | null
          new_status: Database["public"]["Enums"]["opening_status"]
          opening_id: string
          previous_status?: Database["public"]["Enums"]["opening_status"] | null
        }
        Update: {
          actor_account_id?: string | null
          actor_type?: string
          company_message?: string | null
          created_at?: string
          decision?: string
          id?: string
          internal_reason?: string | null
          new_status?: Database["public"]["Enums"]["opening_status"]
          opening_id?: string
          previous_status?: Database["public"]["Enums"]["opening_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_moderation_events_actor_account_id_fkey"
            columns: ["actor_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_moderation_events_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          candidate_id: string
          created_at: string
          created_by: string
          feedback_due_at: string | null
          final_outcome_at: string | null
          final_outcome_by: string | null
          id: string
          opening_id: string
          origin: string
          status: Database["public"]["Enums"]["participation_status"]
          updated_at: string
          version: number
          withdrawal_reason: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          candidate_id: string
          created_at?: string
          created_by: string
          feedback_due_at?: string | null
          final_outcome_at?: string | null
          final_outcome_by?: string | null
          id?: string
          opening_id: string
          origin: string
          status: Database["public"]["Enums"]["participation_status"]
          updated_at?: string
          version?: number
          withdrawal_reason?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string
          feedback_due_at?: string | null
          final_outcome_at?: string | null
          final_outcome_by?: string | null
          id?: string
          opening_id?: string
          origin?: string
          status?: Database["public"]["Enums"]["participation_status"]
          updated_at?: string
          version?: number
          withdrawal_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participations_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_final_outcome_by_fkey"
            columns: ["final_outcome_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      preinterviews: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          channel: string
          created_at: string
          held_at: string | null
          id: string
          participation_id: string
          recommendation: string
          recorded_by: string
          scheduled_at: string | null
          summary_internal: string | null
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          channel: string
          created_at?: string
          held_at?: string | null
          id?: string
          participation_id: string
          recommendation?: string
          recorded_by: string
          scheduled_at?: string | null
          summary_internal?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          channel?: string
          created_at?: string
          held_at?: string | null
          id?: string
          participation_id?: string
          recommendation?: string
          recorded_by?: string
          scheduled_at?: string | null
          summary_internal?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "preinterviews_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preinterviews_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preinterviews_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          access_change_reason: string
          access_changed_actor_type: string
          access_changed_at: string
          access_changed_by_account_id: string | null
          access_status: Database["public"]["Enums"]["referral_access_status"]
          archived_at: string | null
          archived_by: string | null
          candidate_id: string
          consent_event_id: string
          created_at: string
          cv_document_id: string
          feedback_due_at: string
          id: string
          participation_id: string
          post_hire_access_until: string | null
          referred_at: string
          referred_by: string
          updated_at: string
          version: number
        }
        Insert: {
          access_change_reason: string
          access_changed_actor_type: string
          access_changed_at?: string
          access_changed_by_account_id?: string | null
          access_status?: Database["public"]["Enums"]["referral_access_status"]
          archived_at?: string | null
          archived_by?: string | null
          candidate_id: string
          consent_event_id: string
          created_at?: string
          cv_document_id: string
          feedback_due_at: string
          id?: string
          participation_id: string
          post_hire_access_until?: string | null
          referred_at?: string
          referred_by: string
          updated_at?: string
          version?: number
        }
        Update: {
          access_change_reason?: string
          access_changed_actor_type?: string
          access_changed_at?: string
          access_changed_by_account_id?: string | null
          access_status?: Database["public"]["Enums"]["referral_access_status"]
          archived_at?: string | null
          archived_by?: string | null
          candidate_id?: string
          consent_event_id?: string
          created_at?: string
          cv_document_id?: string
          feedback_due_at?: string
          id?: string
          participation_id?: string
          post_hire_access_until?: string | null
          referred_at?: string
          referred_by?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_access_changed_by_account_id_fkey"
            columns: ["access_changed_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_consent_event_id_candidate_id_fkey"
            columns: ["consent_event_id", "candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_consents"
            referencedColumns: ["id", "candidate_id"]
          },
          {
            foreignKeyName: "referrals_consent_event_id_fkey"
            columns: ["consent_event_id"]
            isOneToOne: false
            referencedRelation: "candidate_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_cv_document_id_candidate_id_fkey"
            columns: ["cv_document_id", "candidate_id"]
            isOneToOne: false
            referencedRelation: "cv_documents"
            referencedColumns: ["id", "candidate_id"]
          },
          {
            foreignKeyName: "referrals_cv_document_id_fkey"
            columns: ["cv_document_id"]
            isOneToOne: false
            referencedRelation: "cv_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_participation_id_candidate_id_fkey"
            columns: ["participation_id", "candidate_id"]
            isOneToOne: false
            referencedRelation: "participations"
            referencedColumns: ["id", "candidate_id"]
          },
          {
            foreignKeyName: "referrals_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: true
            referencedRelation: "participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
        admin_workflow_timeline: {
          Args: { p_entity_type: string; p_entity_id: string }
          Returns: {
            event_id: string
            action: string
            previous_state: string | null
            new_state: string | null
            actor_type: string
            actor_account_id: string | null
            occurred_at: string
            reason_code: string | null
            reason: string | null
          }[]
        }
        authorized_cv_path: {
          Args: { p_cv: string }
          Returns: string
        }
      change_account_status: {
        Args: {
          p_account: string
          p_command: string
          p_confirmed: boolean
          p_reason: string
          p_version: number
        }
        Returns: number
      }
        company_referral: {
          Args: { p_referral: string }
          Returns: Json
        }
        company_referral_references: {
          Args: { p_opening: string }
          Returns: {
            referral_id: string
            opening_id: string
            opening_title: string | null
            referred_at: string
          }[]
        }
        create_participation: {
          Args: {
            p_candidate: string
            p_candidate_version: number
            p_opening: string
            p_opening_version: number
            p_origin: string
          }
          Returns: string
        }
      my_account_status: {
        Args: never
        Returns: {
          id: string
          role: Database["public"]["Enums"]["account_role"]
          status: Database["public"]["Enums"]["account_status"]
          version: number
        }[]
      }
        record_contact: {
          Args: {
            p_participation: string
            p_expected_version: number
            p_channel: string
            p_direction: string
            p_occurred_at: string
            p_summary: string
            p_next_action_at?: string | null
          }
          Returns: number
        }
        record_internal_note: {
          Args: {
            p_candidate: string
            p_expected_version: number
            p_participation: string | null
            p_kind: string
            p_body: string
            p_supersedes?: string | null
          }
          Returns: string
        }
        record_preinterview: {
          Args: {
            p_participation: string
            p_expected_version: number
            p_channel: string
            p_scheduled_at: string | null
            p_held_at: string | null
            p_summary: string
            p_recommendation: string
            p_skip_reason?: string | null
          }
          Returns: number
        }
      reserve_administrator_invitation: {
        Args: { p_actor: string; p_email: string }
        Returns: string
      }
        submit_company_feedback: {
          Args: {
            p_referral: string
            p_reported_outcome: string
            p_message?: string | null
          }
          Returns: string
        }
        submit_company_interview: {
          Args: {
            p_referral: string
            p_expected_version: number
            p_status: string
            p_scheduled_at: string | null
            p_held_at: string | null
            p_company_message?: string | null
          }
          Returns: string
        }
        transition_opening: {
          Args: {
            p_opening: string
            p_expected_version: number
            p_command: string
            p_reason?: string | null
            p_company_message?: string | null
          }
          Returns: number
        }
        transition_participation: {
          Args: {
            p_participation: string
            p_expected_version: number
            p_command: string
            p_reason?: string | null
            p_candidate_request?: string | null
            p_feedback?: string | null
            p_contact?: string | null
          }
          Returns: number
        }
    }
    Enums: {
      account_role: "candidate" | "company" | "admin"
      account_status:
        | "pending_verification"
        | "active"
        | "suspended"
        | "archived"
      candidate_status:
        | "draft"
        | "active"
        | "needs_update"
        | "unavailable"
        | "consent_withdrawn"
        | "archived"
      company_status: "incomplete" | "active" | "suspended" | "archived"
      consent_status: "accepted" | "withdrawn"
      cv_status: "valid" | "superseded" | "rejected" | "archived"
      import_row_status:
        | "valid"
        | "warning"
        | "invalid"
        | "potential_duplicate"
        | "unmapped_category"
        | "imported"
      import_status:
        | "uploaded"
        | "preview_ready"
        | "blocked"
        | "confirming"
        | "completed"
        | "failed"
        | "archived"
      opening_status:
        | "draft"
        | "pending_review"
        | "changes_requested"
        | "published"
        | "paused"
        | "closed"
        | "rejected"
        | "cancelled"
        | "suspended"
      participation_status:
        | "received"
        | "under_review"
        | "preinterview"
        | "preselected"
        | "referred"
        | "company_interview"
        | "awaiting_feedback"
        | "hired"
        | "not_selected"
        | "withdrawn"
        | "cancelled"
        | "no_company_response"
      referral_access_status: "active" | "revoked" | "expired_by_policy"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_role: ["candidate", "company", "admin"],
      account_status: [
        "pending_verification",
        "active",
        "suspended",
        "archived",
      ],
      candidate_status: [
        "draft",
        "active",
        "needs_update",
        "unavailable",
        "consent_withdrawn",
        "archived",
      ],
      company_status: ["incomplete", "active", "suspended", "archived"],
      consent_status: ["accepted", "withdrawn"],
      cv_status: ["valid", "superseded", "rejected", "archived"],
      import_row_status: [
        "valid",
        "warning",
        "invalid",
        "potential_duplicate",
        "unmapped_category",
        "imported",
      ],
      import_status: [
        "uploaded",
        "preview_ready",
        "blocked",
        "confirming",
        "completed",
        "failed",
        "archived",
      ],
      opening_status: [
        "draft",
        "pending_review",
        "changes_requested",
        "published",
        "paused",
        "closed",
        "rejected",
        "cancelled",
        "suspended",
      ],
      participation_status: [
        "received",
        "under_review",
        "preinterview",
        "preselected",
        "referred",
        "company_interview",
        "awaiting_feedback",
        "hired",
        "not_selected",
        "withdrawn",
        "cancelled",
        "no_company_response",
      ],
      referral_access_status: ["active", "revoked", "expired_by_policy"],
    },
  },
} as const
