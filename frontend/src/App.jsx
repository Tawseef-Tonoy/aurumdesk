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

import InventoryPage from "./features/inventory/InventoryPage";
import InventoryFormPage from "./features/inventory/InventoryFormPage";

import StockAdjustmentsPage from "./features/stockAdjustments/StockAdjustmentsPage";
import StockAdjustmentFormPage from "./features/stockAdjustments/StockAdjustmentFormPage";
import StockAdjustmentDetailsPage from "./features/stockAdjustments/StockAdjustmentDetailsPage";

import LowStockAlertsPage from "./features/lowStockAlerts/LowStockAlertsPage";

import CustomOrdersPage from "./features/customOrders/CustomOrdersPage";
import CustomOrderFormPage from "./features/customOrders/CustomOrderFormPage";
import CustomOrderDetailsPage from "./features/customOrders/CustomOrderDetailsPage";

import EMIPlansPage from "./features/emi/EMIPlansPage";
import EMIPlanFormPage from "./features/emi/EMIPlanFormPage";
import EMIPlanDetailsPage from "./features/emi/EMIPlanDetailsPage";
import EMIInstallmentsPage from "./features/emi/EMIInstallmentsPage";
import EMIRiskCheckerPage from "./features/emi/EMIRiskCheckerPage";

import CustomerDueLedgerPage from "./features/ledger/CustomerDueLedgerPage";
import LedgerAdjustmentFormPage from "./features/ledger/LedgerAdjustmentFormPage";

import ReturnExchangesPage from "./features/returnExchanges/ReturnExchangesPage";
import ReturnExchangeFormPage from "./features/returnExchanges/ReturnExchangeFormPage";
import ReturnExchangeDetailsPage from "./features/returnExchanges/ReturnExchangeDetailsPage";

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
            path="customer-ledgers"
            element={<CustomerDueLedgerPage />}
        />

        <Route
          path="customer-ledgers/adjustments/new"
          element={<LedgerAdjustmentFormPage />}
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
          path="sales/:id"
          element={<SaleDetailsPage />}
        />

        <Route
          path="return-exchanges"
          element={<ReturnExchangesPage />}
        />

        <Route
          path="return-exchanges/new"
          element={<ReturnExchangeFormPage />}
        />

        <Route
          path="return-exchanges/:id/edit"
          element={<ReturnExchangeFormPage />}
        />

        <Route
          path="return-exchanges/:id"
          element={<ReturnExchangeDetailsPage />}
        />

        <Route
          path="inventory"
          element={<InventoryPage />}
        />

        <Route
          path="inventory/new"
          element={<InventoryFormPage />}
        />

        <Route
          path="inventory/:id/edit"
          element={<InventoryFormPage />}
        />

        <Route
          path="stock-adjustments"
          element={<StockAdjustmentsPage />}
        />

        <Route
          path="stock-adjustments/new"
          element={<StockAdjustmentFormPage />}
        />

        <Route
          path="stock-adjustments/:id"
          element={<StockAdjustmentDetailsPage />}
        />

        <Route
          path="low-stock-alerts"
          element={<LowStockAlertsPage />}
        />

        <Route
          path="custom-orders"
          element={<CustomOrdersPage />}
        />

        <Route
          path="custom-orders/new"
          element={<CustomOrderFormPage />}
        />

        <Route
          path="custom-orders/:id"
          element={<CustomOrderDetailsPage />}
        />

        <Route
          path="custom-orders/:id/edit"
          element={<CustomOrderFormPage />}
        />

        <Route
          path="emi-plans"
          element={<EMIPlansPage />}
        />

        <Route
          path="emi-plans/new"
          element={<EMIPlanFormPage />}
        />

        <Route
          path="emi-plans/:id/edit"
          element={<EMIPlanFormPage />}
        />

        <Route
          path="emi-plans/:id"
          element={<EMIPlanDetailsPage />}
        />

        <Route
          path="emi-installments"
          element={<EMIInstallmentsPage />}
        />

        <Route
          path="emi-risk"
          element={<EMIRiskCheckerPage />}
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
