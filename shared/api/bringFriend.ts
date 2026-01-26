import { http } from '@/shared/api';

const BASE = '/api/bringfriend';

export interface Friend {
  id: number;
  user_id: string | number;
  sum: string;
  comment: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FriendCreatePayload {
  user_id: string;
  sum: string;
  comment: string;
}

export interface FriendEditPayload extends FriendCreatePayload {}

export const fetchAllFriends = async (): Promise<Friend[]> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Пользователь не авторизован');

  const response = await http.get(BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data && response.data.status === 'true' && Array.isArray(response.data.data)) {
    return response.data.data;
  } else {
    throw new Error('Ошибка загрузки списка друзей');
  }
};

export const fetchUserFriends = async (id: string | number): Promise<Friend[]> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Пользователь не авторизован');

  const response = await http.get(`${BASE}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data && response.data.status === 'true' && Array.isArray(response.data.data)) {
    return response.data.data;
  } else {
    throw new Error('Ошибка загрузки списка друзей пользователя');
  }
};

export const addFriend = async (payload: FriendCreatePayload): Promise<Friend> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Пользователь не авторизован');

  const formData = new FormData();
  formData.append('user_id', payload.user_id);
  formData.append('sum', payload.sum);
  formData.append('comment', payload.comment);

  const response = await http.post(BASE, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data && response.data.status === 'true') {
    return {
      id: 0,
      user_id: payload.user_id,
      sum: payload.sum,
      comment: payload.comment,
    };
  } else {
    throw new Error('Ошибка при добавлении друга');
  }
};


export const editFriend = async (
  id: string | number,
  payload: FriendEditPayload
): Promise<boolean> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Пользователь не авторизован');

  const formData = new FormData();
  formData.append('user_id', payload.user_id);
  formData.append('sum', payload.sum);
  formData.append('comment', payload.comment);

  const response = await http.post(`/api/bringfriend/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.data && (response.data.status === 'true' || response.data === 'true')) {
    return true;
  }
  throw new Error(response.data?.message || 'Ошибка при редактировании');
};

export const deleteFriend = async (id: string | number): Promise<boolean> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Пользователь не авторизован');

  const response = await http.delete(`${BASE}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return response.data && response.data.status === 'true';
};
