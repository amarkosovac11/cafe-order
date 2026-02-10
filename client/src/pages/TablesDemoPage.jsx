import { useMemo, useState } from "react";

export default function TablesDemoPage() {
  const [count, setCount] = useState(20);

  const tables = useMemo(() => {
    const n = Math.max(1, Math.min(200, Number(count) || 1));
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [count]);

  const openTable = (id) => {
    window.open(`/t/${id}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "Arial" }}>
      <h1 style={{ marginTop: 0 }}>Demo: Tables</h1>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Developer-only helper. Opens customer table pages in new tabs. Customers won’t see this.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 10,
          marginTop: 12,
        }}
      >
        <label style={{ fontWeight: 700 }}>Number of tables:</label>
        <input
          value={count}
          onChange={(e) => setCount(e.target.value)}
          type="number"
          min={1}
          max={200}
          style={{ padding: 8, width: 120}}
        />
        <span style={{ opacity: 0.7 }}>Tip: set 12, 20, 30…</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
        {tables.map((t) => (
          <button
            key={t}
            onClick={() => openTable(t)}
            style={{
              padding: "12px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "green",
              cursor: "pointer",
              fontWeight: 800,
            }}
            title={`Open /t/${t} in new tab`}
          >
            Table {t}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18, opacity: 0.75, fontSize: 13 }}>
        URL: <code>/demo/tables</code>
      </div>
    </div>
  );
}
