import { useEffect } from 'react';
import { Route,Routes,useLocation  } from "react-router-dom";
import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import Header from "./components/Header";

import { AuthProvider } from './pages/Login/context/AuthContext';

function App() {
  const location = useLocation();
    const noHeaderPaths = ['/register', '/login', '/admin', '/forgot-password', '/reset-password'];
    const noHeaderPage = noHeaderPaths.includes(location.pathname) || location.pathname.startsWith('/admin/');

  return (
    <div className="App">
      <AuthProvider>
        {!noHeaderPage && <Header />}
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
