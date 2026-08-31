import {
  NavLink,
  Outlet,
} from "react-router-dom";

function MainLayout() {
  const getLinkClass = ({ isActive }) =>
    `sidebar-link ${
      isActive ? "active" : ""
    }`;

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
            className={getLinkClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={getLinkClass}
          >
            Customers
          </NavLink>

          <NavLink
            to="/inventory"
            className={getLinkClass}
          >
            Inventory
          </NavLink>

          <NavLink
            to="/gold-rates"
            className={getLinkClass}
          >
            Gold Rates
          </NavLink>

          <NavLink
            to="/expenses"
            className={getLinkClass}
          >
            Expenses
          </NavLink>

          <NavLink
            to="/payments"
            className={getLinkClass}
          >
            Payments
          </NavLink>

          <NavLink
            to="/customer-ledgers"
            className={getLinkClass}
          >
            Customer Due Ledger
          </NavLink>

          <NavLink
            to="/sales"
            className={getLinkClass}
          >
            Sales
          </NavLink>

          <NavLink
            to="/stock-adjustments"
            className={getLinkClass}
          >
            Stock Adjustments
          </NavLink>

          <NavLink
            to="/low-stock-alerts"
            className={getLinkClass}
          >
            Low Stock Alerts
          </NavLink>

          <NavLink
            to="/custom-orders"
            className={getLinkClass}
          >
            Custom Orders
          </NavLink>

          <NavLink
            to="/emi-plans"
            className={getLinkClass}
          >
            EMI Plans
          </NavLink>

          <NavLink
            to="/emi-installments"
            className={getLinkClass}
          >
            EMI Installments
          </NavLink>

          <NavLink
            to="/emi-risk"
            className={getLinkClass}
          >
            AI EMI Risk Checker
          </NavLink>
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <strong>
              Jewelry Business Management
            </strong>
          </div>

          <span className="badge text-bg-dark">
            Development
          </span>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
