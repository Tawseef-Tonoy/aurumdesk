import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "./AuthContext";

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border"
            role="status"
          />

          <p className="mt-3 text-muted">
            Checking login...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
