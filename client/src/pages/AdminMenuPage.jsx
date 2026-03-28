import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminMenuPage() {
  const api = import.meta.env.VITE_API_URL;
  const nav = useNavigate();

  function getAuth() {
    return localStorage.getItem("adminAuth") || "";
  }

  function clearAuthAndGoLogin() {
    localStorage.removeItem("adminAuth");
    nav("/admin");
  }

  async function authedFetch(url, options = {}) {
    const auth = getAuth();
    if (!auth) {
      clearAuthAndGoLogin();
      throw new Error("Niste prijavljeni");
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: auth,
    };

    const r = await fetch(url, { ...options, headers });

    if (r.status === 401) {
      clearAuthAndGoLogin();
      throw new Error("Sesija je istekla. Prijavite se ponovo.");
    }

    return r;
  }

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [newCat, setNewCat] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth < 820);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selectedCat = useMemo(
    () => menu.find((c) => c.id === selectedCatId) || null,
    [menu, selectedCatId]
  );

  async function loadMenu() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${api}/menu`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setMenu(data);

      if (selectedCatId) {
        const stillThere = data.some((c) => c.id === selectedCatId);
        if (!stillThere) setSelectedCatId(data[0]?.id || "");
      } else {
        if (data.length > 0) setSelectedCatId(data[0].id);
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAuth()) {
      nav("/admin");
      return;
    }
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  async function createCategory() {
    const name = newCat.trim();
    if (!name) return;

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setNewCat("");
      await loadMenu();
      setSelectedCatId(data.id);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function renameCategory(id, name) {
    const newName = String(name || "").trim();
    if (!newName) return;

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-category/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function deleteCategory(id) {
    if (!confirm("Obrisati ovu kategoriju? (Svi artikli će biti obrisani)")) return;

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-category/${id}`, {
        method: "DELETE",
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      if (id === selectedCatId) setSelectedCatId("");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function createItem() {
    const name = newItemName.trim();
    const price = Number(newItemPrice);

    if (!selectedCatId) return setErr("Prvo odaberite kategoriju");
    if (!name) return;
    if (!Number.isFinite(price) || price <= 0) return setErr("Cijena mora biti veća od 0");

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, categoryId: selectedCatId }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setNewItemName("");
      setNewItemPrice("");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function updateItem(id, patch) {
    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-item/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function deleteItem(id) {
    if (!confirm("Obrisati ovaj artikl?")) return;

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-item/${id}`, {
        method: "DELETE",
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  // ---------- Styles ----------
  const wrap = {
    maxWidth: 1100,
    margin: "24px auto",
    padding: 12,
    color: "white",
  };

  const header = {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: "rgba(10, 12, 18, 0.92)",
    border: "1px solid #263043",
    borderRadius: 14,
    padding: 14,
    backdropFilter: "blur(8px)",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "360px 1fr",
    gap: 14,
    marginTop: 14,
  };

  const card = {
    background: "#10131a",
    border: "1px solid #263043",
    borderRadius: 14,
    padding: 14,
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #2b3548",
    background: "#1b2230",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  };

  const btnDanger = {
    ...btn,
    borderColor: "#7a2b2b",
    background: "#2a1214",
  };

  const input = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #2b3548",
    background: "#0c0f15",
    color: "white",
    outline: "none",
  };

  const small = { fontSize: 12, opacity: 0.8 };

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Admin • Meni</h1>
            <div style={small}>Dodaj / uređuj / briši kategorije i artikle (baza podataka)</div>
          </div>

          <button style={btn} onClick={loadMenu}>
            Osvježi
          </button>
        </div>

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #7a2b2b",
              background: "#1a0f12",
              color: "#fecaca",
              fontWeight: 700,
            }}
          >
            {err}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ ...card, marginTop: 14 }}>Učitavanje…</div>
      ) : (
        <div style={grid}>
          {/* LEFT: Categories */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Kategorije</h3>
              <div style={small}>{menu.length} ukupno</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                style={input}
                placeholder="Nova kategorija…"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <button style={btn} onClick={createCategory}>
                Dodaj
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {menu.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setSelectedCatId(c.id)}
                    style={{
                      ...btn,
                      flex: 1,
                      textAlign: "left",
                      background: c.id === selectedCatId ? "#2a3650" : "#161d2a",
                    }}
                    title="Odaberi kategoriju"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 900 }}>{c.name}</span>
                      <span style={{ opacity: 0.85, fontWeight: 800 }}>{c.items?.length ?? 0}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                      Kliknite za upravljanje artiklima
                    </div>
                  </button>

                  <button
                    style={{ ...btnDanger, minWidth: 54 }}
                    title="Obriši kategoriju"
                    onClick={() => deleteCategory(c.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}

              {menu.length === 0 && <div style={small}>Još nema kategorija.</div>}
            </div>
          </div>

          {/* RIGHT: Items */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                Artikli{" "}
                {selectedCat ? <span style={{ ...small, fontWeight: 700 }}>• {selectedCat.name}</span> : null}
              </h3>

              {selectedCat ? (
                <span style={small}>{(selectedCat.items || []).length} artikala</span>
              ) : (
                <span style={small}>Odaberite kategoriju</span>
              )}
            </div>

            {selectedCat ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 180px",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <input
                  style={input}
                  defaultValue={selectedCat.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== selectedCat.name) renameCategory(selectedCat.id, v);
                  }}
                />
                <button style={btnDanger} onClick={() => deleteCategory(selectedCat.id)}>
                  Obriši kategoriju
                </button>
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 160px 140px",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <input
                style={input}
                placeholder="Novi artikl…"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                disabled={!selectedCatId}
              />
              <input
                style={input}
                placeholder="Cijena"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                disabled={!selectedCatId}
              />
              <button style={btn} onClick={createItem} disabled={!selectedCatId}>
                Dodaj artikl
              </button>
            </div>

            {!selectedCat ? (
              <div style={small}>Odaberite kategoriju lijevo.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(selectedCat.items || []).map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 160px 140px",
                      gap: 10,
                      padding: 10,
                      borderRadius: 14,
                      border: "1px solid #263043",
                      background: "#0d1017",
                    }}
                  >
                    <input
                      style={input}
                      defaultValue={it.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== it.name) updateItem(it.id, { name: v });
                      }}
                    />
                    <input
                      style={input}
                      defaultValue={String(it.price)}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v > 0 && v !== it.price) updateItem(it.id, { price: v });
                      }}
                    />
                    <button style={btnDanger} onClick={() => deleteItem(it.id)}>
                      Obriši
                    </button>
                  </div>
                ))}
                {(selectedCat.items || []).length === 0 && <div style={small}>Još nema artikala.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}