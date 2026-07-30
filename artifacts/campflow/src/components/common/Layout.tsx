import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-accent-foreground transition-colors duration-300">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6"> 
        {children}
      </main>
      <Footer />
    </div>
  );
}
