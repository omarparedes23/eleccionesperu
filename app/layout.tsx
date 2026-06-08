import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Resultados Electorales Peru 2026",
  description: "Segunda vuelta presidencial - Resultados en tiempo real",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
