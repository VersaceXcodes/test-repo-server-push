import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* Import shared global views */
import GV_Header from "@/components/views/GV_Header";
import GV_Sidebar from "@/components/views/GV_Sidebar";
import GV_Footer from "@/components/views/GV_Footer";
import GV_DeleteConfirmationModal from "@/components/views/GV_DeleteConfirmationModal";
import GV_Notifications from "@/components/views/GV_Notifications";

/* Import unique views */
import UV_Login from "@/components/views/UV_Login";
import UV_ForgotPassword from "@/components/views/UV_ForgotPassword";
import UV_Registration from "@/components/views/UV_Registration";
import UV_Dashboard from "@/components/views/UV_Dashboard";
import UV_PropertyListing from "@/components/views/UV_PropertyListing";
import UV_PropertyDetail from "@/components/views/UV_PropertyDetail";
import UV_PropertyCreate from "@/components/views/UV_PropertyCreate";
import UV_PropertyEdit from "@/components/views/UV_PropertyEdit";

// Assuming the Zustand store hook is exported as useAppStore
import useAppStore from "@/store/appStore";

// Global Error Boundary to catch render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// A simple 404 Not Found component
const UV_NotFound: React.FC = () => (
  <div className="p-4">
    <h2>404: Page Not Found</h2>
  </div>
);

// ProtectedRoute to guard private routes
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const authToken = useAppStore((state) => state.auth_token);
  const location = useLocation();
  if (!authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const location = useLocation();

  // Define routes that do NOT use the sidebar (public/auth flows)
  const hideSidebarRoutes = ["/login", "/forgot-password", "/register"];
  const showSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <GV_Header />
      <GV_Notifications />
      <div className="flex flex-1">
        {showSidebar && <GV_Sidebar />}
        <main className="flex-1 p-4">
          <Routes>
            {/* Public / Authentication routes */}
            <Route path="/login" element={<UV_Login />} />
            <Route path="/forgot-password" element={<UV_ForgotPassword />} />
            <Route path="/register" element={<UV_Registration />} />

            {/* Protected (private) routes wrapped by ProtectedRoute */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <UV_Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <ProtectedRoute>
                  <UV_PropertyListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/create"
              element={
                <ProtectedRoute>
                  <UV_PropertyCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/:id"
              element={
                <ProtectedRoute>
                  <UV_PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/:id/edit"
              element={
                <ProtectedRoute>
                  <UV_PropertyEdit />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route to display 404 for unknown paths */}
            <Route path="*" element={<UV_NotFound />} />
          </Routes>
        </main>
      </div>
      <GV_Footer />
      <GV_DeleteConfirmationModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

// Root component wrapping the app with BrowserRouter for proper routing context
const Root: React.FC = () => {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

export default Root;