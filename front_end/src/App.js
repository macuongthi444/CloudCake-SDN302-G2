import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import { CartProvider } from "./pages/Login/context/CartContext"; // ← ĐÃ CÓ
import Header from "./components/Header";
import { AuthProvider } from "./pages/Login/context/AuthContext";
import ForgotPassword from "./forgotPassword/ForgotPassword";
import UserProfile from "./pages/UserProfile/UserProfile";
import ResetPassword from "./forgotPassword/ResetPassword";
import ProtectedRoute from "./route/ProtectedRoute";
import RoleRedirect from "./route/RoleRedirect";
import AdminLayout from "./admin/AdminLayout";
import SellerLayout from "./seller/SellerLayout";
import CartPage from "./pages/Cart/CartPage";
import CheckoutPage from "./pages/Cart/CheckoutPage";
import PaymentResultPage from "./pages/Payment/PaymentResultPage";
import ProductList from "./pages/Products/ProductList";
import ProductDetail from "./pages/Products/ProductDetail";
import HomePage from "./pages/Home/HomePage";
import IntroductionPage from "./pages/Introduction/IntroductionPage";
import AdminRoute from "./route/ProtectedRoute";
    
function App() {
  const location = useLocation();
  const noHeaderPaths = [
    "/register",
    "/login",
    "/admin",
    "/forgot-password",
    "/reset-password",
    "/cart",
  ];
  const noHeaderPage =
    noHeaderPaths.includes(location.pathname) ||
    location.pathname.startsWith("/admin/");
  const noRedirectPaths = [
    "/login",
    "/register",
    "/admin",
    "/seller-dashboard",
    "/forgot-password",
    "/reset-password",
    "/cart",
  ];

  const shouldRedirect =
    !noRedirectPaths.includes(location.pathname) &&
    !location.pathname.startsWith("/admin/") &&
    !location.pathname.startsWith("/seller-dashboard/") &&
    !location.pathname.startsWith("/cart");

  return (
    <div className="App">
      <AuthProvider>
        {!noHeaderPage && <Header />}

        {/* THÊM CartProvider Ở ĐÂY */}
        <CartProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/introduction" element={<IntroductionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/user-profile/*"
              element={
                <ProtectedRoute>
                  {shouldRedirect ? (
                    <RoleRedirect>
                      <UserProfile />
                    </RoleRedirect>
                  ) : (
                    <UserProfile />
                  )}
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            />

            <Route
              path="/seller/*"
              element={
                <ProtectedRoute>
                  <SellerLayout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-result"
              element={<PaymentResultPage />}
            />

            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
          </Routes>
        </CartProvider>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </div>
  );
}

export default App;
