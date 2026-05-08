import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'surface-4': 'var(--surface-4)',
        'surface-5': 'var(--surface-5)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-panel': 'var(--surface-panel)',
        'surface-overlay': 'var(--surface-overlay)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          strong: 'var(--accent-strong)',
        },
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        muted: 'var(--text-muted)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'player-bar-bg': 'var(--player-bar-bg)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'input-focus': 'var(--input-focus)',
        'progress-bg': 'var(--progress-bg)',
        'progress-fill': 'var(--progress-fill)',
        'progress-hover': 'var(--progress-hover)',
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        ring: {
          subtle: 'var(--ring-subtle)',
          strong: 'var(--ring-strong)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-xs)',
        DEFAULT: 'var(--radius-sm)',
        md: 'var(--radius-sm)',
        lg: 'var(--radius-md)',
        xl: 'var(--radius-lg)',
        '2xl': 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display': ['34px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1': ['24px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['20px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3': ['16px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption-sm': ['11px', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal: 'var(--shadow-modal)',
        'hover-lift': 'var(--shadow-hover-lift)',
        'play-button': 'var(--shadow-play-button)',
        'accent-glow': 'var(--shadow-accent-glow)',
        'progress-thumb': 'var(--shadow-progress-thumb)',
      },
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'spring': 'var(--ease-spring)',
        'bounce': 'var(--ease-bounce)',
      },
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
      },
    }
  },
  plugins: [require('tailwindcss-animate')]
}

export default config
