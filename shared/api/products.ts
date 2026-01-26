import { http } from '@/shared/api'
import type { ProductBody, CategoryBody, ExtraditionBody, UploadAdditionalData } from '@/entities/product'

export const fetchProductsAPI = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.get('/api/product', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  if (response.data && response.data.status === false && response.data.data) {
    throw new Error(response.data.data)
  }
  return response.data
}

export const createProductAPI = async (data: FormData) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.post('/api/product', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const fetchProductByIdAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.get(`/api/product/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  return response.data
}

export const updateProductAPI = async (id: number, data: FormData) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.post(`/api/product/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteProductAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.delete(`/api/product/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  return response.data
}

export const activateProductAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.post(
    `/api/product/${id}/on`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  return response.data
}

export const deactivateProductAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.post(
    `/api/product/${id}/off`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  return response.data
}

export const extraditionProductAPI = async (id: number, body: ExtraditionBody) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const data = new FormData()
  if (body.client_id !== undefined) {
    data.append('client_id', body.client_id)
  }
  data.append('data', body.data)
  data.append('step', String(body.step))

  const response = await http.post(`/api/product/${id}/extradition`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const fetchCategoriesAPI = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.get('/api/product/category', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  return response.data
}

export const usedQRRefreshAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.get(`/api/redirect/user/${id}/isactive`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  return response.data
}

export const createCategoryAPI = async (body: CategoryBody) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const data = new FormData()
  data.append('name', body.name)

  const response = await http.post('/api/product/category', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const updateCategoryAPI = async (id: number, body: CategoryBody) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.put(`/api/product/category/${id}`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export const deleteCategoryAPI = async (id: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  const response = await http.delete(`/api/product/category/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  return response.data
}

export const uploadDocumentsAPI = async (requestId: number, files: File[], additionalData?: UploadAdditionalData) => {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Пользователь не авторизован')

  if (files.length > 5) {
    throw new Error('Вы не можете подгрузить больше 5 файлов.')
  }

  const formData = new FormData()
  files.slice(0, 5).forEach((file, index) => {
    formData.append(`files[${index}]`, file)
  })

  if (additionalData?.card_number) {
    formData.append('card_number', additionalData.card_number)
  }

  if (additionalData?.issued !== undefined) {
    formData.append('issued', String(additionalData.issued))
  }

  if (additionalData?.mobile_app_with_subscription_to_magnit !== undefined) {
    formData.append(
      'mobile_app_with_subscription_to_magnit',
      additionalData.mobile_app_with_subscription_to_magnit ? '1' : '0'
    )
  }

  if (additionalData?.fields) {
    formData.append('fields', JSON.stringify(additionalData.fields))
  }

  const response = await http.post(`/api/request/${requestId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
