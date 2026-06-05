// Database types for the Supabase schema. Keep in sync with the live schema
// (applied via the Supabase MCP). Regenerate with `mcp__supabase__generate_typescript_types`
// and reconcile to this file's hand-written style if the schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Enums (string-literal unions; latin identifiers stored in DB)
// ---------------------------------------------------------------------------

/** Запис / Прийнято / В роботі / Готово / Розраховано / Проблема */
export type OrderStatus =
  | "scheduled"
  | "accepted"
  | "in_progress"
  | "done"
  | "settled"
  | "problem";

/** низька / середня / висока */
export type ProblemCriticality = "low" | "medium" | "high";

/** відкрита / закрита (вирішено) */
export type ProblemStatus = "open" | "closed";

/** готівка / безнал */
export type PaymentMethod = "cash" | "cashless";

/** зарплата / аванс / премія */
export type PayoutType = "salary" | "advance" | "bonus";

/** Майстер / Адміністратор */
export type EmployeeRole = "master" | "admin";

/** з довідника / вручну */
export type WorkSource = "catalog" | "manual";

/** зі складу / вручну */
export type PartSource = "warehouse" | "manual";

// ---------------------------------------------------------------------------
// Warehouse (Склад)
// ---------------------------------------------------------------------------

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
};

export type WarehouseItemInsert = Omit<
  WarehouseItemRow,
  "id" | "margin" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type WarehouseItemUpdate = Partial<WarehouseItemInsert>;

/** Distinct category/subcategory pair used to build the filter dropdowns. */
export type WarehouseCategoryPair = {
  category: string;
  subcategory: string | null;
};

/** Return shape of the `warehouse_overview()` RPC (global stats + filter options). */
export type WarehouseOverview = {
  active_count: number;
  below_min: number;
  negative: number;
  total_value: number;
  categories: WarehouseCategoryPair[];
};

// ---------------------------------------------------------------------------
// Customers (Клієнти)
// ---------------------------------------------------------------------------

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  comment: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = {
  id?: string;
  full_name: string;
  phone?: string | null;
  comment?: string | null;
  is_archived?: boolean;
};

export type CustomerUpdate = Partial<CustomerInsert>;

// ---------------------------------------------------------------------------
// Cars (Авто)
// ---------------------------------------------------------------------------

