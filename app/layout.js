import './globals.css';

export const metadata = {
  title: 'Mission Control · PSPO + PMP',
  description: 'Mission Control - PMP/PSPO exam prep tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
