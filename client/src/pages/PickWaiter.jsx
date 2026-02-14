import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function PickWaiter() {
  const api = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const [waiters, setWaiters] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // optional: where to go back after picking
  const from = location.state?.from || "/waiter";

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const res = await fetch(`${api}/waiters`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setWaiters(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const pick = (w) => {
    localStorage.setItem("selectedWaiterId", String(w.id));
    localStorage.setItem("selectedWaiterName", w.name); // optional
    navigate(`/w/${w.id}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ margin: 0 }}>Pick waiter</h1>
          <div style={{ opacity: 0.7, marginTop: 6 }}>Choose your name to open your personal page.</div>
        </div>

        <Link to={from} style={{ opacity: 0.8 }}>
          ← Back
        </Link>
      </div>

      {err && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {err}</p>}

      {loading ? (
        <p>Loading waiters…</p>
      ) : waiters.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No active waiters found.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {waiters.map((w) => (
            <button
              key={w.id}
              onClick={() => pick(w)}
              style={{
                padding: "16px 18px",
                textAlign: "left",
                borderRadius: 12,
                border: "1px solid #ffffff",
                background: "grey",
                color: "black",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {w.name}
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>ID: {w.id}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
