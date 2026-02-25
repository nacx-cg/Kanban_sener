import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coordinación Jurídica del Sector Eléctrico - Tablero Kanban",
  description: "Sistema de gestión de tableros Kanban con seguimiento de tiempo, análisis de patrones de trabajo y características de motivación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
