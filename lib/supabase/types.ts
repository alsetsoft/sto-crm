// Database types for the Supabase schema. Keep in sync with the migration in
// supabase/migrations/. Regenerate with `supabase gen types` once the CLI is set up.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WarehouseItemRow = {
  id: string;
  name: string;
  article: string | null;
  barcode: string | null;
  category: string | null;
  subcategory: string | null;
  location: string | null;
  unit: string;
  quantity: number;
  min_stock: number;
  recommended_stock: number;
  purchase_price: number;
  purchase_price_avg: number;
  sale_price: number;
  margin: number;
  photo_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type WarehouseItemInsert = Omit<
  WarehouseItemRow,
  "id" | "margin" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type WarehouseItemUpdate = Partial<WarehouseItemInsert>;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      warehouse_items: {
        Row: WarehouseItemRow;
        Insert: WarehouseItemInsert;
        Update: WarehouseItemUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
