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
  const [success, setSuccess] = useState("");

  const [newCat, setNewCat] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [categoryDraftName, setCategoryDraftName] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemName1, setNewItemName1] = useState("");
  const [newItemName2, setNewItemName2] = useState("");
  const [newItemName3, setNewItemName3] = useState("");
  const [newItemName4, setNewItemName4] = useState("");
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const [itemDrafts, setItemDrafts] = useState({});
  const [savingItemId, setSavingItemId] = useState("");
  const [deletingItemId, setDeletingItemId] = useState("");
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");

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

  function resetMessages() {
    setErr("");
    setSuccess("");
  }

  async function loadMenu() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${api}/menu`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setMenu(data);

      setSelectedCatId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id || "";
      });
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

  useEffect(() => {
    setCategoryDraftName(selectedCat?.name || "");

    const drafts = {};
    for (const item of selectedCat?.items || []) {
      drafts[item.id] = {
        name: item.name || "",
        name1: item.name1 || "",
        name2: item.name2 || "",
        name3: item.name3 || "",
        name4: item.name4 || "",
        imageUrl: item.imageUrl || "",
        price: item.price != null ? String(item.price) : "",
      };
    }
    setItemDrafts(drafts);
  }, [selectedCat]);

  function updateDraft(itemId, field, value) {
    setItemDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value,
      },
    }));
  }

  function getItemDraft(item) {
    return (
      itemDrafts[item.id] || {
        name: item.name || "",
        name1: item.name1 || "",
        name2: item.name2 || "",
        name3: item.name3 || "",
        name4: item.name4 || "",
        imageUrl: item.imageUrl || "",
        price: item.price != null ? String(item.price) : "",
      }
    );
  }

  async function createCategory() {
    const name = newCat.trim();
    if (!name) return;

    resetMessages();
    setIsCreatingCategory(true);

    try {
      const r = await authedFetch(`${api}/menu-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setNewCat("");
      setSuccess("Kategorija je uspješno dodana.");
      await loadMenu();

      if (data?.id) setSelectedCatId(data.id);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function saveCategoryName() {
    const newName = String(categoryDraftName || "").trim();
    if (!selectedCat) return;
    if (!newName) return setErr("Naziv kategorije je obavezan.");
    if (newName === selectedCat.name) return;

    resetMessages();
    setIsSavingCategory(true);

    try {
      const r = await authedFetch(`${api}/menu-category/${selectedCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setSuccess("Kategorija je uspješno izmijenjena.");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function deleteCategory(id) {
    if (!confirm("Obrisati ovu kategoriju? (Svi artikli će biti obrisani)")) return;

    resetMessages();
    setDeletingCategoryId(id);

    try {
      const r = await authedFetch(`${api}/menu-category/${id}`, {
        method: "DELETE",
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      if (id === selectedCatId) setSelectedCatId("");
      setSuccess("Kategorija je obrisana.");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setDeletingCategoryId("");
    }
  }

  async function createItem() {
    const name = newItemName.trim();
    const price = Number(newItemPrice);

    if (!selectedCatId) return setErr("Prvo odaberite kategoriju.");
    if (!name) return setErr("Osnovni naziv artikla je obavezan.");
    if (!Number.isFinite(price) || price <= 0) return setErr("Cijena mora biti veća od 0.");

    resetMessages();
    setIsCreatingItem(true);

    try {
      const r = await authedFetch(`${api}/menu-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name1: newItemName1.trim(),
          name2: newItemName2.trim(),
          name3: newItemName3.trim(),
          name4: newItemName4.trim(),
          imageUrl: newItemImage.trim(),
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
      setSuccess("Artikal je uspješno dodan.");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setIsCreatingItem(false);
    }
  }

  async function saveItem(item) {
    const draft = getItemDraft(item);
    const price = Number(draft.price);

    if (!draft.name.trim()) return setErr("Osnovni naziv artikla je obavezan.");
    if (!Number.isFinite(price) || price <= 0) return setErr("Cijena mora biti veća od 0.");

    const patch = {
      name: draft.name.trim(),
      name1: draft.name1.trim(),
      name2: draft.name2.trim(),
      name3: draft.name3.trim(),
      name4: draft.name4.trim(),
      imageUrl: draft.imageUrl.trim(),
      price,
    };

    resetMessages();
    setSavingItemId(item.id);

    try {
      const r = await authedFetch(`${api}/menu-item/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setSuccess(`Artikal "${patch.name}" je sačuvan.`);
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSavingItemId("");
    }
  }

  async function deleteItem(id) {
    if (!confirm("Obrisati ovaj artikl?")) return;

    resetMessages();
    setDeletingItemId(id);

    try {
      const r = await authedFetch(`${api}/menu-item/${id}`, {
        method: "DELETE",
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setSuccess("Artikal je obrisan.");
      await loadMenu();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setDeletingItemId("");
    }
  }

  const wrap = {
    maxWidth: 1400,
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
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(8px)",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
    gap: 16,
    marginTop: 16,
  };

  const card = {
    background: "#10131a",
    border: "1px solid #263043",
    borderRadius: 16,
    padding: 16,
  };

  const sectionTitle = {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 900,
  };

  const btn = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #2b3548",
    background: "#1b2230",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  };

  const btnPrimary = {
    ...btn,
    background: "#23406b",
    borderColor: "#355789",
  };

  const btnDanger = {
    ...btn,
    borderColor: "#7a2b2b",
    background: "#2a1214",
  };

  const btnMuted = {
    ...btn,
    background: "#141922",
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

  const label = {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.85,
    marginBottom: 6,
  };

  const small = { fontSize: 12, opacity: 0.8 };

  const itemEditorGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: 12,
  };

  const itemCardGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
    gap: 14,
    alignItems: "start",
  };

  return (
    <div style={wrap}>
      <div style={header}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Admin • Meni</h1>
          </div>

          <button style={btnMuted} onClick={loadMenu}>
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

        {success && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #245a35",
              background: "#0f1a13",
              color: "#bbf7d0",
              fontWeight: 700,
            }}
          >
            {success}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ ...card, marginTop: 16 }}>Učitavanje…</div>
      ) : (
        <div style={grid}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <h3 style={sectionTitle}>Kategorije</h3>
              <div style={small}>{menu.length} ukupno</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <input
                style={input}
                placeholder="Upiši naziv nove kategorije"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <button style={btnPrimary} onClick={createCategory} disabled={isCreatingCategory}>
                {isCreatingCategory ? "Dodavanje..." : "Dodaj"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {menu.map((c) => {
                const isSelected = c.id === selectedCatId;
                const isDeleting = deletingCategoryId === c.id;

                return (
                  <div
                    key={c.id}
                    style={{
                      border: isSelected ? "1px solid #4b6ea8" : "1px solid #263043",
                      borderRadius: 14,
                      background: isSelected ? "#162236" : "#0d1017",
                      padding: 10,
                    }}
                  >
                    <button
                      onClick={() => setSelectedCatId(c.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Odaberi kategoriju"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontWeight: 900 }}>{c.name}</span>
                        <span
                          style={{
                            minWidth: 30,
                            textAlign: "center",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#243042",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {c.items?.length ?? 0}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                        {isSelected ? "Aktivna kategorija" : "Klikni za pregled i uređivanje artikala"}
                      </div>
                    </button>

                    <div style={{ marginTop: 10 }}>
                      <button
                        style={{ ...btnDanger, width: "100%" }}
                        onClick={() => deleteCategory(c.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Brisanje..." : "Obriši kategoriju"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {menu.length === 0 && <div style={small}>Još nema kategorija.</div>}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <h3 style={sectionTitle}>Odabrana kategorija</h3>
                {selectedCat ? (
                  <span style={small}>{(selectedCat.items || []).length} artikala</span>
                ) : (
                  <span style={small}>Odaberi kategoriju lijevo</span>
                )}
              </div>

              {!selectedCat ? (
                <div style={small}>Prvo odaberi kategoriju sa lijeve strane.</div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr auto auto",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={label}>Naziv kategorije</label>
                    <input
                      style={input}
                      value={categoryDraftName}
                      onChange={(e) => setCategoryDraftName(e.target.value)}
                      placeholder="Naziv kategorije"
                    />
                  </div>

                  <button style={btnPrimary} onClick={saveCategoryName} disabled={isSavingCategory}>
                    {isSavingCategory ? "Čuvanje..." : "Sačuvaj naziv"}
                  </button>

                  <button
                    style={btnDanger}
                    onClick={() => deleteCategory(selectedCat.id)}
                    disabled={deletingCategoryId === selectedCat.id}
                  >
                    {deletingCategoryId === selectedCat.id ? "Brisanje..." : "Obriši kategoriju"}
                  </button>
                </div>
              )}
            </div>

            <div style={card}>
              <h3 style={sectionTitle}>Dodaj novi artikal</h3>

              {!selectedCat ? (
                <div style={small}>Odaberi kategoriju da bi dodao novi artikal.</div>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: 14,
                      padding: 10,
                      borderRadius: 12,
                      background: "#0d1017",
                      border: "1px solid #263043",
                      fontSize: 13,
                    }}
                  >
                    Novi artikal će biti dodan u kategoriju:{" "}
                    <strong>{selectedCat.name}</strong>
                  </div>

                  <div style={itemEditorGrid}>
                    <div>
                      <label style={label}>Osnovni naziv (BHS)</label>
                      <input
                        style={input}
                        placeholder="npr. Palačinke Nutella"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={label}>Cijena</label>
                      <input
                        style={input}
                        placeholder="npr. 7.5"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={label}>Engleski naziv</label>
                      <input
                        style={input}
                        placeholder="npr. Nutella pancakes"
                        value={newItemName1}
                        onChange={(e) => setNewItemName1(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={label}>Njemački naziv</label>
                      <input
                        style={input}
                        placeholder="npr. Nutella Pfannkuchen"
                        value={newItemName2}
                        onChange={(e) => setNewItemName2(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={label}>Italijanski naziv</label>
                      <input
                        style={input}
                        placeholder="npr. Pancake alla Nutella"
                        value={newItemName3}
                        onChange={(e) => setNewItemName3(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={label}>Francuski naziv</label>
                      <input
                        style={input}
                        placeholder="npr. Crêpes Nutella"
                        value={newItemName4}
                        onChange={(e) => setNewItemName4(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label style={label}>Image URL</label>
                    <input
                      style={input}
                      placeholder="https://... ili /images/..."
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <button style={btnPrimary} onClick={createItem} disabled={isCreatingItem}>
                      {isCreatingItem ? "Dodavanje..." : "Dodaj artikl"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <h3 style={sectionTitle}>Postojeći artikli</h3>
                {selectedCat ? (
                  <span style={small}>
                    {(selectedCat.items || []).length} u kategoriji <strong>{selectedCat.name}</strong>
                  </span>
                ) : (
                  <span style={small}>Odaberi kategoriju</span>
                )}
              </div>

              {!selectedCat ? (
                <div style={small}>Odaberi kategoriju lijevo da vidiš artikle.</div>
              ) : (selectedCat.items || []).length === 0 ? (
                <div style={small}>Još nema artikala u ovoj kategoriji.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(selectedCat.items || []).map((it, index) => {
                    const draft = getItemDraft(it);
                    const isSaving = savingItemId === it.id;
                    const isDeleting = deletingItemId === it.id;

                    return (
                      <div
                        key={it.id}
                        style={{
                          border: "1px solid #263043",
                          borderRadius: 16,
                          background: "#0d1017",
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            marginBottom: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900, fontSize: 16 }}>
                              Artikal #{index + 1}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                              ID: {it.id}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: "#1a2230",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Kategorija: {selectedCat.name}
                          </div>
                        </div>

                        <div style={itemCardGrid}>
                          <div>
                            {draft.imageUrl ? (
                              <img
                                src={draft.imageUrl}
                                alt={draft.name || it.name}
                                style={{
                                  width: "100%",
                                  height: 160,
                                  objectFit: "cover",
                                  borderRadius: 12,
                                  border: "1px solid #2b3548",
                                  background: "#0b0e13",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: 160,
                                  borderRadius: 12,
                                  border: "1px dashed #2b3548",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "rgba(255,255,255,0.55)",
                                  fontSize: 13,
                                  textAlign: "center",
                                  padding: 12,
                                  boxSizing: "border-box",
                                  background: "#0b0e13",
                                }}
                              >
                                Nema slike
                              </div>
                            )}
                          </div>

                          <div>
                            <div style={itemEditorGrid}>
                              <div>
                                <label style={label}>Osnovni naziv (BHS)</label>
                                <input
                                  style={input}
                                  value={draft.name}
                                  placeholder="Osnovni naziv"
                                  onChange={(e) => updateDraft(it.id, "name", e.target.value)}
                                />
                              </div>

                              <div>
                                <label style={label}>Cijena</label>
                                <input
                                  style={input}
                                  value={draft.price}
                                  placeholder="Cijena"
                                  onChange={(e) => updateDraft(it.id, "price", e.target.value)}
                                />
                              </div>

                              <div>
                                <label style={label}>Engleski naziv</label>
                                <input
                                  style={input}
                                  value={draft.name1}
                                  placeholder="English"
                                  onChange={(e) => updateDraft(it.id, "name1", e.target.value)}
                                />
                              </div>

                              <div>
                                <label style={label}>Njemački naziv</label>
                                <input
                                  style={input}
                                  value={draft.name2}
                                  placeholder="Deutsch"
                                  onChange={(e) => updateDraft(it.id, "name2", e.target.value)}
                                />
                              </div>

                              <div>
                                <label style={label}>Italijanski naziv</label>
                                <input
                                  style={input}
                                  value={draft.name3}
                                  placeholder="Italiano"
                                  onChange={(e) => updateDraft(it.id, "name3", e.target.value)}
                                />
                              </div>

                              <div>
                                <label style={label}>Francuski naziv</label>
                                <input
                                  style={input}
                                  value={draft.name4}
                                  placeholder="Français"
                                  onChange={(e) => updateDraft(it.id, "name4", e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                              <label style={label}>Image URL</label>
                              <input
                                style={input}
                                value={draft.imageUrl}
                                placeholder="https://... ili /images/..."
                                onChange={(e) => updateDraft(it.id, "imageUrl", e.target.value)}
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 14,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                style={btnPrimary}
                                onClick={() => saveItem(it)}
                                disabled={isSaving}
                              >
                                {isSaving ? "Čuvanje..." : "Sačuvaj artikal"}
                              </button>

                              <button
                                style={btnDanger}
                                onClick={() => deleteItem(it.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Brisanje..." : "Obriši artikal"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}