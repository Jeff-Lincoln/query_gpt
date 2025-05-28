import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                  <Header />
            <div className="flex flex-col">
              {children}
            </div>
        </body>
      </html>
  );
}