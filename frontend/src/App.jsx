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

function getUserRole() {
  const storedRole = localStorage.getItem("role");

  if (storedRole) {
    return storedRole;
  }

  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    return user?.role || null;
  } catch {
    return null;
  }
}
function RoleRoute({ role, children }) {
  const token = localStorage.getItem("token");
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== role) {
    return (
      <Navigate
        to={userRole === "ADMIN" ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  return children;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function UserLayout({ children }) {
  return (
    <RoleRoute role="USER">
      <Layout>{children}</Layout>
    </RoleRoute>
  );
}

function AdminLayout({ children }) {
  return (
    <RoleRoute role="ADMIN">
      <Layout>{children}</Layout>
    </RoleRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== LOGIN ==================== */}

        <Route path="/" element={<Login />} />


        {/* ==================== USER DASHBOARD ==================== */}

        <Route
          path="/dashboard"
          element={
            <UserLayout>
              <Dashboard />
            </UserLayout>
          }
        />


        {/* ==================== USER PAGES ==================== */}

        <Route
          path="/customers"
          element={
            <UserLayout>
              <Customers />
            </UserLayout>
          }
        />

        <Route
          path="/accounts"
          element={
            <UserLayout>
              <Accounts />
            </UserLayout>
          }
        />

        <Route
          path="/deposit"
          element={
            <UserLayout>
              <Deposit />
            </UserLayout>
          }
        />

        <Route
          path="/withdraw"
          element={
            <UserLayout>
              <Withdraw />
            </UserLayout>
          }
        />

        <Route
          path="/transfer"
          element={
            <UserLayout>
              <Transfer />
            </UserLayout>
          }
        />

        <Route
          path="/upi"
          element={
            <UserLayout>
              <UPI />
            </UserLayout>
          }
        />

        <Route
          path="/scan-pay"
          element={
            <UserLayout>
              <ScanPay />
            </UserLayout>
          }
        />

        <Route
          path="/transactions"
          element={
            <UserLayout>
              <Transactions />
            </UserLayout>
          }
        />


        {/* ==================== ADMIN ==================== */}

        <Route
          path="/admin"
          element={
            <AdminLayout>
              <Admin />
            </AdminLayout>
          }
        />


        {/* ==================== UNKNOWN ROUTES ==================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                getUserRole() === "ADMIN"
                  ? "/admin"
                  : "/dashboard"
              }
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

