import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import AdminInventory from "./pages/AdminInventory";
import AdminNotifications from "./pages/AdminNotifications";
import AdminDescriptionRegeneration from "./pages/AdminDescriptionRegeneration";
import AdminAutoFill from "./pages/AdminAutoFill";
import AdminPhotoSource from "./pages/AdminPhotoSource";
import AdminPhotoApproval from "./pages/AdminPhotoApproval";
import AdminSubCategories from "./pages/AdminSubCategories";
import ProductDetail from "./pages/ProductDetail";
import RentalCart from "./pages/RentalCart";
import Favourites from "./pages/Favourites";
import ConsumableDetail from "./pages/ConsumableDetail";
import Consumables from "./pages/Consumables";
import Bundles from "./pages/Bundles";
import BundleDetail from "./pages/BundleDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBundles from "./pages/AdminBundles";
import AdminConsumables from "./pages/AdminConsumables";
import AdminActivityLog from "./pages/AdminActivityLog";
import AdminExport from "./pages/AdminExport";
import AdminEnquiryTracking from "./pages/AdminEnquiryTracking";
import AdminRentalCalendar from "./pages/AdminRentalCalendar";
import GetAQuote from "./pages/GetAQuote";
import EquipmentCatalogue from "./pages/EquipmentCatalogue";
import ComparisonBar from "./components/ComparisonBar";
import Register from "./pages/Register";
import Account from "./pages/Account";
import BookingConfirmation from "./pages/BookingConfirmation";
import AdminMembers from "./pages/AdminMembers";
import AdminOrders from "./pages/AdminOrders";
import AdminTeam from "./pages/AdminTeam";
import AdminDeliveryCalendar from "./pages/AdminDeliveryCalendar";
import SavedCarts from "./pages/SavedCarts";
import ReferralPage from "./pages/ReferralPage";
import WarehouseOrders from "./pages/WarehouseOrders";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import DeliveryInfo from "./pages/DeliveryInfo";
import Careers from "./pages/Careers";
import DepositConfirmation from "./pages/DepositConfirmation";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/consumables"} component={Consumables} />
      <Route path={"/bundles"} component={Bundles} />
      <Route path={"/bundle/:id"} component={BundleDetail} />
      <Route path={"/consumable/:id"} component={ConsumableDetail} />
      <Route path={"/cart"} component={RentalCart} />
      <Route path={"/favourites"} component={Favourites} />
      <Route path={"/get-a-quote"} component={GetAQuote} />
      <Route path={"/equipment"} component={EquipmentCatalogue} />
      <Route path={"/equipment/:id"} component={ProductDetail} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/inventory"} component={AdminInventory} />
      <Route path={"/admin/notifications"} component={AdminNotifications} />
      <Route path={"/admin/regenerate-descriptions"} component={AdminDescriptionRegeneration} />
      <Route path={"/admin/auto-fill"} component={AdminAutoFill} />
      <Route path={"/admin/photo-source"} component={AdminPhotoSource} />
      <Route path={"/admin/photo-approval"} component={AdminPhotoApproval} />
      <Route path={"/admin/sub-categories"} component={AdminSubCategories} />
      <Route path={"/admin/bundles"} component={AdminBundles} />
      <Route path={"/admin/consumables"} component={AdminConsumables} />
      <Route path={"/admin/activity-log"} component={AdminActivityLog} />
      <Route path={"/admin/export"} component={AdminExport} />
      <Route path={"/admin/enquiry-tracking"} component={AdminEnquiryTracking} />
      <Route path={"/admin/rental-calendar"} component={AdminRentalCalendar} />
      <Route path={"/admin/members"} component={AdminMembers} />
      <Route path={"/admin/orders"} component={AdminOrders} />
      <Route path={"/admin/team"} component={AdminTeam} />
      <Route path={"/admin/delivery-calendar"} component={AdminDeliveryCalendar} />
      <Route path={"/warehouse/orders"} component={WarehouseOrders} />
      <Route path={"/register"} component={Register} />
      <Route path={"/account"} component={Account} />
      <Route path={"/account/saved-carts"} component={SavedCarts} />
      <Route path={"/account/referral"} component={ReferralPage} />
      <Route path={"/booking-confirmation"} component={BookingConfirmation} />
      <Route path={"/terms"} component={TermsAndConditions} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/about"} component={About} />
      <Route path={"/faq"} component={FAQ} />
      <Route path={"/delivery-info"} component={DeliveryInfo} />
      <Route path={"/careers"} component={Careers} />
      <Route path={"/deposit-info"} component={DepositConfirmation} />
      <Route path={"/login"} component={Login} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <ComparisonProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <Router />
              {/* Global sticky comparison bar — visible on all public pages */}
              <ComparisonBar />
            </TooltipProvider>
          </ThemeProvider>
        </ComparisonProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
