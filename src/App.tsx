import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createThirdwebClient } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import MyCampaigns from "./pages/MyCampaigns";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Create thirdweb client
const client = createThirdwebClient({
  clientId: "your-client-id" // You'll need to replace this with your actual thirdweb client ID
});

const App = () => (
  <ThirdwebProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateCampaign />} />
                <Route path="/campaign/:id" element={<CampaignDetails />} />
                <Route path="/my-campaigns" element={<MyCampaigns />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThirdwebProvider>
);

export default App;