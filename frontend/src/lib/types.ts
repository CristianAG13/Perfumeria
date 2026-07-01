export interface Product {
  id: string
  name: string
  brand: string
  category_id: string
  category: string
  barcode: string
  image: string
  description: string
  gender: string
  discount_percent: number
  discount_price: number
  sale_price: number
  cost_price: number
  min_stock: number
  current_stock: number
  active: boolean
  show_in_store: boolean
  price_below_cost: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  image: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  last_name: string
  phone: string
  email: string
  created_at: string
  updated_at: string
}

export interface PaymentLine {
  method: string
  amount: number
}

export interface SaleLine {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
}

export interface Sale {
  id: string
  customer_id: string | null
  total: number
  payments: PaymentLine[]
  status: string
  cancel_reason: string
  lines: SaleLine[]
  created_at: string
}

export interface LowStockItem {
  id: string
  name: string
  current_stock: number
  min_stock: number
  deficit: number
}

export interface DailyReport {
  date: string
  total_amount: number
  sales_count: number
  payment_breakdown: Record<string, number>
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  total_qty: number
  total_revenue: number
}
