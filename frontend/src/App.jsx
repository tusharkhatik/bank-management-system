import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Accounts from "./pages/Accounts";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import Admin from "./pages/Admin";
import UPI from "./pages/UPI";
import ScanPay from "./pages/ScanPay";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/" replace />;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <ProtectedLayout>
              <Customers />
            </ProtectedLayout>
          }
        />

        {/* Accounts */}
        <Route
          path="/accounts"
          element={
            <ProtectedLayout>
              <Accounts />
            </ProtectedLayout>
          }
        />

        {/* Deposit */}
        <Route
          path="/deposit"
          element={
            <ProtectedLayout>
              <Deposit />
            </ProtectedLayout>
          }
        />

        {/* Withdraw */}
        <Route
          path="/withdraw"
          element={
            <ProtectedLayout>
              <Withdraw />
            </ProtectedLayout>
          }
        />

        {/* Transfer */}
        <Route
          path="/transfer"
          element={
            <ProtectedLayout>
              <Transfer />
            </ProtectedLayout>
          }
        />

        {/* UPI */}
        <Route
          path="/upi"
          element={
            <ProtectedLayout>
              <UPI />
            </ProtectedLayout>
          }
        />

        {/* Scan & Pay */}
        <Route
          path="/scan-pay"
          element={
            <ProtectedLayout>
              <ScanPay />
            </ProtectedLayout>
          }
        />

        {/* Transactions */}
        <Route
          path="/transactions"
          element={
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <Admin />
            </ProtectedLayout>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}