import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Accounts from "./pages/Accounts";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <>
              <Navbar />
              <Dashboard />
            </>
          }
        />

        {/* Banking */}
        <Route
          path="/customers"
          element={
            <>
              <Navbar />
              <Customers />
            </>
          }
        />

        <Route
          path="/accounts"
          element={
            <>
              <Navbar />
              <Accounts />
            </>
          }
        />

        <Route
          path="/deposit"
          element={
            <>
              <Navbar />
              <Deposit />
            </>
          }
        />

        <Route
          path="/withdraw"
          element={
            <>
              <Navbar />
              <Withdraw />
            </>
          }
        />

        <Route
          path="/transfer"
          element={
            <>
              <Navbar />
              <Transfer />
            </>
          }
        />

        <Route
          path="/transactions"
          element={
            <>
              <Navbar />
              <Transactions />
            </>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <>
              <Navbar />
              <Admin />
            </>
          }
        />

        {/* Invalid URL */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;