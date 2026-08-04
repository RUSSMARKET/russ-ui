/** Спецсимволы как в UserService::validatePassword / RussAuthPassword. */
export const STAFF_PASSWORD_SYMBOLS = "!@#$%&";

/**
 * Валидация пароля синхронно с бэкендом (`UserService::validatePassword`).
 * @returns сообщение об ошибке или null
 */
export function validateStaffPassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Пароль должен содержать минимум 8 символов";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Пароль должен содержать латинские заглавные и строчные буквы";
  }
  if (!/[0-9]/.test(password)) {
    return "Пароль должен содержать хотя бы одну цифру";
  }
  if (!/[!@#$%&]/.test(password)) {
    return `Пароль должен содержать спецсимвол из ${STAFF_PASSWORD_SYMBOLS}`;
  }
  return null;
}

export function setUserPasswordErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { data?: string } };
    message?: string;
  };

  if (err.response?.status === 400) {
    return err.response?.data?.data || "Пароли не совпадают";
  }
  if (err.response?.status === 401) {
    return "Ошибка. Неверный API ключ";
  }
  if (err.response?.status === 403) {
    return err.response?.data?.data || "У Вас нет прав использовать этот запрос";
  }
  if (err.response?.status === 422) {
    return err.response?.data?.data || "Пароль отклонён сервисом аутентификации";
  }
  if (typeof err.response?.data?.data === "string" && err.response.data.data) {
    return err.response.data.data;
  }
  if (err.message) {
    return err.message;
  }
  return "Ошибка при смене пароля";
}

export type StaffSetPasswordFn = (payload: {
  userId: string | number;
  newPassword: string;
  newPasswordConfirmation: string;
}) => Promise<void>;
