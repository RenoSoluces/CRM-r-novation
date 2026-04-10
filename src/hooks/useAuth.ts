import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Permission } from '@/utils/permissions'
import type { UserRole } from '@/types/user'

export function useAuth() {
  const { user, isAuthenticated, login, logout, switchUser } = useAuthStore()

  function can(permission: Permission): boolean {
    return hasPermission(user?.role ?? null, permission)
  }

  function isRole(...roles: UserRole[]): boolean {
    return !!user && roles.includes(user.role)
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    switchUser,
    can,
    isRole,
  }
}