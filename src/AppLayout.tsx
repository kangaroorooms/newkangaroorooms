import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: LayoutProps) {
  const location = useLocation();

  // Hide navbar on auth pages
  const isAuthPage = location.pathname.includes("/auth");
  const shouldHideNavbar = isAuthPage;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-dvh bg-background text-foreground">
      {/* ✅ Navbar (sticky, respects safe-area) */}
      {!shouldHideNavbar && (
        <header className="sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur">
          <div className="h-full flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
            <div>
              {/* Logo/Brand placeholder */}
              <span className="font-bold text-lg">Homilivo</span>
            </div>
            {/* Navigation items can go here */}
          </div>
        </header>
      )}

      {/* ✅ Main Content - no overflow to allow natural document scroll */}
      <main>
        {children}
      </main>

      {/* ✅ Footer */}
      <footer className="h-16 border-t bg-background/80 backdrop-blur">
        <div className="h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
          <span>© 2025 Kangaroo Alphabet Private Limited. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
