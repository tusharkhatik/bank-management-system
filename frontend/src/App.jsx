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

/* =========================================================
   ROLE HELPER
========================================================= */

function getUserRole() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    const role = user?.role;

    if (!role) {
      return null;
    }

    return String(role)
      .toUpperCase()
      .replace("ROLE_", "");
  } catch {
    return null;
  }
}

/* =========================================================
   AUTHENTICATED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* =========================================================
   ROLE ROUTE
========================================================= */

function RoleRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const userRole = getUserRole();

  /* Not logged in */
  if (!token) {
    return <Navigate to="/" replace />;
  }

  /* Role missing */
  if (!userRole) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/" replace />;
  }

  /* Role not allowed */
  if (!allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to={
          userRole === "ADMIN"
            ? "/admin"
            : "/dashboard"
        }
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   SHARED LAYOUT
========================================================= */

function AuthenticatedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

/* =========================================================
   USER LAYOUT
========================================================= */

function UserLayout({ children }) {
  return (
    <RoleRoute allowedRoles={["USER"]}>
      <Layout>{children}</Layout>
    </RoleRoute>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout({ children }) {
  return (
    <RoleRoute allowedRoles={["ADMIN"]}>
      <Layout>{children}</Layout>
    </RoleRoute>
  );
}

/* =========================================================
   USER + ADMIN LAYOUT
========================================================= */

function UserAndAdminLayout({ children }) {
  return (
    <RoleRoute allowedRoles={["USER", "ADMIN"]}>
      <Layout>{children}</Layout>
    </RoleRoute>
  );
}

/* =========================================================
   DEFAULT REDIRECT
========================================================= */

function HomeRedirect() {
  const token = localStorage.getItem("token");
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "USER") {
    return <Navigate to="/dashboard" replace />;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  return <Navigate to="/" replace />;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* =================================================
            USER ONLY
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <UserLayout>
              <Dashboard />
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

        {/* =================================================
            USER + ADMIN
        ================================================= */}

        <Route
          path="/accounts"
          element={
            <UserAndAdminLayout>
              <Accounts />
            </UserAndAdminLayout>
          }
        />

        <Route
          path="/deposit"
          element={
            <UserAndAdminLayout>
              <Deposit />
            </UserAndAdminLayout>
          }
        />

        <Route
          path="/withdraw"
          element={
            <UserAndAdminLayout>
              <Withdraw />
            </UserAndAdminLayout>
          }
        />

        <Route
          path="/transfer"
          element={
            <UserAndAdminLayout>
              <Transfer />
            </UserAndAdminLayout>
          }
        />

        <Route
          path="/transactions"
          element={
            <UserAndAdminLayout>
              <Transactions />
            </UserAndAdminLayout>
          }
        />

        {/* =================================================
            ADMIN ONLY
        ================================================= */}

        <Route
          path="/customers"
          element={
            <AdminLayout>
              <Customers />
            </AdminLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminLayout>
              <Admin />
            </AdminLayout>
          }
        />

        {/* =================================================
            ROOT / UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="/home"
          element={<HomeRedirect />}
        />

        <Route
          path="*"
          element={<HomeRedirect />}
        />

      </Routes>
    </BrowserRouter>
  );
}