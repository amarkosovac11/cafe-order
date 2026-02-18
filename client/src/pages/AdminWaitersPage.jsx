import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminWaitersPage() {
    const api = import.meta.env.VITE_API_URL;
    const nav = useNavigate();

    const [waiters, setWaiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [newName, setNewName] = useState("");
    /*  const [newPin, setNewPin] = useState(""); */

    const adminUser = import.meta.env.VITE_ADMIN_USER;
    const adminPass = import.meta.env.VITE_ADMIN_PASS;
    const adminAuth = "Basic " + btoa(`${adminUser}:${adminPass}`);


    function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: adminAuth,
    },
  });
}
    async function load() {
        setErr("");
        setLoading(true);
        try {
            const r = await adminFetch(`${api}/api/admin/waiters`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            setWaiters(await r.json());
        } catch (e) {
            setErr(`Failed to load waiters: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function createWaiter(e) {
        e.preventDefault();
        setErr("");

        if (!newName.trim()) return setErr("Name is required");
        /* if (!newPin.trim()) return setErr("PIN is required"); */

        const r = await fetch(`${api}/api/admin/waiters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim()/* , pin: newPin.trim()  */ }),
        });

        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setErr(j.error || "Failed to create waiter");
            return;
        }

        setNewName("");
        /* setNewPin(""); */
        load();
    }

    async function toggleActive(w) {
        setErr("");
        const r = await adminFetch(`${api}/api/admin/waiters/${w.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !w.isActive }),
        });

        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setErr(j.error || "Failed to update waiter");
            return;
        }
        load();
    }

    /* async function updatePin(w, pin) {
        setErr("");
        const r = await fetch(`${api}/api/admin/waiters/${w.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: pin.trim() }),
        });

        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setErr(j.error || "Failed to update pin");
            return;
        }
        load();
    } */

    async function removeWaiter(w) {
        setErr("");
        const r = await adminFetch(`${api}/api/admin/waiters/${w.id}`, { method: "DELETE" });

        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setErr(j.error || "Failed to delete waiter");
            return;
        }
        load();
    }

    return (
        <div style={{ maxWidth: 950, margin: "0 auto", padding: 20 }}>
            <h1 style={{ marginBottom: 8 }}>Admin — Waiters</h1>

            <form onSubmit={createWaiter} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Waiter name (e.g. Adnan)"
                    style={{
                        padding: 8,
                        backgroundColor: "#1f2937",
                        color: "white",
                        border: "1px solid #374151",
                        borderRadius: 6,
                    }}
                />
                {/* <input
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="PIN (e.g. 1234)"
                    style={{
                        padding: 8,
                        backgroundColor: "#1f2937",
                        color: "white",
                        border: "1px solid #374151",
                        borderRadius: 6,
                    }}
                /> */}
                <button type="submit" style={{ padding: "8px 14px", cursor: "pointer" }}>
                    Add waiter
                </button>
            </form>

            {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}
            {loading && <div>Loading…</div>}

            <div style={{ border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
                {waiters.map((w) => (
                    <WaiterRow
                        key={w.id}
                        w={w}
                        onOpenPersonal={() => nav(`/waiter/${w.id}`)}
                        onToggle={() => toggleActive(w)}
/*                         onUpdatePin={(pin) => updatePin(w, pin)}
 */                        onDelete={() => removeWaiter(w)}
                    />
                ))}

                {waiters.length === 0 && !loading && (
                    <div style={{ padding: 14, opacity: 0.7 }}>No waiters yet. Add one above.</div>
                )}
            </div>
        </div>
    );
}

function WaiterRow({ w, onOpenPersonal, onToggle, /* onUpdatePin */ onDelete }) {
    /*  const [pin, setPin] = useState(w.pin || ""); */

    return (
        <div
            style={{
                maxWidth: 950,
                margin: "0 auto",
                padding: 20,
                color: "white",              // 👈 THIS FIXES TEXT
                backgroundColor: "#111827",  // 👈 dark background
            }}
        >
            <div>
                <div style={{ fontWeight: 800 }}>
                    #{w.id} — {w.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{w.isActive ? "Active" : "Inactive"}</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                <button onClick={onOpenPersonal} style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                }}
                >
                    Open Personal Page
                </button>

                {/* <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    style={{ padding: 8, width: 110 }}
                /> */}
                {/* <button onClick={() => onUpdatePin(pin)} style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                }}
                >
                    Save PIN
                </button> */}

                <button onClick={onToggle} style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                }}
                >
                    {w.isActive ? "Disable" : "Enable"}
                </button>

                <button onClick={onDelete} style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                }}>
                    Delete
                </button>
            </div>
        </div>
    );
}
