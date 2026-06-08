export const theme = {
  colors: {
    primary:   '#3b82f6',
    secondary: '#8b5cf6',
    success:   '#22c55e',
    warning:   '#f59e0b',
    danger:    '#ef4444',
    bg:        '#0a0f1e',
    surface:   '#111827',
    card:      '#1a2235',
    border:    '#1e3a5f',
    text:      '#e2e8f0',
    muted:     '#64748b',
  },
  fonts: { sans: 'Inter, sans-serif', mono: 'JetBrains Mono, monospace' },
  breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
} as const;
export type Theme = typeof theme;
