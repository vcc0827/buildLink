import request from '@/utils/request'

export interface PriceInfo {
  id?: number
  region: string
  category: string
  model: string
  spec: string
  unit: string
  taxIncludedPrice: number
  taxExcludedPrice: number
  month: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export const priceInfoApi = {
  list(params: {
    region?: string
    category?: string
    model?: string
    spec?: string
    month?: string
    page?: number
    pageSize?: number
  }) {
    return request.get('/price-info', { params })
  },

  get(id: number) {
    return request.get(`/price-info/${id}`)
  },

  create(data: Omit<PriceInfo, 'id' | 'createdAt' | 'updatedAt'>) {
    return request.post('/price-info', data)
  },

  update(id: number, data: Partial<PriceInfo>) {
    return request.put(`/price-info/${id}`, data)
  },

  delete(id: number) {
    return request.delete(`/price-info/${id}`)
  },

  getRegions() {
    return request.get('/price-info/regions/list')
  },

  getCategories() {
    return request.get('/price-info/categories/list')
  },

  getModels(category?: string) {
    return request.get('/price-info/models/list', { params: { category } })
  }
}