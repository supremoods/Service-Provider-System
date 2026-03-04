export interface IBaseResponse<T> {
  success: boolean
  message?: string
  data?: T
  response?: T
  error?: unknown
}
