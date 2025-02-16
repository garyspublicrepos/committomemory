import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ClientLayout } from "@/components/layouts/client-layout";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PushToMemory",
  description: "Track and reflect on your coding journey",
};

// Service worker registration script
const registerServiceWorker = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registration successful')
      } catch (err) {
        console.error('ServiceWorker registration failed:', err)
      }
    })
  }
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script id="register-sw" strategy="beforeInteractive">
          {registerServiceWorker}
        </Script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
