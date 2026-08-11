import { useState } from "react";
import api from "../services/api";

function Transfer() {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleTransfer = async (e) => {
    e.preventDefault();

    try {
      await api.post("/accounts/transfer", {
        fromAccountId: Number(fromAccountId),
        toAccountId: Number(toAccountId),
        amount: Number(amount),
      });

      setMessage("Transfer successful!");

      setFromAccountId("");
      setToAccountId("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);

      setMessage(
        "Transfer failed. Please check the account details and balance."
      );
    }
  };

  return (
    <div>
      <h1>Transfer Money</h1>

      <form onSubmit={handleTransfer}>
        <div>
          <label>From Account ID</label>
          <br />

          <input
            type="number"
            placeholder="Enter sender account ID"
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>To Account ID</label>
          <br />

          <input
            type="number"
            placeholder="Enter receiver account ID"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Amount</label>
          <br />

          <input
            type="number"
            placeholder="Enter amount"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">
          Transfer
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Transfer;