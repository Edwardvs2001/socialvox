
import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ 
  children,
  title,
  description
}: AdminLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 container py-6 md:py-10 animate-fade-in">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
        )}
        
        {children}
      </main>
    </>
  );
}
