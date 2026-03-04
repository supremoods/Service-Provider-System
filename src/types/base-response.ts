export interface IBaseResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: unknown
}
