import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";


export default function TablePage() {
    const { tableId } = useParams();
    const api = import.meta.env.VITE_API_URL;

    const [menu, setMenu] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    // cart: { [itemId]: { itemId, name, price, qty, note } }
    const [cart, setCart] = useState({});
    const [placing, setPlacing] = useState(false);
    const [placedMsg, setPlacedMsg] = useState("");
    const [callMsg, setCallMsg] = useState("");

    // Token (optional for now)
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    useEffect(() => {
        fetch(`${api}/menu`)
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => setMenu(data))
            .catch((e) => setErr(e.message))
            .finally(() => setLoading(false));
    }, [api]);

    const flatItems = useMemo(
        () => menu.flatMap((c) => c.items.map((it) => ({ ...it, category: c.name }))),
        [menu]
    );

    const cartItems = useMemo(() => Object.values(cart), [cart]);

    const total = useMemo(
        () => cartItems.reduce((sum, it) => sum + it.price * it.qty, 0),
        [cartItems]
    );

    const addItem = (it) => {
        setPlacedMsg("");
        setCart((prev) => {
            const existing = prev[it.id];
            const qty = existing ? existing.qty + 1 : 1;
            return {
                ...prev,
                [it.id]: {
                    itemId: it.id,
                    name: it.name,
                    price: it.price,
                    qty,
                    note: existing?.note ?? "",
                },
            };
        });
    };

    const removeOne = (itemId) => {
        setPlacedMsg("");
        setCart((prev) => {
            const existing = prev[itemId];
            if (!existing) return prev;

            if (existing.qty <= 1) {
                const copy = { ...prev };
                delete copy[itemId];
                return copy;
            }

            return { ...prev, [itemId]: { ...existing, qty: existing.qty - 1 } };
        });
    };

    const setNote = (itemId, note) => {
        setPlacedMsg("");
        setCart((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], note },
        }));
    };

    const placeOrder = async () => {
        setErr("");
        setPlacedMsg("");
        setCallMsg("");

        if (cartItems.length === 0) {
            setErr("Cart is empty.");
            return;
        }

        // ✅ Build payloadItems correctly
        const payloadItems = cartItems.map((it) => ({
            itemId: it.itemId,
            name: it.name,
            price: it.price,
            qty: it.qty,
            note: it.note || "",
        }));

        setPlacing(true);
        try {
            const body = { tableId, items: payloadItems };
            if (token) body.token = token; // optional (for later security)

            const res = await fetch(`${api}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            setCart({});
            setPlacedMsg("✅ Order sent! Waiter will see it now.");
        } catch (e) {
            setErr(e.message);
        } finally {
            setPlacing(false);
        }
    };

    const callWaiter = async () => {
        setErr("");
        setCallMsg("");
        setPlacedMsg("");

        try {
            const body = { tableId, type: "waiter" };
            if (token) body.token = token; // optional (for later security)

            const res = await fetch(`${api}/calls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            setCallMsg("✅ Waiter has been notified.");
        } catch (e) {
            setErr(e.message);
        }
    };





    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
            <h1>Table {tableId}</h1>
            <p style={{ opacity: 0.7 }}>Choose items → add notes → Finish order</p>

            {err && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {err}</p>}
            {placedMsg && <p style={{ color: "green" }}>{placedMsg}</p>}

            {callMsg && <p style={{ color: "green" }}>{callMsg}</p>}

            <button
                onClick={callWaiter}
                style={{ padding: "10px 12px", fontWeight: 700, marginBottom: 16 }}
            >
                Call waiter
            </button>


            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                {/* MENU */}
                <div>
                    <h2 style={{ marginTop: 0 }}>Menu</h2>

                    {loading && <p>Loading menu…</p>}

                    {!loading && (
                        <div style={{ display: "grid", gap: 12 }}>
                            {flatItems.map((it) => (
                                <div
                                    key={it.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 10,
                                        padding: 12,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>{it.category}</div>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ fontWeight: 700 }}>{it.price.toFixed(2)} KM</div>
                                        <button onClick={() => addItem(it)} style={{ padding: "8px 12px" }}>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CART */}
                <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                    <h2 style={{ marginTop: 0 }}>Cart</h2>

                    {cartItems.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>No items yet.</p>
                    ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                            {cartItems.map((ci) => (
                                <div key={ci.itemId} style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                        <div style={{ fontWeight: 700 }}>
                                            {ci.name} × {ci.qty}
                                        </div>
                                        <div style={{ fontWeight: 700 }}>
                                            {(ci.price * ci.qty).toFixed(2)} KM
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                        <button onClick={() => removeOne(ci.itemId)} style={{ padding: "6px 10px" }}>
                                            −
                                        </button>
                                        <button onClick={() => addItem({ id: ci.itemId, name: ci.name, price: ci.price })} style={{ padding: "6px 10px" }}>
                                            +
                                        </button>
                                    </div>

                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                                            Note (optional)
                                        </div>
                                        <input
                                            value={ci.note}
                                            onChange={(e) => setNote(ci.itemId, e.target.value)}
                                            placeholder="e.g. oat milk, no sugar, extra hot…"
                                            style={{ width: "100%", padding: 8 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontWeight: 700 }}>Total</div>
                            <div style={{ fontWeight: 700 }}>{total.toFixed(2)} KM</div>
                        </div>

                        <button
                            onClick={placeOrder}
                            disabled={placing || cartItems.length === 0}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                padding: "10px 12px",
                                fontWeight: 700,
                            }}
                        >
                            {placing ? "Sending..." : "Finish order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
