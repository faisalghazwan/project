import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { BottomNav } from "./_components/bottom-nav";

export const metadata: Metadata = {
  title: "reps",
  description: "workout log",
  appleWebApp: {
    capable: true,
    title: "reps",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex-1 pb-2">{children}</div>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
