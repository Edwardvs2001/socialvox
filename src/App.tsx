
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Surveyor from "./pages/Surveyor";
import SurveyDetail from "./pages/SurveyDetail";
import Admin from "./pages/Admin";
import AdminSurveys from "./pages/AdminSurveys";
import AdminSurveyEditor from "./pages/AdminSurveyEditor";
import AdminUsers from "./pages/AdminUsers";
import AdminResults from "./pages/AdminResults";
import AdminResultsList from "./pages/AdminResultsList";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/index" element={<Index />} />
          
          {/* Surveyor Routes */}
          <Route path="/surveyor" element={<Surveyor />} />
          <Route path="/surveyor/survey/:id" element={<SurveyDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/surveys" element={<AdminSurveys />} />
          <Route path="/admin/surveys/new" element={<AdminSurveyEditor />} />
          <Route path="/admin/surveys/edit/:id" element={<AdminSurveyEditor />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/results" element={<AdminResultsList />} />
          <Route path="/admin/results/:id" element={<AdminResults />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
