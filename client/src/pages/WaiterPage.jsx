import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../css/WaiterPage.css";

export default function WaiterPage() {
  const api = import.meta.env.VITE_API_URL;
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // SOUNDS
  const orderSoundRef = useRef(null);
  const callSoundRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Data
  const [waiters, setWaiters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  // UI
  const [err, setErr] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingMyOrders, setLoadingMyOrders] = useState(true);

  const [selectedWaiterId, setSelectedWaiterId] = useState(() => {
    return localStorage.getItem("selectedWaiterId") || "";
  });

  const selectedWaiter = useMemo(() => {
    return waiters.find((w) => String(w.id) === String(selectedWaiterId)) || null;
  }, [waiters, selectedWaiterId]);

  const waiterId = selectedWaiter?.id || "";
  const waiterName = selectedWaiter?.name || "";
  const hasWaiter = Boolean(waiterId);

  const toggleSound = async () => {
    if (soundEnabledRef.current) {
      setSoundEnabled(false);
      return;
    }
    try {
      const a = orderSoundRef.current;
      if (!a) return;

      a.muted = true;
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.muted = false;

      setSoundEnabled(true);
    } catch (e) {
      console.log("Enable sound failed:", e);
    }
  };

  // ---------- Loaders ----------
  const loadWaiters = async () => {
    const res = await fetch(`${api}/waiters`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setWaiters(data);

    if (!selectedWaiterId && data.length > 0) {
      const firstId = String(data[0].id);
      setSelectedWaiterId(firstId);
      localStorage.setItem("selectedWaiterId", firstId);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${api}/orders/unclaimed`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCalls = async () => {
    try {
      const res = await fetch(`${api}/calls/open`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCalls(data);
    } finally {
      setLoadingCalls(false);
    }
  };

  const loadMyOrders = async (wid) => {
    if (!wid) {
      setMyOrders([]);
      setLoadingMyOrders(false);
      return;
    }
    try {
      const res = await fetch(`${api}/orders/claimed/${wid}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMyOrders(data);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  const unclaimOrder = async (orderId) => {
    setErr("");
    try {
      const res = await fetch(`${api}/orders/${orderId}/unclaim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterId: selectedWaiterId }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setLoadingMyOrders(true);
      await loadMyOrders(selectedWaiterId);
    } catch (e) {
      setErr(e.message);
    }
  };

  // ---------- Mount ----------
  useEffect(() => {
    setErr("");

    loadWaiters().catch((e) => setErr(e.message));
    loadOrders().catch((e) => setErr(e.message));
    loadCalls().catch(() => {});

    socketRef.current = io(api, { transports: ["websocket"] });
    const socket = socketRef.current;

    socket.on("connect", () => console.log("✅ waiter socket connected:", socket.id));

    socket.on("order:new", (order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      if (!soundEnabledRef.current) return;
      const a = orderSoundRef.current;
      if (!a) return;

      try { a.currentTime = 0; } catch {}
      a.play().catch(() => {
        try { window.navigator.vibrate?.(80); } catch {}
      });
    });

    socket.on("order:claimed", ({ orderId, waiterId: claimedBy }) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      if (String(claimedBy) === String(selectedWaiterId)) {
        setLoadingMyOrders(true);
        loadMyOrders(claimedBy).catch(() => {});
      }
    });

    socket.on("order:deleted", ({ orderId }) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
    });

    socket.on("call:new", (call) => {
      setCalls((prev) => [call, ...prev]);
      if (soundEnabledRef.current) {
        callSoundRef.current?.play().catch(() => {
          try { window.navigator.vibrate?.(120); } catch {}
        });
      }
    });

    socket.on("call:handled", ({ callId }) => {
      setCalls((prev) => prev.filter((c) => c.id !== callId));
    });

    socket.on("order:updated", (order) => {
      if (order.status === "UNCLAIMED") {
        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
        setMyOrders((prev) => prev.filter((o) => o.id !== order.id));
      }

      if (order.status === "CLAIMED" && String(order.claimedById) === String(waiterId)) {
        setLoadingMyOrders(true);
        loadMyOrders(waiterId).catch(() => {});
      }
    });

    socket.on("disconnect", () => console.log("❌ waiter socket disconnected"));

    return () => {
      socket.off("connect");
      socket.off("order:new");
      socket.off("order:claimed");
      socket.off("order:deleted");
      socket.off("call:new");
      socket.off("call:handled");
      socket.off("order:updated");
      socket.off("disconnect");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // ---------- When waiter changes, reload my orders ----------
  useEffect(() => {
    setLoadingMyOrders(true);
    loadMyOrders(selectedWaiterId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWaiterId]);

  // ---------- Actions ----------
  const claimOrder = async (orderId) => {
    setErr("");
    if (!waiterId) return setErr("Select waiter first.");

    try {
      const res = await fetch(`${api}/orders/${orderId}/claim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterId }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setLoadingMyOrders(true);
      await loadMyOrders(waiterId);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleCall = async (callId) => {
    setErr("");
    if (!waiterId) return setErr("Select waiter first.");

    try {
      const res = await fetch(`${api}/calls/${callId}/handle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterId }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    } catch (e) {
      setErr(e.message);
    }
  };

  const finishOrder = async (orderId) => {
    setErr("");
    try {
      const res = await fetch(`${api}/orders/${orderId}`, { method: "DELETE" });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="wp-page">
      <div className="wp-shell">
        <div className="wp-top">
          <div>
            <div className="wp-titleRow">
              <h1 className="wp-title">Waiter Dashboard</h1>
              <span className="wp-pill">{soundEnabled ? "Sound ✅" : "Sound OFF"}</span>
            </div>

            <div className="wp-actions">
              <button className="wp-btn wp-btn--ghost" onClick={() => orderSoundRef.current?.play().catch(() => {})}>
                Test sound
              </button>
              <button className="wp-btn wp-btn--primary" onClick={toggleSound}>
                {soundEnabled ? "Disable sound" : "Enable sound"}
              </button>
              <button
                className="wp-btn wp-btn--ghost"
                onClick={() => navigate("/pick-waiter", { state: { from: "/waiter" } })}
              >
                Open Personal Page →
              </button>
            </div>
          </div>

          <div className="wp-right">
            <span className="wp-label">Waiter:</span>
            <select
              className="wp-select"
              value={selectedWaiterId}
              onChange={(e) => {
                const id = String(e.target.value);
                setSelectedWaiterId(id);
                localStorage.setItem("selectedWaiterId", id);
              }}
            >
              <option value="" disabled>
                Select waiter
              </option>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {waiterName ? <span className="wp-waiterName">{waiterName}</span> : null}
          </div>

          <audio ref={orderSoundRef} src="/sounds/new-order.mp3" preload="auto" />
          <audio ref={callSoundRef} src="/sounds/new-call.mp3" preload="auto" />
        </div>

        {!hasWaiter && (
          <div className="wp-alert wp-alert--warn">
            <div className="wp-alertTitle">Waiter not selected</div>
            <div className="wp-alertBody">Please select a waiter to use the dashboard.</div>
          </div>
        )}

        {err && (
          <div className="wp-alert wp-alert--error">
            <div className="wp-alertTitle">Error</div>
            <div className="wp-alertBody">{err}</div>
          </div>
        )}

        {/* CALLS */}
        <div className="wp-section">
          <h2 className="wp-h2">Calls</h2>

          {loadingCalls ? (
            <div className="wp-sub">Loading calls…</div>
          ) : calls.length === 0 ? (
            <div className="wp-sub">No open calls.</div>
          ) : (
            <div className="wp-grid">
              {calls.map((c) => (
                <div key={c.id} className="wp-card">
                  <div className="wp-cardInner">
                    <div className="wp-cardTop">
                      <div>
                        <div className="wp-cardTitle">
                          Table {c.tableId} — {c.type === "bill" ? "💰 Bill" : "👋 Waiter"}
                        </div>
                        <div className="wp-meta">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => handleCall(c.id)}
                        className="wp-btn wp-btn--primary"
                        disabled={!hasWaiter}
                      >
                        Handled
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UNCLAIMED ORDERS */}
        <div className="wp-section">
          <h2 className="wp-h2">Unclaimed Orders</h2>
          <p className="wp-sub">
            New orders appear here. Click <b>Claim</b> to take responsibility.
          </p>

          {loadingOrders ? (
            <div className="wp-sub">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="wp-sub">No unclaimed orders.</div>
          ) : (
            <div className="wp-grid">
              {orders.map((o) => (
                <div key={o.id} className="wp-card">
                  <div className="wp-cardInner">
                    <div className="wp-cardTop">
                      <div>
                        <div className="wp-cardTitle">Table {o.tableId}</div>
                        <div className="wp-meta">{new Date(o.createdAt).toLocaleString()}</div>
                        <div className="wp-meta">Order ID: {o.id}</div>
                      </div>

                      <button
                        onClick={() => claimOrder(o.id)}
                        className="wp-btn wp-btn--primary"
                        disabled={!hasWaiter}
                      >
                        Claim
                      </button>
                    </div>

                    <div className="wp-items">
                      {o.items.map((it) => (
                        <div key={it.itemId} className="wp-itemRow">
                          <div>
                            <div className="wp-itemName">
                              {it.name} × {it.qty}
                            </div>
                            {it.note ? <div className="wp-note">Note: {it.note}</div> : null}
                          </div>
                          <div>{(it.price * it.qty).toFixed(2)} KM</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MY ORDERS */}
        <div className="wp-section">
          <h2 className="wp-h2">My Orders</h2>

          {loadingMyOrders ? (
            <div className="wp-sub">Loading my orders…</div>
          ) : myOrders.length === 0 ? (
            <div className="wp-sub">No claimed orders yet.</div>
          ) : (
            <div className="wp-grid">
              {myOrders.map((o) => (
                <div key={o.id} className="wp-card">
                  <div className="wp-cardInner">
                    <div className="wp-cardTop">
                      <div>
                        <div className="wp-cardTitle">Table {o.tableId}</div>
                        <div className="wp-meta">
                          Claimed at {o.claimedAt ? new Date(o.claimedAt).toLocaleString() : "—"}
                        </div>
                        <div className="wp-meta">Order ID: {o.id}</div>
                      </div>

                      <div className="wp-cardBtns">
                        <button onClick={() => finishOrder(o.id)} className="wp-btn wp-btn--success">
                          Done
                        </button>

                        {o.status === "CLAIMED" && (
                          <button onClick={() => unclaimOrder(o.id)} className="wp-btn wp-btn--danger">
                            Unclaim
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="wp-items">
                      {o.items.map((it) => (
                        <div key={it.itemId} className="wp-itemRow">
                          <div>
                            <div className="wp-itemName">
                              {it.name} × {it.qty}
                            </div>
                            {it.note ? <div className="wp-note">Note: {it.note}</div> : null}
                          </div>
                          <div>{(it.price * it.qty).toFixed(2)} KM</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
