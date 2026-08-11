import { useState } from "react";
import api from "../services/api";

function Withdraw() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        `/accounts/${accountId}/withdraw?amount=${amount}`
      );

      setMessage(
        `Withdrawal successful! New balance: ₹${response.data.balance}`
      );

      setAccountId("");
      setAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);

      setMessage(
        "Withdrawal failed. Please check the account ID, amount, and balance."
      );
    }
  };

  return (
    <div>
      <h1>Withdraw Money</h1>

      <form onSubmit={handleWithdraw}>
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
          Withdraw
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Withdraw;