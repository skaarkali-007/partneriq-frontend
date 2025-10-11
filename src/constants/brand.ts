// Partner IQ Brand Constants
export const BRAND_COLORS = {
  primary: '#2563EB',
  secondary: '#1E40AF',
  accent: '#6B7280',
  white: '#FFFFFF',
  dark: '#1F2937',
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
} as const;

export const BRAND_TYPOGRAPHY = {
  headings: 'Inter, system-ui, -apple-system, sans-serif',
  body: 'Inter, system-ui, -apple-system, sans-serif',
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
} as const;

export const LOGO_SIZES = {
  sm: { width: 120, height: 32 },
  md: { width: 160, height: 42 },
  lg: { width: 200, height: 53 },
  xl: { width: 240, height: 64 },
  '2xl': { width: 360, height: 96 },
} as const;

// Brand name constant
export const BRAND_NAME = 'Partner IQ' as const;