import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminFetch, isAdminLoggedIn } from "../adminAuth"; // adjust path if needed

export default function AdminWaitersPage() {
  const api = import.meta.env.VITE_API_URL;
  const nav = useNavigate();

  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [newName, setNewName] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const r = await adminFetch(`${api}/api/admin/waiters`);
      if (r.status === 401) {
        nav("/admin");
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setWaiters(await r.json());
    } catch (e) {
      setErr(`Failed to load waiters: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      nav("/admin");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createWaiter(e) {
    e.preventDefault();
    setErr("");

    if (!newName.trim()) return setErr("Name is required");

    const r = await adminFetch(`${api}/api/admin/waiters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (r.status === 401) return nav("/admin");

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Failed to create waiter");
      return;
    }

    setNewName("");
    load();
  }

  async function toggleActive(w) {
    setErr("");
    const r = await adminFetch(`${api}/api/admin/waiters/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !w.isActive }),
    });

    if (r.status === 401) return nav("/admin");

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Failed to update waiter");
      return;
    }
    load();
  }

  async function removeWaiter(w) {
    setErr("");
    const r = await adminFetch(`${api}/api/admin/waiters/${w.id}`, { method: "DELETE" });

    if (r.status === 401) return nav("/admin");

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Failed to delete waiter");
      return;
    }
    load();
  }

  return (
    <div
      style={{
        maxWidth: 950,
        margin: "40px auto",
        padding: 20,
        color: "white",
        backgroundColor: "#111827",
        borderRadius: 12,
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Admin — Waiters</h1>

      <form onSubmit={createWaiter} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Waiter name (e.g. Adnan)"
          style={{
            padding: 10,
            backgroundColor: "#1f2937",
            color: "white",
            border: "1px solid #374151",
            borderRadius: 8,
            minWidth: 240,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 800,
          }}
        >
          Add waiter
        </button>
      </form>

      {err && <div style={{ color: "#f87171", marginBottom: 10 }}>{err}</div>}
      {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}

      <div style={{ border: "1px solid #374151", borderRadius: 10, overflow: "hidden" }}>
        {waiters.map((w) => (
          <WaiterRow
            key={w.id}
            w={w}
            onOpenPersonal={() => nav(`/waiter/${w.id}`)}
            onToggle={() => toggleActive(w)}
            onDelete={() => removeWaiter(w)}
          />
        ))}

        {waiters.length === 0 && !loading && (
          <div style={{ padding: 14, opacity: 0.7 }}>No waiters yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}

function WaiterRow({ w, onOpenPersonal, onToggle, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderBottom: "1px solid #1f2937",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <div>
        <div style={{ fontWeight: 800 }}>
          #{w.id} — {w.name}
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>{w.isActive ? "Active" : "Inactive"}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
        <button
          onClick={onOpenPersonal}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: "#374151",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          Open Personal
        </button>

        <button
          onClick={onToggle}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 800,
          }}
        >
          {w.isActive ? "Disable" : "Enable"}
        </button>

        <button
          onClick={onDelete}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 800,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
