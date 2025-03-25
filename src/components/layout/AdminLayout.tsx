
import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label: string;
  to: string;
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  backButton?: BackButtonProps;
}

export function AdminLayout({ 
  children,
  title,
  description,
  backButton
}: AdminLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 container py-6 md:py-10 animate-fade-in">
        {(title || description || backButton) && (
          <div className="mb-8">
            {backButton && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                asChild
              >
                <Link to={backButton.to}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backButton.label}
                </Link>
              </Button>
            )}
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
        )}
        
        {children}
      </main>
    </>
  );
}
