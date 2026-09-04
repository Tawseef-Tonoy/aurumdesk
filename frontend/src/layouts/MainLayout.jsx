import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../features/auth/AuthContext";

function MainLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const getLinkClass = ({
    isActive,
  }) =>
    `sidebar-link ${
      isActive ? "active" : ""
    }`;

  async function handleLogout() {
    await logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  function prettyRole(role) {
    if (!role) {
      return "";
    }

    return role
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          AurumDesk
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={
              getLinkClass
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={
              getLinkClass
            }
          >
            Customers
          </NavLink>

          <NavLink
            to="/inventory"
            className={
              getLinkClass
            }
          >
            Inventory
          </NavLink>

          <NavLink
            to="/gold-rates"
            className={
              getLinkClass
            }
          >
            Gold Rates
          </NavLink>

          <NavLink
            to="/expenses"
            className={
              getLinkClass
            }
          >
            Expenses
          </NavLink>

          <NavLink
            to="/payments"
            className={
              getLinkClass
            }
          >
            Payments
          </NavLink>

          <NavLink
            to="/sales"
            className={
              getLinkClass
            }
          >
            Sales
          </NavLink>

          <NavLink
            to="/stock-adjustments"
            className={
              getLinkClass
            }
          >
            Stock Adjustments
          </NavLink>

          <NavLink
            to="/low-stock-alerts"
            className={
              getLinkClass
            }
          >
            Low Stock Alerts
          </NavLink>

          <NavLink
            to="/custom-orders"
            className={
              getLinkClass
            }
          >
            Custom Orders
          </NavLink>

          <NavLink
            to="/emi-plans"
            className={
              getLinkClass
            }
          >
            EMI Plans
          </NavLink>

          <NavLink
            to="/emi-installments"
            className={
              getLinkClass
            }
          >
            EMI Installments
          </NavLink>

          <NavLink
            to="/emi-risk"
            className={
              getLinkClass
            }
          >
            AI EMI Risk Checker
          </NavLink>
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <strong>
              Jewelry Business
              Management
            </strong>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="fw-semibold">
                {user?.name}
              </div>

              <small className="text-muted">
                {prettyRole(
                  user?.role
                )}
              </small>
            </div>

            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
