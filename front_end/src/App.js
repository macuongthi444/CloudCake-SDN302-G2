import { Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import Header from "./components/Header";
import { AuthProvider } from './pages/Login/context/AuthContext';
import ForgotPassword from './forgotPassword/ForgotPassword';
import UserProfile from "./pages/UserProfile/UserProfile";
import ResetPassword from './forgotPassword/ResetPassword';
import ProtectedRoute from './route/ProtectedRoute';
import RoleRedirect from './route/RoleRedirect'; 
import AdminLayout from './admin/AdminLayout';
import CartPage from './pages/Cart/CartPage';

import   AdminRoute from './route/ProtectedRoute';

function App() {
  const location = useLocation();
  const noHeaderPaths = ['/register', '/login', '/admin', '/forgot-password', '/reset-password', '/cart'];
  const noHeaderPage = noHeaderPaths.includes(location.pathname) || location.pathname.startsWith('/admin/');
  const noRedirectPaths = ['/login', '/register', '/admin', '/seller-dashboard', '/forgot-password', '/reset-password', '/cart'];

  const shouldRedirect = !noRedirectPaths.includes(location.pathname) &&
    !location.pathname.startsWith('/admin/') &&
    !location.pathname.startsWith('/seller-dashboard/') &&
    !location.pathname.startsWith('/cart');
  return (
    <div className="App">
      <AuthProvider>
        {!noHeaderPage && <Header />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
         <Route path="/user-profile/*" element={
            <ProtectedRoute>
              {shouldRedirect ? (
                <RoleRedirect>
                  <UserProfile />
                </RoleRedirect>
              ) : (
                <UserProfile />
              )}
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } />

          <Route path="/cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
