import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, ChevronRight } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../src/store/hooks";
import { logout } from "../src/store/slices/auth.slice";
import { ThemeToggle } from "./ThemeToggle";
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    user
  } = useAppSelector((state) => state.auth);
  const isAuthPage = location.pathname.includes("/auth");
  const isHomePage = location.pathname === "/";
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = '';
  //   }
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;

    // store original overflow value
    const originalOverflow = document.body.style.overflow;

    // lock scroll when mobile menu is open
    document.body.style.overflow = 'hidden';
    return () => {
      // restore original value correctly
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }, [isOpen]);
  if (isAuthPage) return null;
  const userRole = user?.role?.toUpperCase();
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };
  const getDashboardLink = () => {
    switch (userRole) {
      case "ADMIN":
        return "/admin";
      case "OWNER":
        return "/dashboard";
      case "TENANT":
        return "/tenant/dashboard";
      case "AGENT":
        return "/agent/dashboard";
      default:
        return "/dashboard";
    }
  };
  const getDashboardLabel = () => {
    switch (userRole) {
      case "ADMIN":
        return "Admin Dashboard";
      case "OWNER":
        return "Owner Dashboard";
      case "TENANT":
        return "My Dashboard";
      case "AGENT":
        return "Agent Dashboard";
      default:
        return "Dashboard";
    }
  };
  const isTransparent = isHomePage && !scrolled && window.innerWidth >= 768;

  // ✅ Mobile menu rendered via portal to escape nav's stacking context
  const mobileMenu = ReactDOM.createPortal(<>
      {/* Overlay */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsOpen(false)} />

      {/* Slide-in Panel */}
      <div style={{
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)"
    }} className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-[9999] md:hidden transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="font-playfair font-bold text-xl text-navy dark:text-white">
            Menu
          </span>
          <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-navy dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link to="/rooms" className="flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white transition-colors">
            <span className="font-medium">Find a Room</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </Link>

          {userRole ? <Link to={getDashboardLink()} className="flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white transition-colors">
              <span className="font-medium">{getDashboardLabel()}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link> : <Link to="/owners" className="flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white transition-colors">
              <span className="font-medium">List Property</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>}

          <Link to="/about" className="flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white transition-colors">
            <span className="font-medium">About Us</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </Link>

          <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

          {user ? <>
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl text-navy dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500">View Profile</p>
                </div>
              </Link>
              <button onClick={() => {
            handleLogout();
            setIsOpen(false);
          }} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </> : <div className="space-y-3 pt-2">
              <Link to="/auth/login" className="block w-full py-3 px-4 text-center font-bold text-navy dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Login
              </Link>
              <Link to="/rooms" className="block w-full py-3 px-4 text-center font-bold text-navy bg-gold rounded-xl hover:bg-yellow-500 transition-colors shadow-lg shadow-gold/20">
                Book Now
              </Link>
            </div>}
        </div>
      </div>
    </>, document.body // ✅ Portaled outside <nav>, no stacking context issues
  );
  return <>
      <nav style={{
      paddingTop: "env(safe-area-inset-top)"
    }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparent ? "bg-white/95 md:bg-transparent dark:bg-slate-900/95" : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-[64px] md:min-h-[80px] flex items-center justify-between">
          {" "}
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 bg-navy dark:bg-white rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-lg shadow-navy/10">
              <span className="text-gold dark:text-navy font-playfair font-bold text-xl">
                H
              </span>
            </div>
            <span className={`font-playfair font-bold text-xl tracking-tight transition-colors ${isTransparent ? "text-white" : "text-navy dark:text-white"}`}>
              Homilivo
            </span>
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/rooms" className={`text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
              Find a Room
            </Link>

            {userRole ? <Link to={getDashboardLink()} className={`text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
                {getDashboardLabel()}
              </Link> : <Link to="/owners" className={`text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
                List Property
              </Link>}

            <Link to="/about" className={`text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
              About
            </Link>

            <div className="h-6 w-px bg-slate-200/50 dark:bg-slate-700/50 mx-2" />

            <ThemeToggle />

            {user ? <div className="flex items-center gap-4">
                <Link to="/profile" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-white" : "text-navy dark:text-white"}`}>
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
                <button onClick={handleLogout} className={`p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors ${isTransparent ? "text-slate-300" : "text-slate-400"}`} aria-label="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div> : <div className="flex items-center gap-4">
                <Link to="/auth/login" className={`text-sm font-medium transition-colors hover:text-gold ${isTransparent ? "text-white" : "text-navy dark:text-white"}`}>
                  Login
                </Link>
                <Link to="/rooms" className="px-5 py-2.5 bg-gold text-navy text-sm font-bold rounded-lg hover:bg-yellow-500 transition-colors duration-300 shadow-lg shadow-gold/20">
                  Book Now
                </Link>
              </div>}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${isTransparent ? "text-white hover:bg-white/10" : "text-navy dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation menu" aria-expanded={isOpen}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ✅ Mobile menu is portaled outside <nav> */}
      {mobileMenu}
    </>;
}