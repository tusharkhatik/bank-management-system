import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <h2>Bank Management System</h2>

      <Link to="/dashboard">Dashboard</Link>
      <Link to="/customers">Customers</Link>
      <Link to="/accounts">Accounts</Link>
      <Link to="/deposit">Deposit</Link>
      <Link to="/withdraw">Withdraw</Link>
      <Link to="/transfer">Transfer</Link>
      <Link to="/transactions">Transactions</Link>
      <Link to="/admin">Admin</Link>

      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;