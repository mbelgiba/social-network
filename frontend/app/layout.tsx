import './globals.css'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'Dark Yellow Social Network',
  description: 'A modern social network built with Go and Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}