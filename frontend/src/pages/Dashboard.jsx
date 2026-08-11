import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [customersResponse, accountsResponse] = await Promise.all([
        api.get("/customers"),
        api.get("/accounts"),
      ]);

      setCustomers(customersResponse.data);
      setAccounts(accountsResponse.data);
    } catch (error) {
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.balance || 0),
    0
  );

  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div className="dashboard">
      <h1>Bank Dashboard</h1>

      <div className="stats">
        <div className="stat-card">
          <h3>Total Customers</h3>
          <h2>{customers.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Total Accounts</h3>
          <h2>{accounts.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Total Balance</h3>
          <h2>₹ {totalBalance.toFixed(2)}</h2>
        </div>
      </div>

      <div className="accounts">
        <h2>Accounts</h2>

        {accounts.length === 0 ? (
          <p>No accounts found.</p>
        ) : (
          accounts.map((account) => (
            <div className="account-card" key={account.id}>
              <h3>{account.accountNumber}</h3>

              <p>
                <strong>Account ID:</strong> {account.id}
              </p>

              <p>
                <strong>Balance:</strong> ₹ {account.balance}
              </p>

              <p>
                <strong>Customer:</strong>{" "}
                {account.customer?.name || "N/A"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;