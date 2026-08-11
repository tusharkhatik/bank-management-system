import { useEffect, useState } from "react";
import api from "../services/api";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get("/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading transactions...</h2>;
  }

  return (
    <div>
      <h1>Transaction History</h1>

      {error && <p>{error}</p>}

      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        transactions.map((transaction) => (
          <div key={transaction.id}>
            <p>
              <strong>Transaction ID:</strong> {transaction.id}
            </p>

            <p>
              <strong>Type:</strong> {transaction.type}
            </p>

            <p>
              <strong>Amount:</strong> ₹{transaction.amount}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {transaction.createdAt || "N/A"}
            </p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Transactions;