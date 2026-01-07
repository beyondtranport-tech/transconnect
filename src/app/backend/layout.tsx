'use client';
import { AppProvider } from '../app-provider';

export default function BackendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppProvider>{children}</AppProvider>;
}
