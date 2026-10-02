import { Route, Routes } from "react-router-dom";
import "./App.css";
import MainLayout from "./Layouts/MainLayout";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import useUserSync from "./hooks/useUserSync";
import Home from "./pages/Home";
import Products from "./pages/Products";
import useAuthCheck from "./hooks/useAuthCheck";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderSuccess from "./pages/OrderSuccess";
import OrderCancel from "./pages/OrderCancel";
import BackToTop from "./components/BackToTop";
import AdminRoute from "./components/AdminRoute";
import OrderPlaced from "./pages/OrderPlaced";
import AdminCashOrders from "./pages/AdminCashOrders";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTaxonomy from "./pages/admin/AdminTaxonomy";

function App() {
  useAuthCheck();
  useUserSync();
  return (
    <>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="order-cancel" element={<OrderCancel />} />
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="profile" element={<Profile />} />
            <Route path="order-placed/:orderId" element={<OrderPlaced />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="catalog" element={<AdminTaxonomy />} />
                <Route path="cash-orders" element={<AdminCashOrders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
      <BackToTop />
    </>
  );
}

export default App;
