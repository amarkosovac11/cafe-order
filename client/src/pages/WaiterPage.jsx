import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function WaiterPage() {
    const api = import.meta.env.VITE_API_URL;
    const socketRef = useRef(null);


    const navigate = useNavigate();

    //SOUNDS
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

    // ✅ Only store waiterId (string) — most reliable
    const [selectedWaiterId, setSelectedWaiterId] = useState(() => {
        return localStorage.getItem("selectedWaiterId") || "";
    });

    const selectedWaiter = useMemo(() => {
        return waiters.find((w) => String(w.id) === String(selectedWaiterId)) || null;
    }, [waiters, selectedWaiterId]);

    const waiterId = selectedWaiter?.id || "";
    const waiterName = selectedWaiter?.name || "";


    /*    const enableSound = async () => {
           try {
               const a = orderSoundRef.current;
               if (!a) return;
   
               // unlock autoplay on user gesture
               await a.play();
               a.pause();
               a.currentTime = 0;
   
               setSoundEnabled(true);
           } catch (e) {
               console.log("Enable sound failed:", e);
           }
       }; */

    const toggleSound = async () => {
        // If already enabled → disable it
        if (soundEnabledRef.current) {
            setSoundEnabled(false);
            return;
        }

        // If disabled → enable it (unlock autoplay)
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

        // auto-select first waiter only if nothing selected
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
        // if no waiter chosen, just clear myOrders
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

            // refresh my orders after unclaim
            setLoadingMyOrders(true);
            await loadMyOrders(selectedWaiterId);
        } catch (e) {
            setErr(e.message);
        }
    };





    // ---------- Mount ----------
    useEffect(() => {
        setErr("");

        // initial loads
        loadWaiters().catch((e) => setErr(e.message));
        loadOrders().catch((e) => setErr(e.message));
        loadCalls().catch(() => { });
        // myOrders loads after waiter selection in the next effect

        // socket connect once
        socketRef.current = io(api, { transports: ["websocket"] });
        const socket = socketRef.current;

        socket.on("connect", () => console.log("✅ waiter socket connected:", socket.id));

        // Orders realtime
        /* socket.on("order:new", (order) => {
            setOrders((prev) => [order, ...prev]);

            if (soundEnabled) { orderSoundRef.current?.play().catch(() => {
                // If browser blocks autoplay, fallback beep:
                try { window.navigator.vibrate?.(80); } catch { }
            });}
        });
 */

        // SOCKET ON FOR SOUNDS TESTINGGGG
        socket.on("order:new", (order) => {
            setOrders((prev) => {
                // prevent duplicates if event arrives twice for any reason
                if (prev.some((o) => o.id === order.id)) return prev;
                return [order, ...prev];
            });

            if (!soundEnabledRef.current) return;
            const a = orderSoundRef.current;
            if (!a) return;

            try { a.currentTime = 0; } catch { }
            a.play().catch(() => {
                try { window.navigator.vibrate?.(80); } catch { }
            });
        });




        socket.on("order:claimed", ({ orderId, waiterId: claimedBy }) => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));

            // if this dashboard's selected waiter claimed it, refresh myOrders
            if (String(claimedBy) === String(selectedWaiterId)) {
                setLoadingMyOrders(true);
                loadMyOrders(claimedBy).catch(() => { });
            }
        });

        /*  socket.on("order:new", (order) => {
   console.log("🔥 order:new received", order?.id, "soundEnabled=", soundEnabled);
   setOrders((prev) => [order, ...prev]); */

        // play no matter what (TEMP TEST)
        /*  orderSoundRef.current?.play().catch(console.log);
       }); */

        socket.on("order:deleted", ({ orderId }) => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
        });

        // Calls realtime
        socket.on("call:new", (call) => {
            setCalls((prev) => [call, ...prev]);
            if (soundEnabledRef.current) {
                callSoundRef.current?.play().catch(() => {
                    try { window.navigator.vibrate?.(120); } catch { }
                });
            }
        });

        socket.on("call:handled", ({ callId }) => {
            setCalls((prev) => prev.filter((c) => c.id !== callId));
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
        loadMyOrders(selectedWaiterId).catch(() => { });
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



    // ---------- UI ----------
    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h1 style={{ margin: 0 }}>Waiter Dashboard
                    {/* <button
                    onClick={() => {
                        setSoundEnabled(true);
                        // warm-up play (muted-ish)
                        orderSoundRef.current?.play().then(() => {
                            orderSoundRef.current.pause();
                            orderSoundRef.current.currentTime = 0;
                        }).catch(() => { });
                    }}
                    style={{ padding: "8px 12px", fontWeight: 700 }}
                >
                    {soundEnabled ? "Sound ✅" : "Enable Sound"}
                </button> */}

                    <button onClick={() => orderSoundRef.current?.play().catch(console.log)}>
                        Test sound
                    </button>

                    <button onClick={toggleSound}>
                        {soundEnabled ? "Sound ✅" : "Enable Sound"}
                    </button>

                    <button
                        onClick={() => navigate("/pick-waiter", { state: { from: "/waiter" } })}
                        style={{
                            padding: "8px 14px",
                            backgroundColor: "#2563eb",   // blue
                            color: "black",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                    >
                        Open Personal Page →
                    </button>




                </h1>


                <audio ref={orderSoundRef} src="/sounds/new-order.mp3" preload="auto" />
                <audio ref={callSoundRef} src="/sounds/new-call.mp3" preload="auto" />


                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ opacity: 0.7 }}>Waiter:</span>
                    <select
                        value={selectedWaiterId}
                        onChange={(e) => {
                            const id = String(e.target.value);
                            setSelectedWaiterId(id);
                            localStorage.setItem("selectedWaiterId", id);
                        }}
                        style={{ padding: 8, fontWeight: 700 }}
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
                    {waiterName ? <span style={{ opacity: 0.7 }}>{waiterName}</span> : null}
                </div>
            </div>

            {
                !waiterId && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            background: "#fff3cd",
                            border: "1px solid #ffeeba",
                            borderRadius: 8,
                        }}
                    >
                        Please select a waiter to use the dashboard.
                    </div>
                )
            }

            {err && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {err}</p>}

            {/* CALLS */}
            <h2 style={{ marginTop: 18 }}>Calls</h2>
            {
                loadingCalls ? (
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
                                    <button
                                        onClick={() => handleCall(c.id)}
                                        style={{ padding: "10px 14px", fontWeight: 700 }}
                                        disabled={!waiterId}
                                    >
                                        Handled
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* UNCLAIMED ORDERS */}
            <h2 style={{ marginTop: 18 }}>Unclaimed Orders</h2>
            <p style={{ opacity: 0.7 }}>
                New orders appear here. Click <b>Claim</b> to take responsibility.
            </p>

            {
                loadingOrders ? (
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

                                    <button
                                        onClick={() => claimOrder(o.id)}
                                        style={{ padding: "10px 14px", fontWeight: 700 }}
                                        disabled={!waiterId}
                                    >
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
                )
            }

            {/* MY ORDERS */}
            <h2 style={{ marginTop: 18 }}>My Orders</h2>
            {
                loadingMyOrders ? (
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
                )
            }
        </div >
    );
}
