/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	fontSize: {
  		// Golden Ratio Typography Scale (1.618)
  		// Base: 16px (1rem), Ratio: φ = 1.618
  		xs: ['0.618rem', { lineHeight: '1.618' }],      // ~10px
  		sm: ['0.764rem', { lineHeight: '1.618' }],      // ~12px (xs * 1.236)
  		base: ['1rem', { lineHeight: '1.618' }],        // 16px
  		lg: ['1.236rem', { lineHeight: '1.618' }],      // ~20px (base * 1.236)
  		xl: ['1.618rem', { lineHeight: '1.4' }],        // ~26px (base * φ)
  		'2xl': ['2rem', { lineHeight: '1.3' }],         // 32px (xl * 1.236)
  		'3xl': ['2.618rem', { lineHeight: '1.2' }],     // ~42px (base * φ²)
  		'4xl': ['3.236rem', { lineHeight: '1.15' }],    // ~52px (3xl * 1.236)
  		'5xl': ['4.236rem', { lineHeight: '1.1' }],     // ~68px (base * φ³)
  		'6xl': ['5.236rem', { lineHeight: '1.05' }],    // ~84px
  		'7xl': ['6.854rem', { lineHeight: '1' }],       // ~110px (base * φ⁴)
  		'8xl': ['8.472rem', { lineHeight: '1' }],       // ~136px
  	},
  	fontWeight: {
  		normal: '400',
  		medium: '500',
  		semibold: '600',
  		bold: '700'
  	},
  	extend: {
  		spacing: {
  			thumb: '44px',
  			fab: '56px'
  		},
  		screens: {
  			xs: '320px',
  			sm: '375px',
  			md: '768px',
  			lg: '1024px'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			gold: {
  				50: '#fffcf2',
  				100: '#fff7e0',
  				200: '#ffebb3',
  				300: '#ffde80',
  				400: '#ffc840',
  				500: '#ffb300',
  				600: '#e69500',
  				700: '#bf7300',
  				800: '#995600',
  				900: '#733e00'
  			},
  			stone: {
  				50: '#fafaf9',
  				100: '#f5f5f4',
  				200: '#e7e5e4',
  				300: '#d6d3d1',
  				800: '#292524',
  				900: '#1c1917',
  				950: '#0c0a09'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: 0 },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: 0 }
  			},
  			blob: {
  				'0%': { transform: 'translate(0px, 0px) scale(1)' },
  				'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
  				'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
  				'100%': { transform: 'translate(0px, 0px) scale(1)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			blob: 'blob 7s infinite'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    // Thumb zone utilities
    function({ addUtilities }) {
      addUtilities({
        '.thumb-green': {
          'position': 'fixed',
          'bottom': '0',
          'left': '0',
          'right': '0',
          'height': '40vh',
          'z-index': '10'
        },
        '.thumb-yellow': {
          'position': 'fixed',
          'bottom': '40vh',
          'left': '0',
          'right': '0',
          'height': '30vh',
          'z-index': '10'
        },
        '.thumb-red': {
          'position': 'fixed',
          'top': '0',
          'left': '0',
          'right': '0',
          'height': '30vh',
          'z-index': '10'
        }
      })
    }
  ],
}