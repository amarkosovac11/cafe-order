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
  const [newItemName1, setNewItemName1] = useState("");
  const [newItemName2, setNewItemName2] = useState("");
  const [newItemName3, setNewItemName3] = useState("");
  const [newItemName4, setNewItemName4] = useState("");
  const [newItemImage, setNewItemImage] = useState("");
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
    if (!name) return setErr("Naziv artikla je obavezan");
    if (!Number.isFinite(price) || price <= 0) return setErr("Cijena mora biti veća od 0");

    setErr("");
    try {
      const r = await authedFetch(`${api}/menu-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name1: newItemName1,
          name2: newItemName2,
          name3: newItemName3,
          name4: newItemName4,
          imageUrl: newItemImage,
          price,
          categoryId: selectedCatId,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setNewItemName("");
      setNewItemName1("");
      setNewItemName2("");
      setNewItemName3("");
      setNewItemName4("");
      setNewItemImage("");
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

  const wrap = {
    maxWidth: 1280,
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
    boxSizing: "border-box",
  };

  const small = { fontSize: 12, opacity: 0.8 };

  const itemEditorGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: 10,
  };

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
                gridTemplateColumns: "1fr",
                gap: 10,
                marginBottom: 16,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #263043",
                background: "#0d1017",
              }}
            >
              <div style={{ fontWeight: 800 }}>Dodaj novi artikl</div>

              <div style={itemEditorGrid}>
                <input
                  style={input}
                  placeholder="Osnovni naziv"
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
                <input
                  style={input}
                  placeholder="Naziv 1"
                  value={newItemName1}
                  onChange={(e) => setNewItemName1(e.target.value)}
                  disabled={!selectedCatId}
                />
                <input
                  style={input}
                  placeholder="Naziv 2"
                  value={newItemName2}
                  onChange={(e) => setNewItemName2(e.target.value)}
                  disabled={!selectedCatId}
                />
                <input
                  style={input}
                  placeholder="Naziv 3"
                  value={newItemName3}
                  onChange={(e) => setNewItemName3(e.target.value)}
                  disabled={!selectedCatId}
                />
                <input
                  style={input}
                  placeholder="Naziv 4"
                  value={newItemName4}
                  onChange={(e) => setNewItemName4(e.target.value)}
                  disabled={!selectedCatId}
                />
              </div>

              <input
                style={input}
                placeholder="Image URL"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
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
                      gridTemplateColumns: "1fr",
                      gap: 10,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid #263043",
                      background: "#0d1017",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Artikal</div>

                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        style={{
                          width: "100%",
                          maxWidth: 220,
                          height: 140,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid #2b3548",
                        }}
                      />
                    ) : null}

                    <div style={itemEditorGrid}>
                      <input
                        style={input}
                        defaultValue={it.name || ""}
                        placeholder="Osnovni naziv"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== (it.name || "")) updateItem(it.id, { name: v });
                        }}
                      />

                      <input
                        style={input}
                        defaultValue={String(it.price)}
                        placeholder="Cijena"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v > 0 && v !== it.price) {
                            updateItem(it.id, { price: v });
                          }
                        }}
                      />

                      <input
                        style={input}
                        defaultValue={it.name1 || ""}
                        placeholder="Naziv 1"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (it.name1 || "")) updateItem(it.id, { name1: v });
                        }}
                      />

                      <input
                        style={input}
                        defaultValue={it.name2 || ""}
                        placeholder="Naziv 2"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (it.name2 || "")) updateItem(it.id, { name2: v });
                        }}
                      />

                      <input
                        style={input}
                        defaultValue={it.name3 || ""}
                        placeholder="Naziv 3"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (it.name3 || "")) updateItem(it.id, { name3: v });
                        }}
                      />

                      <input
                        style={input}
                        defaultValue={it.name4 || ""}
                        placeholder="Naziv 4"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (it.name4 || "")) updateItem(it.id, { name4: v });
                        }}
                      />
                    </div>

                    <input
                      style={input}
                      defaultValue={it.imageUrl || ""}
                      placeholder="Image URL"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (it.imageUrl || "")) updateItem(it.id, { imageUrl: v });
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