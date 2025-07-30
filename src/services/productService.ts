import { ApiService } from './api'

export interface Product {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  status: 'active' | 'inactive'
  commissionRate: number
  commissionType: 'percentage' | 'fixed'
  fixedCommissionAmount?: number
  clearancePeriodDays: number
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  category?: string
  tags?: string[]
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ProductService extends ApiService {
  constructor() {
    super('/products')
  }

  /**
   * Get active products for marketers
   */
  async getActiveProducts(): Promise<Product[]> {
    const products = await this.get<Product[]>('/active')
    console.log("PRODUCTS:", products)
    return products
  }

  /**
   * Get products specifically curated for marketers
   */
  async getProductsForMarketers(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams()
    
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.tags?.length) {
      filters.tags.forEach(tag => params.append('tags', tag))
    }

    const queryString = params.toString()
    const url = queryString ? `/discover?${queryString}` : '/discover'
    
    return this.get<ProductsResponse>(url)
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: Omit<ProductFilters, 'search'>): Promise<ProductsResponse> {
    const params = new URLSearchParams({ search: query })
    
    if (filters?.category) params.append('category', filters.category)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.tags?.length) {
      filters.tags.forEach(tag => params.append('tags', tag))
    }

    return this.get<ProductsResponse>(`/search?${params.toString()}`)
  }

  /**
   * Get all products (with filters)
   */
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams()
    
    if (filters?.category) params.append('category', filters.category)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.tags?.length) {
      filters.tags.forEach(tag => params.append('tags', tag))
    }

    const queryString = params.toString()
    const url = queryString ? `/?${queryString}` : '/'
    
    return this.get<ProductsResponse>(url)
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    return this.get<Product>(`/${id}`)
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    return this.get<string[]>('/categories')
  }

  /**
   * Get product tags
   */
  async getTags(): Promise<string[]> {
    return this.get<string[]>('/tags')
  }

  /**
   * Get recommended products for a marketer
   */
  async getRecommendedProducts(): Promise<Product[]> {
    return this.get<Product[]>('/recommendations')
  }
}

export const productService = new ProductService()