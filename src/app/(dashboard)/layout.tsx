'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { isSubdomainEnabled } from '@/lib/subdomain';
import { WorkspaceNotFound } from '@/components/workspace/WorkspaceNotFound';
import { WorkspaceMismatch } from '@/components/workspace/WorkspaceMismatch';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FreeZoneRuntimeProvider } from '@/contexts/FreeZoneRuntimeContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, token, isLoading } = useAuth();
  const { slug, company, isValid, isLoading: isWorkspaceLoading, isMismatch } = useWorkspace();
  const router = useRouter();

  const isSubdomainActive = isSubdomainEnabled();


  useEffect(() => {
    if (!isLoading && !isWorkspaceLoading) {
      if (!user || !token) {
        router.replace('/login');
      } else if (isSubdomainActive && !slug) {
        router.replace('/login');
      }
    }
  }, [user, token, isLoading, isWorkspaceLoading, slug, isSubdomainActive, router]);

  if (isLoading || isWorkspaceLoading) {
    return (
      <div className="h-screen flex items-center justify-center desk-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !token) return null;

  // Guard against bare root domain ONLY when strict subdomain mode is active
  if (isSubdomainActive && !slug) {
    return null;
  }

  // Guard against non-existent workspace (404) - only when subdomain is active
  if (isSubdomainActive && slug && isValid === false) {
    return <WorkspaceNotFound slug={slug} />;
  }

  // Guard against tenant session mismatch - only when subdomain is active
  if (isSubdomainActive && slug && isMismatch) {
    return <WorkspaceMismatch currentWorkspace={company} activeSlug={slug} />;
  }

  return (
    <div className="flex h-screen overflow-hidden desk-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <FreeZoneRuntimeProvider>
          <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {children}
          </main>
        </FreeZoneRuntimeProvider>
      </div>
    </div>
  );
}

