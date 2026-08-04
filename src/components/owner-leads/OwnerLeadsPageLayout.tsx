import React from 'react';

interface OwnerLeadsPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function OwnerLeadsPageLayout({ title, description, children }: OwnerLeadsPageLayoutProps) {
  return (
    <div className="min-h-screen bg-cream px-4 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
