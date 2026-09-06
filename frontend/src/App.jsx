import {
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import {
  AuthProvider,
} from "./features/auth/AuthContext";

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

import CustomerDueLedgerPage from "./features/ledger/CustomerDueLedgerPage";
import LedgerAdjustmentFormPage from "./features/ledger/LedgerAdjustmentFormPage";

import SalesPage from "./features/sales/SalesPage";
import SaleFormPage from "./features/sales/SaleFormPage";
import SaleDetailsPage from "./features/sales/SaleDetailsPage";

import ReturnExchangesPage from "./features/returnExchanges/ReturnExchangesPage";
import ReturnExchangeFormPage from "./features/returnExchanges/ReturnExchangeFormPage";
import ReturnExchangeDetailsPage from "./features/returnExchanges/ReturnExchangeDetailsPage";

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

import PurchasesPage from "./features/purchases/PurchasesPage";
import PurchaseFormPage from "./features/purchases/PurchaseFormPage";
import PurchaseDetailsPage from "./features/purchases/PurchaseDetailsPage";

import SuppliersPage from "./features/suppliers/SuppliersPage";
import SupplierFormPage from "./features/suppliers/SupplierFormPage";

import WorkersPage from "./features/workers/WorkersPage";
import WorkerFormPage from "./features/workers/WorkerFormPage";

import CashClosingPage from "./features/cashClosing/CashClosingPage";

import MonthlyReportPage from "./features/monthlyReport/MonthlyReportPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/*
        ==============================================================
        PUBLIC ROUTES
        ==============================================================
        */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/*
        ==============================================================
        PROTECTED ROUTES
        User must be logged in to access anything below.
        ==============================================================
        */}

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            element={<MainLayout />}
          >
            {/*
            ----------------------------------------------------------
            Dashboard
            ----------------------------------------------------------
            */}

            <Route
              index
              element={<DashboardPage />}
            />

            {/*
            ----------------------------------------------------------
            Customers
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Gold Rates
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Expenses
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Payments
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Customer Due Ledger
            ----------------------------------------------------------
            */}

            <Route
              path="customer-ledgers"
              element={<CustomerDueLedgerPage />}
            />

            <Route
              path="customer-ledgers/adjustments/new"
              element={<LedgerAdjustmentFormPage />}
            />

            {/*
            ----------------------------------------------------------
            Sales
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Returns / Exchanges
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Inventory
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Stock Adjustments
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Low Stock Alerts
            ----------------------------------------------------------
            */}

            <Route
              path="low-stock-alerts"
              element={<LowStockAlertsPage />}
            />

            {/*
            ----------------------------------------------------------
            Custom Orders
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            EMI
            ----------------------------------------------------------
            */}

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

            {/*
            ----------------------------------------------------------
            Purchases
            ----------------------------------------------------------
            */}

            <Route
              path="purchases"
              element={<PurchasesPage />}
            />

            <Route
              path="purchases/new"
              element={<PurchaseFormPage />}
            />

            <Route
              path="purchases/:id"
              element={<PurchaseDetailsPage />}
            />

            {/*
            ----------------------------------------------------------
            Suppliers
            ----------------------------------------------------------
            */}

            <Route
              path="suppliers"
              element={<SuppliersPage />}
            />

            <Route
              path="suppliers/new"
              element={<SupplierFormPage />}
            />

            {/*
            ----------------------------------------------------------
            Workers
            ----------------------------------------------------------
            */}

            <Route
              path="workers"
              element={<WorkersPage />}
            />

            <Route
              path="workers/new"
              element={<WorkerFormPage />}
            />

            {/*
            ----------------------------------------------------------
            Cash Closing
            ----------------------------------------------------------
            */}

            <Route
              path="cash-closing"
              element={<CashClosingPage />}
            />

            {/*
            ----------------------------------------------------------
            Monthly Report
            ----------------------------------------------------------
            */}

            <Route
              path="monthly-report"
              element={<MonthlyReportPage />}
            />

            {/*
            ----------------------------------------------------------
            404
            ----------------------------------------------------------
            */}

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;