import {
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

import CustomersPage from "./features/customers/CustomersPage";
import CustomerFormPage from "./features/customers/CustomerFormPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          index
          element={<DashboardPage />}
        />

        <Route
          path="customers"
          element={<CustomersPage />}
        />

        <Route
          path="customers/new"
          element={<CustomerFormPage />}
        />

        <Route
          path="customers/:id/edit"
          element={<CustomerFormPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;