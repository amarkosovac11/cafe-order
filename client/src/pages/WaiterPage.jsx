import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function WaiterPage() {
    const api = import.meta.env.VITE_API_URL;
    const socketRef = useRef(null);

    // MVP: hardcoded waiter
    const [waiterId] = useState("w1");

    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);

    const [myOrders, setMyOrders] = useState([]);

    const [err, setErr] = useState("");
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCalls, setLoadingCalls] = useState(true);
    const [loadingMyOrders, setLoadingMyOrders] = useState(true);

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

    const loadMyOrders = async () => {
        try {
            const res = await fetch(`${api}/orders/claimed/${waiterId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setMyOrders(data);
        } finally {
            setLoadingMyOrders(false);
        }
    };

    useEffect(() => {
        setErr("");
        loadOrders().catch((e) => setErr(e.message));
        loadCalls().catch(() => { });
        loadMyOrders().catch(() => { });

        // Create ONE socket connection
        socketRef.current = io(api, { transports: ["websocket"] });
        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("✅ waiter socket connected:", socket.id);
        });

        // Orders realtime
        socket.on("order:new", (order) => {
            console.log("📥 order:new", order.id);
            setOrders((prev) => [order, ...prev]);
        });

        socket.on("order:claimed", ({ orderId, waiterId: claimedBy }) => {
            console.log("📤 order:claimed", orderId, "by", claimedBy);

            // remove from unclaimed list
            setOrders((prev) => prev.filter((o) => o.id !== orderId));

            // if I claimed it, refresh my orders
            if (claimedBy === waiterId) {
                setLoadingMyOrders(true);
                loadMyOrders().catch(() => { });
            }
        });

        // Calls realtime
        socket.on("call:new", (call) => {
            console.log("🔔 call:new", call.id);
            setCalls((prev) => [call, ...prev]);
        });

        socket.on("call:handled", ({ callId }) => {
            console.log("✅ call:handled", callId);
            setCalls((prev) => prev.filter((c) => c.id !== callId));
        });

        socket.on("disconnect", () => {
            console.log("❌ waiter socket disconnected");
        });
        socket.on("order:deleted", ({ orderId }) => {
            // remove from BOTH lists
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
        });

        return () => {
            socket.off("connect");
            socket.off("order:new");
            socket.off("order:claimed");
            socket.off("call:new");
            socket.off("call:handled");
            socket.off("disconnect");
            socket.off("order:deleted");
            socket.disconnect();
        };
    }, [api, waiterId]);

    const claimOrder = async (orderId) => {
        setErr("");
        try {
            const res = await fetch(`${api}/orders/${orderId}/claim`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiterId }),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            // Refresh my orders AFTER successful claim
            setLoadingMyOrders(true);
            loadMyOrders().catch(() => { });
        } catch (e) {
            setErr(e.message);
        }
    };

    const handleCall = async (callId) => {
        setErr("");
        try {
            const res = await fetch(`${api}/calls/${callId}/handle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiterId }),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
            // socket event removes it
        } catch (e) {
            setErr(e.message);
        }
    };

    const finishOrder = async (orderId) => {
        setErr("");
        try {
            const res = await fetch(`${api}/orders/${orderId}`, {
                method: "DELETE",
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            // socket will remove it from UI
        } catch (e) {
            setErr(e.message);
        }
    };


    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Waiter Dashboard</h1>
                <div style={{ opacity: 0.7 }}>
                    Waiter: <b>{waiterId}</b>
                </div>
            </div>

            {err && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {err}</p>}

            {/* CALLS */}
            <h2 style={{ marginTop: 18 }}>Calls</h2>
            {loadingCalls ? (
                <p>Loading calls…</p>
            ) : calls.length === 0 ? (
                <div style={{ opacity: 0.7, marginBottom: 16 }}>No open calls.</div>
            ) : (
                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                    {calls.map((c) => (
                        <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <div>
                                    <b>Table {c.tableId}</b> — {c.type}
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        {new Date(c.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCall(c.id)}
                                    style={{ padding: "10px 14px", fontWeight: 700 }}
                                >
                                    Handled
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* UNCLAIMED ORDERS */}
            <h2 style={{ marginTop: 18 }}>Unclaimed Orders</h2>
            <p style={{ opacity: 0.7 }}>
                New orders appear here. Click <b>Claim</b> to take responsibility.
            </p>

            {loadingOrders ? (
                <p>Loading orders…</p>
            ) : orders.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No unclaimed orders.</div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {orders.map((o) => (
                        <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 800 }}>Table {o.tableId}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        {new Date(o.createdAt).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Order ID: {o.id}</div>
                                </div>

                                <button
                                    onClick={() => claimOrder(o.id)}
                                    style={{ padding: "10px 14px", fontWeight: 700 }}
                                >
                                    Claim
                                </button>
                            </div>

                            <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 }}>
                                {o.items.map((it) => (
                                    <div
                                        key={it.itemId}
                                        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                                    >
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
            )}

            {/* MY ORDERS */}
            <h2 style={{ marginTop: 18 }}>My Orders</h2>
            {loadingMyOrders ? (
                <p>Loading my orders…</p>
            ) : myOrders.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No claimed orders yet.</div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {myOrders.map((o) => (
                        <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 800 }}>Table {o.tableId}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        Claimed at {new Date(o.claimedAt).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Order ID: {o.id}</div>
                                </div>
                                <button
                                    onClick={() => finishOrder(o.id)}
                                    style={{
                                        padding: "8px 12px",
                                        fontWeight: 700,
                                        background: "#2ecc71",
                                        border: "none",
                                        color: "white",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                    }}
                                >
                                    Done
                                </button>

                            </div>

                            <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 }}>
                                {o.items.map((it) => (
                                    <div
                                        key={it.itemId}
                                        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                                    >
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
            )}
        </div>
    );
}
