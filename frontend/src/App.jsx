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
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedLayout>
              <Customers />
            </ProtectedLayout>
          }
        />

        <Route
          path="/accounts"
          element={
            <ProtectedLayout>
              <Accounts />
            </ProtectedLayout>
          }
        />

        <Route
          path="/deposit"
          element={
            <ProtectedLayout>
              <Deposit />
            </ProtectedLayout>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedLayout>
              <Withdraw />
            </ProtectedLayout>
          }
        />

        <Route
          path="/transfer"
          element={
            <ProtectedLayout>
              <Transfer />
            </ProtectedLayout>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <Admin />
            </ProtectedLayout>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
