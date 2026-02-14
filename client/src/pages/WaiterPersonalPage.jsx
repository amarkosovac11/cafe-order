import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams, Link } from "react-router-dom";

export default function WaiterPersonalPage() {
    const api = import.meta.env.VITE_API_URL;
    const socketRef = useRef(null);

    const { waiterId } = useParams();

    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);
    const [myOrders, setMyOrders] = useState([]);

    const [err, setErr] = useState("");
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCalls, setLoadingCalls] = useState(true);
    const [loadingMyOrders, setLoadingMyOrders] = useState(true);

    const [waiterInfo, setWaiterInfo] = useState(null);
    const [loadingWaiter, setLoadingWaiter] = useState(true);

    const loadWaiter = async () => {
        setLoadingWaiter(true);
        try {
            const res = await fetch(`${api}/waiters/${waiterId}`);
            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
            const data = JSON.parse(text);
            setWaiterInfo(data);
        } finally {
            setLoadingWaiter(false); // ✅ always stops loading
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

    const loadMyOrders = async () => {
        if (!waiterId) {
            setMyOrders([]);
            setLoadingMyOrders(false);
            return;
        }

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

        setLoadingOrders(true);
        setLoadingCalls(true);
        setLoadingMyOrders(true);

        loadOrders().catch((e) => setErr(e.message));
        loadCalls().catch(() => { });
        loadMyOrders().catch(() => { });
        loadWaiter().catch((e) => setErr(e.message));

        socketRef.current = io(api, { transports: ["websocket"] });
        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("✅ personal waiter socket connected:", socket.id, "waiterId:", waiterId);
        });

        socket.on("order:new", (order) => {
            setOrders((prev) => [order, ...prev]);
        });

        socket.on("order:claimed", ({ orderId, waiterId: claimedBy }) => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));

            // if I claimed it, refresh my orders
            if (String(claimedBy) === String(waiterId)) {
                setLoadingMyOrders(true);
                loadMyOrders().catch(() => { });
            }
        });

        socket.on("order:deleted", ({ orderId }) => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
        });

        socket.on("call:new", (call) => {
            setCalls((prev) => [call, ...prev]);
        });

        socket.on("call:handled", ({ callId }) => {
            setCalls((prev) => prev.filter((c) => c.id !== callId));
        });

        socket.on("disconnect", () => {
            console.log("❌ personal waiter socket disconnected");
        });
        socket.on("order:updated", (order) => {
            // If order became UNCLAIMED → add it back to unclaimed list
            if (order.status === "UNCLAIMED") {
                setOrders((prev) => {
                    if (prev.some((o) => o.id === order.id)) return prev;
                    return [order, ...prev];
                });
            }

            // If order is CLAIMED and belongs to me → refresh myOrders
            if (order.status === "CLAIMED" && String(order.claimedById) === String(waiterId)) {
                setLoadingMyOrders(true);
                loadMyOrders().catch(() => { });
            }

            // Remove from myOrders if unclaimed
            if (order.status === "UNCLAIMED") {
                setMyOrders((prev) => prev.filter((o) => o.id !== order.id));
            }
        });

        return () => {
            socket.off("connect");
            socket.off("order:new");
            socket.off("order:claimed");
            socket.off("order:deleted");
            socket.off("call:new");
            socket.off("call:handled");
            socket.off("disconnect");
            socket.off("order:updated");

            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, waiterId]);

    const claimOrder = async (orderId) => {
        setErr("");
        if (!waiterId) return setErr("Missing waiterId in URL.");

        try {
            const res = await fetch(`${api}/orders/${orderId}/claim`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiterId }),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            setLoadingMyOrders(true);
            loadMyOrders().catch(() => { });
        } catch (e) {
            setErr(e.message);
        }
    };

    const handleCall = async (callId) => {
        setErr("");
        if (!waiterId) return setErr("Missing waiterId in URL.");

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

    // ✅ render guards (must be BEFORE return JSX)
    if (loadingWaiter) {
        return <div style={{ padding: 24, fontFamily: "Arial" }}>Loading waiter…</div>;
    }

    if (!waiterInfo || waiterInfo.isActive === false) {
        return (
            <div style={{ padding: 24, fontFamily: "Arial" }}>
                <h2>Waiter not found</h2>
                <p>This waiter ID is invalid.</p>
            </div>
        );
    }

    const unclaimOrder = async (orderId) => {
        setErr("");
        try {
            const res = await fetch(`${api}/orders/${orderId}/unclaim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiterId }), // waiterId from useParams()
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            setLoadingMyOrders(true);
            await loadMyOrders();
        } catch (e) {
            setErr(e.message);
        }
    };



    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Waiter</h1>


                    <div style={{ opacity: 0.7, marginTop: 6 }}>
                        Personal page for waiterId: <b>{waiterId}</b>
                    </div>
                </div>



                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link to="/waiter" style={{ opacity: 0.8 }}>
                        Shared dashboard
                    </Link>
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div>
                                    <b>Table {c.tableId}</b> — {c.type === "bill" ? "💰 Bill" : "👋 Waiter"}
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(c.createdAt).toLocaleString()}</div>
                                </div>
                                <button onClick={() => handleCall(c.id)} style={{ padding: "10px 14px", fontWeight: 700 }}>
                                    Handled
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* UNCLAIMED */}
            <h2 style={{ marginTop: 18 }}>Unclaimed Orders</h2>
            <p style={{ opacity: 0.7 }}>Everyone sees these. Click <b>Claim</b> to take it.</p>

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
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(o.createdAt).toLocaleString()}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Order ID: {o.id}</div>
                                </div>
                                <button onClick={() => claimOrder(o.id)} style={{ padding: "10px 14px", fontWeight: 700 }}>
                                    Claim
                                </button>
                            </div>

                            <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 }}>
                                {o.items.map((it) => (
                                    <div key={it.itemId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div>
                                            <b>{it.name}</b> × {it.qty}
                                            {it.note ? <div style={{ fontSize: 12, opacity: 0.8 }}>Note: {it.note}</div> : null}
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
                                        Claimed at {o.claimedAt ? new Date(o.claimedAt).toLocaleString() : "—"}
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
                                {o.status === "CLAIMED" && (
                                    <button
                                        onClick={() => unclaimOrder(o.id)}
                                        style={{
                                            padding: "8px 12px",
                                            fontWeight: 700,
                                            background: "#e74c3c",
                                            border: "none",
                                            color: "white",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Unclaim
                                    </button>
                                )}


                            </div>

                            <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 10 }}>
                                {o.items.map((it) => (
                                    <div key={it.itemId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div>
                                            <b>{it.name}</b> × {it.qty}
                                            {it.note ? <div style={{ fontSize: 12, opacity: 0.8 }}>Note: {it.note}</div> : null}
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
