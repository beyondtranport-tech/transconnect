import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider'; // Correctly import the provider
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import Analytics from '@/components/Analytics';
import { VisitorTracker } from '@/components/VisitorTracker';

export const metadata: Metadata = {
  title: 'TransConnect',
  description: 'An ecosystem for the transport industry.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Wrap the entire body content with the FirebaseClientProvider */}
        <FirebaseClientProvider>
            <Analytics />
            <VisitorTracker />
            <div className="relative flex min-h-dvh flex-col bg-background">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
