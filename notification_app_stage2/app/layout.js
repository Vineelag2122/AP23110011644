import Providers from './providers'
import './globals.css'

export const metadata = {
  title: 'Campus Notifications - Stage 2',
  description: 'Next.js frontend for all notifications and priority inbox views',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
