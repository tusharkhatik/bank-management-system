import { useState } from "react";
import api from "../services/api";

function Deposit() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleDeposit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        `/accounts/${accountId}/deposit?amount=${amount}`
      );

      setMessage(
        `Deposit successful! New balance: ₹${response.data.balance}`
      );

      setAccountId("");
      setAmount("");
    } catch (error) {
      console.error("Deposit failed:", error);

      setMessage("Deposit failed. Please check Account ID and amount.");
    }
  };

  return (
    <div>
      <h1>Deposit Money</h1>

      <form onSubmit={handleDeposit}>
        <div>
          <label>Account ID</label>
          <br />

          <input
            type="number"
            placeholder="Enter Account ID"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Amount</label>
          <br />

          <input
            type="number"
            placeholder="Enter Amount"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">
          Deposit
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Deposit;