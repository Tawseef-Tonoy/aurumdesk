import {
  NavLink,
  Outlet,
} from "react-router-dom";

function MainLayout() {
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
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            Customers
          </NavLink>


          <NavLink
            to="/gold-rates"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            Gold Rates
          </NavLink>

          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
              Expenses
          </NavLink>


          <NavLink
              to="/payments"
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
          >
              Payments
          </NavLink>
          
          
          <NavLink
            to="/sales"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            Sales
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