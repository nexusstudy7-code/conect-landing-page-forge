import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ChatButton from "./components/ChatButton";

const Index = lazy(() => import("./pages/Index"));
const AgendaPage = lazy(() => import("./pages/AgendaPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ChatButton />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/portfolio" element={<PortfolioPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
