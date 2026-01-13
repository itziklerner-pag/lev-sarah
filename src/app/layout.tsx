import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./providers";
import { ServiceWorkerRegister } from "@/components/common/service-worker-register";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
});

export const metadata: Metadata = {
  title: "לב שרה - תורנות ביקורים",
  description: "מערכת תיאום ביקורים משפחתית",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-hebrew antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