export type CarRow = {
  id: string;
  customer_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  engine_number: string | null;
  plate: string | null;
  mileage: number | null;
  transmission: string | null;
  drive_type: string | null;
  body_type: string | null;
  power: string | null;
  comment: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CarInsert = {
  id?: string;
  customer_id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  engine_number?: string | null;
  plate?: string | null;
  mileage?: number | null;
  transmission?: string | null;
  drive_type?: string | null;
  body_type?: string | null;
  power?: string | null;
  comment?: string | null;
  is_archived?: boolean;
};

export type CarUpdate = Partial<CarInsert>;

// ---------------------------------------------------------------------------
// Services (Послуги)
// ---------------------------------------------------------------------------

export type ServiceRow = {
  id: string;
  name: string;
  price: number;
  labor_hours: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceInsert = Omit<
  ServiceRow,
  "id" | "is_archived" | "created_at" | "updated_at"
> & {
  id?: string;
  is_archived?: boolean;
};

export type ServiceUpdate = Partial<ServiceInsert>;

// ---------------------------------------------------------------------------
// Employees (Працівники)
// ---------------------------------------------------------------------------

export type EmployeeRow = {
  id: string;
  full_name: string;
  role: EmployeeRole;
  email: string | null;
  monthly_rate: number;
  work_percentage: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeInsert = Omit<
  EmployeeRow,
  "id" | "email" | "is_archived" | "created_at" | "updated_at"
> & {
  id?: string;
  email?: string | null;
  role?: EmployeeRole;
  is_archived?: boolean;
};

export type EmployeeUpdate = Partial<EmployeeInsert>;

// ---------------------------------------------------------------------------
// Orders (План / Наряди)
// ---------------------------------------------------------------------------

export type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  car_id: string;
  status: OrderStatus;
  request_text: string | null;
  scheduled_at: string | null;
  intake_notes: string | null;
  signature_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

// order_number is assigned by a DB trigger; status/is_archived have defaults.
export type OrderInsert = {
  id?: string;
  customer_id: string;
  car_id: string;
  status?: OrderStatus;
  request_text?: string | null;
  scheduled_at?: string | null;
  intake_notes?: string | null;
  signature_url?: string | null;
  is_archived?: boolean;
};

export type OrderUpdate = Partial<OrderInsert> & { status?: OrderStatus };

// ---------------------------------------------------------------------------
// Order executors (виконавці наряду)
// ---------------------------------------------------------------------------

export type OrderExecutorRow = {
  id: string;
  order_id: string;
  employee_id: string;
  created_at: string;
};

export type OrderExecutorInsert = Omit<
  OrderExecutorRow,
  "id" | "created_at"
> & {
  id?: string;
};

export type OrderExecutorUpdate = Partial<OrderExecutorInsert>;

// ---------------------------------------------------------------------------
// Order works (роботи наряду)
// ---------------------------------------------------------------------------

export type OrderWorkRow = {
  id: string;
  order_id: string;
  service_id: string | null;
  source: WorkSource;
  name: string;
  price: number;
  labor_hours: number;
  executor_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderWorkInsert = {
  id?: string;
  order_id: string;
  service_id?: string | null;
  source?: WorkSource;
  name: string;
  price?: number;
  labor_hours?: number;
  executor_id?: string | null;
};

export type OrderWorkUpdate = Partial<OrderWorkInsert>;

// ---------------------------------------------------------------------------
// Order parts (деталі наряду) — line_total/line_margin are generated
// ---------------------------------------------------------------------------

export type OrderPartRow = {
  id: string;
  order_id: string;
  warehouse_item_id: string | null;
  source: PartSource;
  name: string;
  quantity: number;
  sale_price: number;
  purchase_price: number;
  line_total: number;
  line_margin: number;
  created_at: string;
  updated_at: string;
};

export type OrderPartInsert = {
  id?: string;
  order_id: string;
  warehouse_item_id?: string | null;
  source?: PartSource;
  name: string;
  quantity?: number;
  sale_price?: number;
  purchase_price?: number;
};

export type OrderPartUpdate = Partial<OrderPartInsert>;

// ---------------------------------------------------------------------------
// Order payments (оплати наряду)
// ---------------------------------------------------------------------------

export type OrderPaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  comment: string | null;
  created_at: string;
};

export type OrderPaymentInsert = {
  id?: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at?: string;
  comment?: string | null;
};

export type OrderPaymentUpdate = Partial<OrderPaymentInsert>;

// ---------------------------------------------------------------------------
// Order photos (фото наряду — приймання / Telegram)
// ---------------------------------------------------------------------------

export type OrderPhotoRow = {
  id: string;
  order_id: string;
  url: string;
  kind: string;
  source: string;
  created_at: string;
};

export type OrderPhotoInsert = Omit<
  OrderPhotoRow,
  "id" | "kind" | "source" | "created_at"
> & {
  id?: string;
  kind?: string;
  source?: string;
};

export type OrderPhotoUpdate = Partial<OrderPhotoInsert>;

// ---------------------------------------------------------------------------
// Problems (Проблеми)
// ---------------------------------------------------------------------------

export type ProblemRow = {
  id: string;
  order_id: string;
  description: string;
  criticality: ProblemCriticality;
  status: ProblemStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProblemInsert = Omit<
  ProblemRow,
  "id" | "criticality" | "status" | "resolved_at" | "created_at" | "updated_at"
> & {
  id?: string;
  criticality?: ProblemCriticality;
  status?: ProblemStatus;
  resolved_at?: string | null;
};

export type ProblemUpdate = Partial<ProblemInsert> & {
  status?: ProblemStatus;
  resolved_at?: string | null;
};

// ---------------------------------------------------------------------------
// Payouts (виплати)
// ---------------------------------------------------------------------------

export type PayoutRow = {
  id: string;
  employee_id: string;
  amount: number;
  type: PayoutType;
  paid_at: string;
  comment: string | null;
  created_at: string;
};

export type PayoutInsert = {
  id?: string;
  employee_id: string;
  amount: number;
  type: PayoutType;
  paid_at?: string;
  comment?: string | null;
};

export type PayoutUpdate = Partial<PayoutInsert>;

// ---------------------------------------------------------------------------
// Order counters (internal — drives order numbering)
// ---------------------------------------------------------------------------

export type OrderCounterRow = {
  year: number;
  last_no: number;
};

export type OrderCounterInsert = OrderCounterRow & { last_no?: number };
export type OrderCounterUpdate = Partial<OrderCounterRow>;

// ---------------------------------------------------------------------------
// View: employee_work_accruals (нарахування по роботах)
// ---------------------------------------------------------------------------

export type EmployeeWorkAccrualRow = {
  employee_id: string | null;
  order_id: string | null;
  order_number: string | null;
  status: OrderStatus | null;
  order_created_at: string | null;
  work_price: number | null;
  work_percentage: number | null;
  accrual: number | null;
};

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

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
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
        Relationships: [];
      };
      cars: {
        Row: CarRow;
        Insert: CarInsert;
        Update: CarUpdate;
        Relationships: [];
      };
      services: {
        Row: ServiceRow;
        Insert: ServiceInsert;
        Update: ServiceUpdate;
        Relationships: [];
      };
      employees: {
        Row: EmployeeRow;
        Insert: EmployeeInsert;
        Update: EmployeeUpdate;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [];
      };
      order_executors: {
        Row: OrderExecutorRow;
        Insert: OrderExecutorInsert;
        Update: OrderExecutorUpdate;
        Relationships: [];
      };
      order_works: {
        Row: OrderWorkRow;
        Insert: OrderWorkInsert;
        Update: OrderWorkUpdate;
        Relationships: [];
      };
      order_parts: {
        Row: OrderPartRow;
        Insert: OrderPartInsert;
        Update: OrderPartUpdate;
        Relationships: [];
      };
      order_payments: {
        Row: OrderPaymentRow;
        Insert: OrderPaymentInsert;
        Update: OrderPaymentUpdate;
        Relationships: [];
      };
      order_photos: {
        Row: OrderPhotoRow;
        Insert: OrderPhotoInsert;
        Update: OrderPhotoUpdate;
        Relationships: [];
      };
      problems: {
        Row: ProblemRow;
        Insert: ProblemInsert;
        Update: ProblemUpdate;
        Relationships: [];
      };
      payouts: {
        Row: PayoutRow;
        Insert: PayoutInsert;
        Update: PayoutUpdate;
        Relationships: [];
      };
      order_counters: {
        Row: OrderCounterRow;
        Insert: OrderCounterInsert;
        Update: OrderCounterUpdate;
        Relationships: [];
      };
    };
    Views: {
      employee_work_accruals: {
        Row: EmployeeWorkAccrualRow;
        Relationships: [];
      };
    };
    Functions: {
      warehouse_overview: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      order_status: OrderStatus;
      problem_criticality: ProblemCriticality;
      problem_status: ProblemStatus;
      payment_method: PaymentMethod;
      payout_type: PayoutType;
      employee_role: EmployeeRole;
      work_source: WorkSource;
      part_source: PartSource;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
