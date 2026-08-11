import { useEffect, useState } from "react";
import api from "../services/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading customers...</h2>;
  }

  return (
    <div>
      <h1>Customers</h1>

      {error && <p>{error}</p>}

      {customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        customers.map((customer) => (
          <div key={customer.id}>
            <h2>{customer.name}</h2>

            <p>
              <strong>ID:</strong> {customer.id}
            </p>

            <p>
              <strong>Email:</strong> {customer.email}
            </p>

            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Customers;