import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../features/auth/AuthContext";

import RoleNavLink from "../features/auth/RoleNavLink";

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

          {/* Dashboard */}

          <RoleNavLink
            to="/"
            end
            className={getLinkClass}
          >
            Dashboard
          </RoleNavLink>

          {/* Customers */}

          <RoleNavLink
            to="/customers"
            className={getLinkClass}
          >
            Customers
          </RoleNavLink>

          {/* Inventory */}

          <RoleNavLink
            to="/inventory"
            className={getLinkClass}
          >
            Inventory
          </RoleNavLink>

          {/* Gold Rates */}

          <RoleNavLink
            to="/gold-rates"
            className={getLinkClass}
          >
            Gold Rates
          </RoleNavLink>

          {/* Sales */}

          <RoleNavLink
            to="/sales"
            className={getLinkClass}
          >
            Sales
          </RoleNavLink>

          {/* Returns / Exchanges */}

          <RoleNavLink
            to="/return-exchanges"
            className={getLinkClass}
          >
            Returns / Exchanges
          </RoleNavLink>

          {/* Customer Payments */}

          <RoleNavLink
            to="/payments"
            className={getLinkClass}
          >
            Payments
          </RoleNavLink>

          {/* Customer Due Ledger */}

          <RoleNavLink
            to="/customer-ledgers"
            className={getLinkClass}
          >
            Customer Due Ledger
          </RoleNavLink>

          {/* Purchases */}

          <RoleNavLink
            to="/purchases"
            className={getLinkClass}
          >
            Purchases
          </RoleNavLink>

          {/* Suppliers */}

          <RoleNavLink
            to="/suppliers"
            className={getLinkClass}
          >
            Suppliers
          </RoleNavLink>

          {/* Stock Adjustments */}

          <RoleNavLink
            to="/stock-adjustments"
            className={getLinkClass}
          >
            Stock Adjustments
          </RoleNavLink>

          {/* Low Stock */}

          <RoleNavLink
            to="/low-stock-alerts"
            className={getLinkClass}
          >
            Low Stock Alerts
          </RoleNavLink>

          {/* Custom Orders */}

          <RoleNavLink
            to="/custom-orders"
            className={getLinkClass}
          >
            Custom Orders
          </RoleNavLink>

          {/* Workers */}

          <RoleNavLink
            to="/workers"
            className={getLinkClass}
          >
            Workers
          </RoleNavLink>

          {/* EMI Plans */}

          <RoleNavLink
            to="/emi-plans"
            className={getLinkClass}
          >
            EMI Plans
          </RoleNavLink>

          {/* EMI Installments */}

          <RoleNavLink
            to="/emi-installments"
            className={getLinkClass}
          >
            EMI Installments
          </RoleNavLink>

          {/* AI EMI Risk */}

          <RoleNavLink
            to="/emi-risk"
            className={getLinkClass}
          >
            AI EMI Risk Checker
          </RoleNavLink>

          {/* Expenses */}

          <RoleNavLink
            to="/expenses"
            className={getLinkClass}
          >
            Expenses
          </RoleNavLink>

          {/* Cash Closing */}

          <RoleNavLink
            to="/cash-closing"
            className={getLinkClass}
          >
            Daily Cash Closing
          </RoleNavLink>

          {/* Monthly Owner Report */}

          <RoleNavLink
            to="/monthly-report"
            className={getLinkClass}
          >
            Monthly Owner Report
          </RoleNavLink>

        </nav>
      </aside>

      <div className="main-panel">

        {/* Top Bar */}

        <header className="topbar">
          <div>
            <strong>
              Jewelry Business Management
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
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </header>

        {/* Page Content */}

        <main className="page-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default MainLayout;