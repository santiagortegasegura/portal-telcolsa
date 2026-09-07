import "./globals.css";

export const metadata = {
  title: "Portal Telcolsa",
  description: "Panel interno de Telcolsa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
