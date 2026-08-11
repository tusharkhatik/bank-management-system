import { useEffect, useState } from "react";
import api from "../services/api";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.get("/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading accounts...</h2>;
  }

  return (
    <div>
      <h1>Accounts</h1>

      {error && <p>{error}</p>}

      {accounts.length === 0 ? (
        <p>No accounts found.</p>
      ) : (
        accounts.map((account) => (
          <div key={account.id}>
            <h2>{account.accountNumber}</h2>

            <p>
              <strong>Account ID:</strong> {account.id}
            </p>

            <p>
              <strong>Balance:</strong> ₹{account.balance}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {account.customer?.name || "N/A"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {account.customer?.email || "N/A"}
            </p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Accounts;