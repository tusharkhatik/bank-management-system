import Navbar from "./Navbar";
import "../App.css";

export default function Layout({ children }) {
  return (
    <div className="app-root">
      <Navbar />

      <main className="app-main">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
