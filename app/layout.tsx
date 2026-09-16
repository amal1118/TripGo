import type { Metadata, Viewport } from 'next';
import { Alexandria, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { Toaster } from 'sonner';
import { BottomNav } from '@/components/shell/BottomNav';
import './globals.css';

/**
 * الخطوط:
 * - Alexandria: خط عربي هندسي واضح على الشاشات الصغيرة — أساس الواجهة العربية.
 * - Plus Jakarta Sans: للأرقام والنصوص اللاتينية (تواريخ، أسعار، أكواد الحجز).
 * - Playfair Display: خط عرض تحريري للعناوين اللاتينية الكبيرة فقط.
 */
const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ar',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'TripGo — رفيقك في تخطيط الرحلات', template: '%s · TripGo' },
  description: 'خطط رحلتك كاملة بالذكاء الاصطناعي: فنادق، طيران، مطاعم، تجارب ومعالم — في خطة واحدة تفاعلية.',
  keywords: ['تخطيط رحلات', 'سفر', 'ذكاء اصطناعي', 'خط سير', 'TripGo'],
  openGraph: { title: 'TripGo', description: 'خطط أقل، عِش أكثر.', type: 'website', locale: 'ar_SA' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0C0B' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${alexandria.variable} ${jakarta.variable} ${playfair.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://openrouter.ai" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <BottomNav />
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
