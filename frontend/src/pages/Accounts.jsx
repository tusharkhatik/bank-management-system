import { useEffect, useState } from "react";
import api from "../services/api";

function Accounts() {
  const [accounts, setAccounts] = useState([]);

  const [accountNumber, setAccountNumber] = useState("");
  const [balance, setBalance] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/accounts");
      setAccounts(response.data || []);
    } catch (err) {
      console.error("Failed to load accounts:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load accounts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAccountNumber("");
    setBalance("");
    setCustomerId("");
    setEditingId(null);
  };

  const validateForm = () => {
    if (!accountNumber.trim() || accountNumber.trim().length < 3) {
      setError("Account number must be at least 3 characters.");
      return false;
    }

    const parsedBalance = Number(balance);

    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError("Balance must be a non-negative number.");
      return false;
    }

    const parsedCustomer = Number(customerId);

    if (
      Number.isNaN(parsedCustomer) ||
      !Number.isInteger(parsedCustomer) ||
      parsedCustomer <= 0
    ) {
      setError("Customer ID must be a positive integer.");
      return false;
    }

    return true;
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountNumber: accountNumber.trim(),
        balance: Number(balance),
        customerId: Number(customerId),
      };

      const response = await api.post("/accounts", payload);

      setAccounts((prev) => [...prev, response.data]);

      setMessage("Account created successfully!");

      resetForm();
    } catch (err) {
      console.error("Failed to create account:", err);

      setError(
        err.response?.data?.message ||
        "Failed to create account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);

    setAccountNumber(account.accountNumber || "");
    setBalance(String(account.balance ?? ""));

    setCustomerId(
      String(account.customer?.id ?? account.customerId ?? "")
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountNumber: accountNumber.trim(),
        balance: Number(balance),
        customer: {
          id: Number(customerId),
        },
      };

      const response = await api.put(
        `/accounts/${editingId}`,
        payload
      );

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingId
            ? response.data
            : account
        )
      );

      setMessage("Account updated successfully!");

      resetForm();
    } catch (err) {
      console.error("Failed to update account:", err);

      setError(
        err.response?.data?.message ||
        "Failed to update account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setMessage("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account?"
    );

    if (!confirmed) {
      return;
    }

    const previousAccounts = accounts;

    setAccounts((prev) =>
      prev.filter((account) => account.id !== id)
    );

    setError("");
    setMessage("");

    try {
      await api.delete(`/accounts/${id}`);

      setMessage("Account deleted successfully!");
    } catch (err) {
      console.error("Failed to delete account:", err);

      setAccounts(previousAccounts);

      setError(
        err.response?.data?.message ||
        "Failed to delete account."
      );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Loading accounts...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Accounts</h1>

      <div
        style={{
          maxWidth: 700,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 30,
        }}
      >
        <h2>
          {editingId ? "Edit Account" : "Create Account"}
        </h2>

        <form
          onSubmit={
            editingId
              ? handleUpdateAccount
              : handleCreateAccount
          }
        >
          <div>
            <label>Account Number</label>
            <br />

            <input
              type="text"
              placeholder="Example: ACC10005"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value)
              }
              required
              disabled={submitting}
            />
          </div>

          <br />

          <div>
            <label>Balance</label>
            <br />

            <input
              type="number"
              min="0"
              placeholder="Enter balance"
              value={balance}
              onChange={(e) =>
                setBalance(e.target.value)
              }
              required
              disabled={submitting}
            />
          </div>

          <br />

          <div>
            <label>Customer ID</label>
            <br />

            <input
              type="number"
              min="1"
              placeholder="Example: 2"
              value={customerId}
              onChange={(e) =>
                setCustomerId(e.target.value)
              }
              required
              disabled={submitting}
            />
          </div>

          <br />

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? editingId
                ? "Updating..."
                : "Creating..."
              : editingId
              ? "Update Account"
              : "Create Account"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={submitting}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </form>

        {message && (
          <p style={{ color: "green" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "crimson" }}>
            {error}
          </p>
        )}
      </div>

      <h2>All Accounts</h2>

      {accounts.length === 0 ? (
        <p>No accounts found.</p>
      ) : (
        accounts.map((account) => (
          <div
            key={account.id}
            style={{
              marginBottom: 20,
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 8,
              maxWidth: 700,
            }}
          >
            <h3>{account.accountNumber}</h3>

            <p>
              <strong>Account ID:</strong>{" "}
              {account.id}
            </p>

            <p>
              <strong>Balance:</strong> ₹
              {Number(account.balance ?? 0).toFixed(2)}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {account.customer?.name || "N/A"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {account.customer?.email || "N/A"}
            </p>

            <button
              onClick={() => handleEdit(account)}
              disabled={submitting}
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(account.id)}
              disabled={submitting}
              style={{ marginLeft: 8 }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Accounts;
