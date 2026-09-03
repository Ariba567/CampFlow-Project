import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-accent-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}