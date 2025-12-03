import localFont from 'next/font/local'

// Satoshi font - Download from https://www.fontshare.com/fonts/satoshi
// Place the font files in public/fonts/
export const satoshi = localFont({
  src: [
    {
      path: '../public/fonts/Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})
