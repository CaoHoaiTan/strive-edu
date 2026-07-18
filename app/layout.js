import './globals.css';

export const metadata = {
  title: 'Mission Control · PSPO + PMP',
  description: 'Mission Control - PMP/PSPO exam prep tracker',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080b12' },
    { media: '(prefers-color-scheme: light)', color: '#eef1f6' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var raw = localStorage.getItem('missionControl_pmp_pspo_v1');
  var theme = raw ? JSON.parse(raw).theme : null;
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
            `.trim(),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
