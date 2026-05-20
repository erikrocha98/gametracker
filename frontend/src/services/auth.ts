import { http } from './http'

export interface User {
  id: number
  username: string
  email: string
  email_verified: boolean
}

export interface LoginData {
  email: string
  password: string
  remember_me: boolean
}

export interface SignUpData {
  username: string
  email: string
  password: string
}

export const login = (data: LoginData): Promise<User> => http.post('/auth/login', data)

export const logout = (): Promise<void> => http.post('/auth/logout')

export const getMe = (): Promise<User> => http.get('/auth/me')

export const signup = (data: SignUpData): Promise<User> => http.post('/auth/signup', data)
