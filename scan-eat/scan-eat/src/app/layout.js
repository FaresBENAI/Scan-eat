import './globals.css'

export const metadata = {
  title: 'Scan-eat - Menu QR intelligent pour restaurants',
  description: 'Menu digital, commande et paiement en un scan. Révolutionnez l\'expérience de vos clients.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
