import {
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

import CustomersPage from "./features/customers/CustomersPage";
import CustomerFormPage from "./features/customers/CustomerFormPage";

import GoldRatesPage from "./features/goldRates/GoldRatesPage";
import GoldRateFormPage from "./features/goldRates/GoldRateFormPage";
import GoldRateEditPage from "./features/goldRates/GoldRateEditPage";

import ExpensesPage from "./features/expenses/ExpensesPage";
import ExpenseFormPage from "./features/expenses/ExpenseFormPage";
import ExpenseEditPage from "./features/expenses/ExpenseEditPage";

import PaymentsPage from "./features/payments/PaymentsPage";
import PaymentFormPage from "./features/payments/PaymentFormPage";
import PaymentEditPage from "./features/payments/PaymentEditPage";

import SalesPage from "./features/sales/SalesPage";
import SaleFormPage from "./features/sales/SaleFormPage";
import SaleDetailsPage from "./features/sales/SaleDetailsPage";



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
          path="gold-rates"
          element={<GoldRatesPage />}
        />

        <Route
          path="gold-rates/new"
          element={<GoldRateFormPage />}
        />

        <Route
          path="gold-rates/:id/edit"
          element={<GoldRateEditPage />}
        />

        <Route
          path="expenses"
          element={<ExpensesPage />}
        />


        <Route
          path="expenses/new"
          element={<ExpenseFormPage />}
        />


        <Route
          path="expenses/:id/edit"
          element={<ExpenseEditPage />}
        />
        
        <Route
          path="payments"
          element={<PaymentsPage />}
        />


        <Route
            path="payments/new"
            element={<PaymentFormPage />}
        />


        <Route
            path="payments/:id/edit"
            element={<PaymentEditPage />}
        />


        <Route
          path="sales"
          element={<SalesPage />}
        />

        <Route
          path="sales/new"
          element={<SaleFormPage />}
        />

        <Route
          path="/sales/:id"
          element={<SaleDetailsPage/>}
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