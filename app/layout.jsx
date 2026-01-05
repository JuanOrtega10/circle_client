import './globals.css'

export const metadata = {
  title: 'Circle.so Admin API Client',
  description: 'Visual client for Circle.so Admin API',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

