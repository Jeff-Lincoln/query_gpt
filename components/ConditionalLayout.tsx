// components/ConditionalLayout.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AuthLayout } from './AuthLayout';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not signed in, show auth layout
  if (!isSignedIn) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  // If user is signed in, show the full app with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}