import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'CineAI — Movie Recommendations',
    template: '%s | CineAI',
  },
  description:
    'Discover your next favorite film with AI-powered personalized movie recommendations.',
  keywords: ['movies', 'recommendations', 'AI', 'cinema', 'watch', 'film'],
  authors: [{ name: 'CineAI' }],
  openGraph: {
    title: 'CineAI — Movie Recommendations',
    description: 'Discover your next favorite film with AI-powered personalized recommendations.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-cream-bg text-charcoal font-sans antialiased min-h-screen">
        <div className="relative flex flex-col min-h-screen">
          {/* Background radial glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
          >
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-900/20 rounded-full blur-3xl" />
          </div>

          <Navbar />

          <main className="flex-1">{children}</main>

          <footer className="border-t border-black/5 py-8 text-center text-slate-500 text-sm">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎬</span>
                <span className="gradient-text font-bold">CineAI</span>
              </div>
              <p>© {new Date().getFullYear()} CineAI. All rights reserved.</p>
              <div className="flex gap-4 text-charcoal-muted">
                <a href="#" className="hover:text-charcoal transition-colors">Privacy</a>
                <a href="#" className="hover:text-charcoal transition-colors">Terms</a>
                <a href="#" className="hover:text-charcoal transition-colors">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
