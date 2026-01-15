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
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            audit_log: {
                Row: {
                    action: string
                    created_at: string | null
                    id: string
                    ip_address: unknown
                    new_data: Json | null
                    old_data: Json | null
                    record_id: string
                    table_name: string
                    user_agent: string | null
                    user_email: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    id?: string
                    ip_address?: unknown
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id: string
                    table_name: string
                    user_agent?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    id?: string
                    ip_address?: unknown
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id?: string
                    table_name?: string
                    user_agent?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    created_at: string
                    date: string
                    email: string
                    id: string
                    message: string | null
                    name: string
                    phone: string
                    status: string
                    time: string
                    type: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    date: string
                    email: string
                    id?: string
                    message?: string | null
                    name: string
                    phone: string
                    status?: string
                    time: string
                    type: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    date?: string
                    email?: string
                    id?: string
                    message?: string | null
                    name?: string
                    phone?: string
                    status?: string
                    time?: string
                    type?: string
                    updated_at?: string
                }
                Relationships: []
            }
            clients: {
                Row: {
                    company: string | null
                    created_at: string
                    email: string
                    id: string
                    last_booking: string | null
                    name: string
                    phone: string
                    total_bookings: number
                    updated_at: string
                }
                Insert: {
                    company?: string | null
                    created_at?: string
                    email: string
                    id?: string
                    last_booking?: string | null
                    name: string
                    phone: string
                    total_bookings?: number
                    updated_at?: string
                }
                Update: {
                    company?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    last_booking?: string | null
                    name?: string
                    phone?: string
                    total_bookings?: number
                    updated_at?: string
                }
                Relationships: []
            }
            portfolio: {
                Row: {
                    category: string
                    client_name: string | null
                    created_at: string
                    description: string | null
                    id: string
                    image_url: string | null
                    tags: string[] | null
                    thumbnail_url: string | null
                    title: string
                    updated_at: string
                    video_url: string | null
                }
                Insert: {
                    category: string
                    client_name?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    tags?: string[] | null
                    thumbnail_url?: string | null
                    title: string
                    updated_at?: string
                    video_url?: string | null
                }
                Update: {
                    category?: string
                    client_name?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    tags?: string[] | null
                    thumbnail_url?: string | null
                    title?: string
                    updated_at?: string
                    video_url?: string | null
                }
                Relationships: []
            }
            push_subscriptions: {
                Row: {
                    created_at: string | null
                    endpoint: string
                    id: string
                    subscription: Json
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    endpoint: string
                    id?: string
                    subscription: Json
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    endpoint?: string
                    id?: string
                    subscription?: Json
                    updated_at?: string | null
                    user_id?: string | null
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
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DefaultSchema = Database["public"]

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
        Enums: {},
    },
} as const
