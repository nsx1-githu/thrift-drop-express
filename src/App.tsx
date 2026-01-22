import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { Footer } from "./components/Footer";
import { ThemeApplier } from "./components/ThemeApplier";
import { SeoApplier } from "./components/SeoApplier";
import { useSecretAdmin } from "./hooks/useSecretAdmin";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Search from "./pages/Search";
import TrackOrder from "./pages/TrackOrder";
import Notifications from "./pages/Notifications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component that uses the secret admin hook (needs to be inside BrowserRouter)
const SecretAdminListener = () => {
  useSecretAdmin();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HelmetProvider>
            <BrowserRouter>
              <SecretAdminListener />
              <ThemeApplier />
              <SeoApplier />
              <div className="min-h-screen bg-background">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <BottomNav />
              </div>
            </BrowserRouter>
          </HelmetProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
