const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const defaultProductionApiBaseUrl = 'https://wearable-investor-demo-api.onrender.com'

const API_BASE_URL =
  configuredApiBaseUrl ||
  (window.location.hostname.endsWith('github.io') ? defaultProductionApiBaseUrl : 'http://localhost:3001')

type ApiErrorPayload = {
  error?: {
    message?: string
    code?: string
    requestId?: string
  }
}

export class ApiError extends Error {
  code?: string
  requestId?: string

  constructor(message: string, code?: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.requestId = requestId
  }
}

export async function apiFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    })

    const json = (await response.json()) as TResponse & ApiErrorPayload
    if (!response.ok) {
      throw new ApiError(
        json.error?.message ?? 'Request failed',
        json.error?.code,
        json.error?.requestId,
      )
    }
    return json
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试')
    }
    throw new ApiError('网络错误，请检查后端服务或重试')
  } finally {
    window.clearTimeout(timeout)
  }
}

export { API_BASE_URL }
