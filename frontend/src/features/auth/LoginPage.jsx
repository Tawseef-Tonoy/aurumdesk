import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "./AuthContext";

function LoginPage() {
  const {
    login,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const destination =
    location.state?.from ||
    "/";

  if (isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      navigate(
        destination,
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background:
          "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      }}
    >
      <div
        className="card shadow border-0"
        style={{
          width: "100%",
          maxWidth: "430px",
        }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="fw-bold mb-2"
              style={{
                fontSize: "2rem",
                letterSpacing:
                  "0.04em",
              }}
            >
              AurumDesk
            </div>

            <h1 className="h5 mb-1">
              Sign in
            </h1>

            <p className="text-muted mb-0">
              Jewelry Business
              Management System
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="owner@aurumdesk.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="password"
                className="form-label"
              >
                Password
              </label>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="form-control"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-check mb-4">
              <input
                id="showPassword"
                type="checkbox"
                className="form-check-input"
                checked={
                  showPassword
                }
                onChange={(event) =>
                  setShowPassword(
                    event.target
                      .checked
                  )
                }
              />

              <label
                className="form-check-label"
                htmlFor="showPassword"
              >
                Show password
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              Authorized AurumDesk
              users only
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
