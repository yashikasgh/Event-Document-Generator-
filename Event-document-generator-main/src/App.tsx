import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProposalGenerator from "./pages/ProposalGenerator.tsx";
import FlyerGenerator from "./pages/FlyerGenerator.tsx";
import AttendancePage from "./pages/AttendancePage.tsx";
import ReportGenerator from "./pages/ReportGenerator.tsx";
import EventsPage from "./pages/EventsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate/proposal" element={<ProposalGenerator />} />
          <Route path="/generate/flyer" element={<FlyerGenerator />} />
          <Route path="/generate/attendance" element={<AttendancePage />} />
          <Route path="/generate/report" element={<ReportGenerator />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
