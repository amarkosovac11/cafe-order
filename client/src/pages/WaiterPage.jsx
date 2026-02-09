import { useEffect, useState } from "react";

export default function WaiterPage() {
  const api = import.meta.env.VITE_API_URL;

  // For MVP: hardcode waiter identity
  const [waiterId] = useState("w1");

  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setErr("");
    try {
      const res = await fetch(`${api}/orders/unclaimed`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 2000); // polling every 2s for now
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claim = async (orderId) => {
    setErr("");
    try {
      const res = await fetch(`${api}/orders/${orderId}/claim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterId }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      // refresh list
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Waiter Dashboard</h1>
        <div style={{ opacity: 0.7 }}>Waiter: <b>{waiterId}</b></div>
      </div>

      <p style={{ opacity: 0.7 }}>
        Unclaimed orders appear here. Click <b>Claim</b> to take responsibility.
      </p>

      {err && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {err}</p>}
      {loading && <p>Loading…</p>}

      {!loading && orders.length === 0 && (
        <div style={{ opacity: 0.7 }}>No unclaimed orders.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {orders.map((o) => (
          <div
            key={o.id}
            style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>Table {o.tableId}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(o.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Order ID: {o.id}</div>
              </div>

              <button onClick={() => claim(o.id)} style={{ padding: "10px 14px", fontWeight: 700 }}>
                Claim
              </button>
            </div>

            <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 }}>
              {o.items.map((it) => (
                <div key={it.itemId} style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <b>{it.name}</b> × {it.qty}
                    {it.note ? (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Note: {it.note}</div>
                    ) : null}
                  </div>
                  <div>{(it.price * it.qty).toFixed(2)} KM</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
