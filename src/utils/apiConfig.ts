// API Configuration Utility
export const getApiBaseUrl = (): string => {
  // Get the base URL from environment variables
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  
  if (envBaseUrl) {
    return envBaseUrl
  }
  
  // Fallback logic for different environments
  if (import.meta.env.PROD) {
    // In production, we need to use the backend URL
    // This should be set via environment variables in deployment
    return 'https://your-backend-api.com/api/v1' // Replace with actual backend URL
  }
  
  // Development fallback
  return 'http://localhost:3004/api/v1'
}

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // Remove /api/v1 from the beginning of endpoint if it exists, since baseUrl already includes it
  if (cleanEndpoint.startsWith('api/v1/')) {
    cleanEndpoint = cleanEndpoint.slice(7) // Remove 'api/v1/'
  }
  
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  return `${cleanBaseUrl}/${cleanEndpoint}`
}

// Helper function for making API requests with proper base URL
export const apiRequest = async (endpoint: string, options: any = {}): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : createApiUrl(endpoint)
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
}