import { Link } from "react-router-dom";

export default function AdminHome() {
  const wrap = {
    maxWidth: 900,
    margin: "40px auto",
    padding: 20,
    color: "white",
    background: "#111827",
    borderRadius: 12,
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 14,
  };

  const card = {
    display: "block",
    padding: 16,
    borderRadius: 10,
    textDecoration: "none",
    color: "white",
    background: "#1f2937",
    border: "1px solid #374151",
    fontWeight: 700,
  };

  const small = { fontSize: 12, opacity: 0.75, marginTop: 6, fontWeight: 500 };

  return (
    <div style={wrap}>
      <h1 style={{ margin: 0 }}>Admin Panel</h1>
      <div style={{ opacity: 0.75, marginTop: 6 }}>
        Tables overview + manage waiters.
      </div>

      <div style={grid}>
        <Link to="/admin/tables" style={card}>
          🪑 See Tables
          <div style={small}>View tables and open table pages (with token).</div>
        </Link>

        <Link to="/admin/waiters" style={card}>
          🧑‍🍳 Manage Waiters
          <div style={small}>Add / disable / delete waiters.</div>
        </Link>

        <Link to="/waiter" style={card}>
          📺 Waiter Dashboard
          <div style={small}>Monitor orders + calls live.</div>
        </Link>

        <Link to="/admin/menu" style={card}>
          📋 Manage Menu
          <div style={small}>
            Add / edit / delete categories and menu items.
          </div>
        </Link>

        {/* Optional debug link (not recommended for real use) */}
        {/*
        <Link to="/waiter" style={card}>
          🧪 Debug: Open Waiter Pages
          <div style={small}>Pick a waiter and open personal page.</div>
        </Link>
        */}
      </div>
    </div>
  );
}
