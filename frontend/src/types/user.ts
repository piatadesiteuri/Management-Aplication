export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  INSPECTOR: 'INSPECTOR',
  DRIVER: 'DRIVER',
  USER: 'USER'
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  department: string
  phoneNumber?: string
  isActive: boolean
} 