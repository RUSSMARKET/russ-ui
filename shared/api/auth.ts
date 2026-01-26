export const CheckAccess = () => {
  if (process.server) return

  const token = localStorage.getItem("access_token")
  const roleString = localStorage.getItem("user_role_string")

  if (!token || !roleString) {
    console.warn("Нет токена или роли — возможно, пользователь ещё не авторизован.")
    return false
  }

  return {
    token,
    role: roleString,
  }
}
