import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Units from "./pages/Units";
import Doctors from "./pages/Doctors";
import Procedures from "./pages/Procedures";
import Media from "./pages/Media";
import Messages from "./pages/Messages";
import Schedule from "./pages/Schedule";
import Kanban from "./pages/Kanban";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Users from "./pages/Users";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
              <Route path="/procedures" element={<ProtectedRoute><Procedures /></ProtectedRoute>} />
              <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/media" element={<ProtectedRoute><Media /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
