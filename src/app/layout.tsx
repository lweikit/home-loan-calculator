import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Home Loan Calculator — Singapore HDB, EC, Condo',
  description: 'Free Singapore home loan calculator. Compare HDB vs bank loans, check affordability (MSR/TDSR), calculate stamp duties (BSD/ABSD), CPF usage, grants, and more. Supports HDB BTO, Resale, EC, Condo, and Landed.',
  keywords: ['Singapore', 'HDB', 'home loan calculator', 'property calculator', 'loan calculator', 'stamp duty', 'BSD', 'ABSD', 'CPF', 'housing grant', 'EHG', 'EC', 'condo'],
  openGraph: {
    title: 'Home Loan Calculator',
    description: 'Singapore home loan calculator — HDB, EC, Condo, Landed. Compare loans, grants, stamp duties, CPF usage.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
