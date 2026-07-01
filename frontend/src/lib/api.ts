import axios from 'axios'
import type { Product, Category, Customer, Sale, DailyReport, TopProduct, LowStockItem } from './types'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise(resolve => {
          refreshSubscribers.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
        localStorage.setItem('token', data.token)
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.token}`
        onRefreshed(data.token)
        return api(original)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export interface AuthResponse {
  token: string
  refresh_token?: string
  user: {
    id: string
    username: string
    name: string
    last_name: string
    email: string
    phone: string
    role: string
    blocked: boolean
    email_verified: boolean
    profile_complete: boolean
  }
  password_sent?: boolean
}

export async function refreshAuth(): Promise<AuthResponse> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('no refresh token')
  const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
  return data
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export async function register(email: string, password: string, name: string, lastName?: string, phone?: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { email, password, name, last_name: lastName, phone })
  return data
}

export async function googleAuth(accessToken: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/google', { access_token: accessToken })
  return data
}

export async function verifyEmail(token: string): Promise<void> {
  await api.get('/auth/verify-email', { params: { token } })
}

export async function getMe(): Promise<AuthResponse['user']> {
  const { data } = await api.get('/auth/me')
  return data
}

export async function updateProfile(input: {
  name: string
  last_name: string
  phone: string
  email: string
}): Promise<AuthResponse> {
  const { data } = await api.patch('/auth/profile', input)
  return data
}

export async function listUsers(): Promise<AuthResponse['user'][]> {
  const { data } = await api.get('/admin/users')
  return data
}

export async function listAllUsers(): Promise<AuthResponse['user'][]> {
  const { data } = await api.get('/admin/users/all')
  return data
}

export async function listAdmins(): Promise<AuthResponse['user'][]> {
  const { data } = await api.get('/admin/admins')
  return data
}

export async function createAdminUser(email: string, password: string, name: string): Promise<AuthResponse['user']> {
  const { data } = await api.post('/admin/users', { email, password, name })
  return data
}

export async function promoteToAdmin(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/promote`)
}

export async function changePassword(userId: string, password: string): Promise<void> {
  await api.put(`/admin/users/${userId}/password`, { password })
}

export async function toggleBlockUser(userId: string): Promise<AuthResponse['user']> {
  const { data } = await api.post(`/admin/users/${userId}/toggle-block`)
  return data
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`)
}

export async function searchProducts(q: string, categoryId?: string): Promise<Product[]> {
  const params: Record<string, string> = {}
  if (q) params.q = q
  if (categoryId) params.category_id = categoryId
  const { data } = await api.get('/products', { params })
  return data
}

export async function createProduct(p: Partial<Product>): Promise<Product> {
  const { data } = await api.post('/products', p)
  return data
}

export async function updateProduct(id: string, p: Partial<Product>): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, p)
  return data
}

export async function deactivateProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories')
  return data
}

export async function createCategory(c: Partial<Category>): Promise<Category> {
  const { data } = await api.post('/categories', c)
  return data
}

export async function updateCategory(id: string, c: Partial<Category>): Promise<Category> {
  const { data } = await api.patch(`/categories/${id}`, c)
  return data
}

export async function searchCustomers(q: string): Promise<Customer[]> {
  const { data } = await api.get('/customers', { params: { q } })
  return data
}

export async function createCustomer(c: Partial<Customer>): Promise<Customer> {
  const { data } = await api.post('/customers', c)
  return data
}

export async function updateCustomer(id: string, c: Partial<Customer>): Promise<Customer> {
  const { data } = await api.patch(`/customers/${id}`, c)
  return data
}

export async function registerSale(input: {
  lines: { product_id: string; product_name: string; quantity: number; unit_price: number; discount: number }[]
  customer_id: string | null
  payments: { method: string; amount: number }[]
}): Promise<Sale> {
  const { data } = await api.post('/sales', input)
  return data
}

export async function querySales(params: { from?: string; to?: string; customer?: string }): Promise<Sale[]> {
  const { data } = await api.get('/sales', { params })
  return data
}

export async function cancelSale(id: string, reason: string): Promise<Sale> {
  const { data } = await api.post(`/sales/${id}/cancel`, { reason })
  return data
}

export async function recordEntry(product_id: string, quantity: number, reason: string): Promise<void> {
  await api.post('/stock/entries', { product_id, quantity, reason })
}

export async function adjustStock(product_id: string, quantity: number, reason: string): Promise<void> {
  await api.post('/stock/adjustments', { product_id, quantity, reason })
}

export async function getDailyReport(date: string): Promise<DailyReport> {
  const { data } = await api.get('/reports/daily', { params: { date } })
  return data
}

export async function getTopProducts(params: { from?: string; to?: string; limit?: number }): Promise<TopProduct[]> {
  const { data } = await api.get('/reports/top-products', { params })
  return data
}

export async function getLowStock(): Promise<{ products: LowStockItem[]; count: number }> {
  const { data } = await api.get('/reports/low-stock')
  return data
}

export async function getStoreProducts(categoryId?: string, gender?: string): Promise<Product[]> {
  const params: Record<string, string> = {}
  if (categoryId) params.category_id = categoryId
  if (gender) params.gender = gender
  const { data } = await api.get('/store/products', { params })
  return data
}

export async function getStoreCategories(): Promise<Category[]> {
  const { data } = await api.get('/store/categories')
  return data
}

export interface Testimonial {
  id: string
  name: string
  text: string
  rating: number
  avatar_url: string
  active: boolean
  created_at: string
}

export async function getMyOrders(): Promise<Sale[]> {
  const { data } = await api.get('/store/orders')
  return data
}

export async function checkout(lines: { product_id: string; product_name: string; quantity: number; unit_price: number }[]): Promise<{ status: string }> {
  const { data } = await api.post('/store/checkout', { lines })
  return data
}

export async function getStoreTestimonials(): Promise<Testimonial[]> {
  const { data } = await api.get('/testimonials')
  return data
}

export async function listTestimonials(): Promise<Testimonial[]> {
  const { data } = await api.get('/admin/testimonials')
  return data
}

export async function createTestimonial(input: { name: string; text: string; rating: number; avatar_url?: string }): Promise<Testimonial> {
  const { data } = await api.post('/admin/testimonials', input)
  return data
}

export async function deleteTestimonial(id: string): Promise<void> {
  await api.delete(`/admin/testimonials/${id}`)
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { token, new_password: newPassword })
  return data
}
