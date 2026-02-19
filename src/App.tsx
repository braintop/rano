import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Accessibility from "./pages/Accessibility";
import AdminLeads from "./pages/AdminLeads";
import AdminArticles from "./pages/AdminArticles";
import NotFound from "./pages/NotFound";
import ArticlePage from "./pages/ArticlePage";
import DebugArticle from "./pages/DebugArticle";
import MobileFloatingButtons from "./components/MobileFloatingButtons";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/debug-article/:slug" element={<DebugArticle />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/0522577194/admin" element={<AdminLeads />} />
          <Route path="/0522577194/admin/articles" element={<AdminArticles />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileFloatingButtons />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
