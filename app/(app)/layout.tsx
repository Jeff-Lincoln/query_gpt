// (app)/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ConditionalLayout } from '@/components/ConditionalLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Query_GPT💯 - Your AI Assistant",
  description: "Intelligent AI companion for instant answers, creative solutions, and deep insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}

