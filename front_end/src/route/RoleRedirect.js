// src/components/RoleRedirect.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/Login/context/AuthContext';

const RoleRedirect = ({ children }) => {
  const { isLoggedIn, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isLoggedIn && userRoles.length > 0) {
      // Check for both formats: "ROLE_ADMIN", "ADMIN", etc.
      const hasAdminRole = userRoles.some(role => {
        if (typeof role !== 'string') return false;
        return role.toUpperCase() === 'ROLE_ADMIN' || role.toUpperCase() === 'ADMIN';
      });
      
    //   const hasSellerRole = userRoles.some(role => {
    //     if (typeof role !== 'string') return false;
    //     return role.toUpperCase() === 'ROLE_SELLER' || role.toUpperCase() === 'SELLER';
    //   });
      
      // Redirect based on role
      if (hasAdminRole) {
        navigate('/admin');
      }
    //   } else if (hasSellerRole) {
    //     console.log("User has seller role, redirecting to seller dashboard");
    //     navigate('/seller-dashboard');
    //   }
    }
  }, [isLoggedIn, userRoles, loading, navigate]);

  return children;
};

export default RoleRedirect;