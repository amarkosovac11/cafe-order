import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../css/PickWaiter.css";

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
    <div className="pw-page">
      <div className="pw-shell">
        <div className="pw-top">
          <div>
            <h1 className="pw-title">Pick waiter</h1>
            <div className="pw-sub">Choose your name to open your personal page.</div>
          </div>

          <Link to={from} className="pw-back">
            ← Back
          </Link>
        </div>

        {err && <div className="pw-alert">Error: {err}</div>}

        {loading ? (
          <div className="pw-loading">Loading waiters…</div>
        ) : waiters.length === 0 ? (
          <div className="pw-empty">No active waiters found.</div>
        ) : (
          <div className="pw-grid">
            {waiters.map((w) => (
              <button key={w.id} onClick={() => pick(w)} className="pw-card">
                <div className="pw-name">{w.name}</div>
                <div className="pw-meta">ID: {w.id}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
