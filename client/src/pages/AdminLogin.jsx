import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminAuth } from "../adminAuth";

export default function AdminLogin() {
  const api = import.meta.env.VITE_API_URL;
  const nav = useNavigate();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const auth = "Basic " + btoa(`${user}:${pass}`);
    setLoading(true);

    try {
      // Probe an admin endpoint to validate credentials
      const r = await fetch(`${api}/api/admin/tables`, {
        headers: { Authorization: auth },
      });

      if (!r.ok) throw new Error("Wrong username or password");

      setAdminAuth(auth);
      nav("/admin/home");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 20,
        background: "#111827",
        color: "white",
        borderRadius: 12,
        border: "1px solid #374151",
      }}
    >
      <h1 style={{ marginTop: 0 }}>Admin Login</h1>
      <div style={{ opacity: 0.75, marginBottom: 12 }}>
        Sign in to access admin pages.
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Username"
          style={{
            padding: 10,
            background: "#1f2937",
            color: "white",
            border: "1px solid #374151",
            borderRadius: 8,
          }}
        />
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="Password"
          style={{
            padding: 10,
            background: "#1f2937",
            color: "white",
            border: "1px solid #374151",
            borderRadius: 8,
          }}
        />

        {err && <div style={{ color: "#f87171" }}>{err}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 12px",
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 800,
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
