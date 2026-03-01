import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./src/store/store";
import { useAppSelector, useAppDispatch } from "./src/store/hooks";
import { getCurrentUser } from "./src/store/slices/auth.slice";
import { loadCities, loadAmenities } from "./src/store/slices/metadata.slice";
import { hideToast } from "./src/store/slices/ui.slice";
import { Home } from "./pages/Home";
import { RoomsListing } from "./pages/RoomsListing";
import { RoomDetails } from "./pages/RoomDetails";
import { OwnerInfo } from "./pages/OwnerInfo";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { GoogleCallback } from "./pages/GoogleCallback";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Profile } from "./pages/Profile";
import Pricing from "./pages/Pricing";
import { Navbar } from "./components/Navbar";
import { Toast } from "./components/Toast";
import { PhoneOtpModal } from "./components/PhoneOtpModal";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProperties } from "./pages/admin/AdminProperties";
import { AdminPropertyDetail } from "./pages/admin/AdminPropertyDetail";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminAgentAssignments } from "./pages/admin/AdminAgentAssignments";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AgentDashboard } from "./pages/agent/AgentDashboard";
import { AgentRoute } from "./components/agent/AgentRoute";
import { TenantDashboard } from "./pages/tenant/TenantDashboard";
import { TenantRoute } from "./components/tenant/TenantRoute";
import { IdempotencyArchitecture } from "./pages/architecture/IdempotencyArchitecture";
import { OutboxArchitecture } from "./pages/architecture/OutboxArchitecture";
import { useTheme } from "./src/hooks/useTheme";
function ScrollToTop() {
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function ProtectedRoute({
  children


}: {children: React.ReactNode;}) {
  const {
    user,
    authStatus,
    loading
  } = useAppSelector((state) => state.auth);
  // STEP 3: Block UI while auth is initializing — prevents race condition redirect
  if (authStatus === "INITIALIZING" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-slate-700 border-t-[#1E293B] dark:border-t-white mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verifying your session…
          </p>
        </div>
      </div>;
  }
  // FIXED: Check for both lowercase and uppercase OWNER role
  const isOwner = user?.role === "owner" || user?.role === "OWNER";
  if (authStatus === "UNAUTHENTICATED" || !user || !isOwner) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}
function AppContent() {
  const dispatch = useAppDispatch();
  const {
    toast
  } = useAppSelector((state) => state.ui);
  const {
    token
  } = useAppSelector((state) => state.auth);
  const {
    pathname
  } = useLocation();
  // Initialize dark mode on app mount
  useTheme();
  // Hide main Navbar on standalone documentation pages
  const isStandalonePage = pathname.startsWith("/architecture");
  // Load user if token exists
  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [token, dispatch]);
  // Load metadata on app initialization
  useEffect(() => {
    dispatch(loadCities());
    dispatch(loadAmenities());
  }, [dispatch]);
  return <div>
      {!isStandalonePage && <Navbar />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => dispatch(hideToast())} />}

      <PhoneOtpModal />

      <main className="pt-16 md:pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<RoomsListing />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/owners" element={<OwnerInfo />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route path="/dashboard" element={<ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Google OAuth Callback Route */}
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Architecture Documentation */}
          <Route path="/architecture/idempotency" element={<IdempotencyArchitecture />} />

          <Route path="/architecture/outbox" element={<OutboxArchitecture />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute>
                <AdminDashboard />
              </AdminRoute>} />

          <Route path="/admin/properties" element={<AdminRoute>
                <AdminProperties />
              </AdminRoute>} />

          <Route path="/admin/properties/:id" element={<AdminRoute>
                <AdminPropertyDetail />
              </AdminRoute>} />

          <Route path="/admin/users" element={<AdminRoute>
                <AdminUsers />
              </AdminRoute>} />

          <Route path="/admin/agent-assignments" element={<AdminRoute>
                <AdminAgentAssignments />
              </AdminRoute>} />

          {/* Agent Routes */}
          <Route path="/agent/dashboard" element={<AgentRoute>
                <AgentDashboard />
              </AgentRoute>} />

          <Route path="/admin/properties/:id" element={<AdminRoute>
                <AdminPropertyDetail />
              </AdminRoute>} />

          <Route path="/admin/users" element={<AdminRoute>
                <AdminUsers />
              </AdminRoute>} />

          <Route path="/admin/agent-assignments" element={<AdminRoute>
                <AdminAgentAssignments />
              </AdminRoute>} />

          {/* Agent Routes */}
          <Route path="/agent/dashboard" element={<AgentRoute>
                <AgentDashboard />
              </AgentRoute>} />

          {/* Tenant Routes */}
          <Route path="/tenant/dashboard" element={<TenantRoute>
                <TenantDashboard />
              </TenantRoute>} />
        </Routes>
      </main>
    </div>;
}
export function App() {
  return <Provider store={store}>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </Provider>;
}