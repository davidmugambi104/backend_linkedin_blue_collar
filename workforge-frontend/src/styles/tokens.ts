/**
 * WorkForge Design System - Core Tokens
 * Single source of truth for all design decisions
 */

export const designTokens = {
  // Colors - Primary Brand
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Brand blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    // Semantic colors
    success: {
      light: '#22c55e',
      DEFAULT: '#16a34a',
      dark: '#15803d',
    },
    warning: {
      light: '#f59e0b',
      DEFAULT: '#d97706',
      dark: '#b45309',
    },
    error: {
      light: '#ef4444',
      DEFAULT: '#dc2626',
      dark: '#b91c1c',
    },
    info: {
      light: '#3b82f6',
      DEFAULT: '#2563eb',
      dark: '#1d4ed8',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter var, Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing - Consistent spacing scale
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    // Glass-specific
    glass: '0 8px 32px -8px rgba(0, 0, 0, 0.1)',
    'glass-heavy': '0 8px 32px -4px rgba(0, 0, 0, 0.2)',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Layout
  layout: {
    // Container max-widths
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1400px',
    },
    // Sidebar
    sidebar: {
      width: '16rem', // 256px
      collapsedWidth: '5rem', // 80px
    },
    // Header
    header: {
      height: '4rem', // 64px
    },
  },
};

/**
 * Utility function to get design token value
 */
export function getToken(path: string): any {
  const keys = path.split('.');
  let value: any = designTokens;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

/**
 * Common component patterns
 */
export const componentPatterns = {
  // Card styles
  card: {
    glass: `
      relative rounded-2xl backdrop-blur-md
      bg-gradient-to-br from-white/30 to-white/10
      border border-white/30 shadow-glass
      dark:from-black/40 dark:to-black/20 dark:border-white/10
    `,
    solid: `
      rounded-2xl bg-white dark:bg-slate-800
      border border-gray-200 dark:border-slate-700
      shadow-md
    `,
  },

  // Input styles
  input: {
    glass: `
      h-10 w-full rounded-xl border px-4 py-2 text-sm
      bg-gradient-to-br from-white/30 to-white/10
      border-slate-300/50
      dark:from-black/30 dark:to-black/10 dark:border-slate-600/50
      focus:ring-2 focus:ring-blue-500/70 focus:border-transparent
    `,
    solid: `
      h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      dark:border-slate-600 dark:bg-slate-800
      focus:ring-2 focus:ring-blue-500 focus:border-transparent
    `,
  },

  // Button base
  button: {
    base: `
      inline-flex items-center justify-center font-semibold
      rounded-xl transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.97]
    `,
  },
};

export default designTokens;
