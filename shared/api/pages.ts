import { http } from './http'

export interface Page {
  id: number
  name: string
  code: string
  pivot: {
    role_id: number
    page_id: number
  }
}

export interface PagesResponse {
  status: boolean
  pages: Page[]
  hidden?: Page[]
}

export const fetchUserPages = async (): Promise<PagesResponse> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (!token) {
    throw new Error("Пользователь не авторизован: отсутствует токен")
  }

  const response = await http.get("/api/pages", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (response.data.status) {
    return response.data
  } else {
    throw new Error("Ошибка при получении страниц пользователя")
  }
}
