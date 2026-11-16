import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
import AppAccountBar from "@/components/auth/AppAccountBar";
import NavigationLoading from "@/components/layout/NavigationLoading";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Party Play",
  description: "Trò chơi vui cùng bạn bè và thử thách tiếng Anh.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white!">
        <AppAccountBar />
        <NavigationLoading />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
