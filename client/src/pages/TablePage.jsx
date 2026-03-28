import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "../css/TablePage.css";

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

  const [cartOpen, setCartOpen] = useState(false);

  // null => categories screen, otherwise items screen for that category
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Token (optional)
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

  const categories = useMemo(() => menu.map((c) => c.name), [menu]);

  const itemsForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = menu.find((c) => c.name === selectedCategory);
    const items = cat?.items || [];
    return items.map((it) => ({ ...it, category: selectedCategory }));
  }, [menu, selectedCategory]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const total = useMemo(
    () => cartItems.reduce((sum, it) => sum + it.price * it.qty, 0),
    [cartItems]
  );

  const cartQty = useMemo(
    () => cartItems.reduce((s, x) => s + x.qty, 0),
    [cartItems]
  );

  const [toast, setToast] = useState({ open: false, text: "" });

  const showToast = (text) => {
    setToast({ open: true, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast({ open: false, text: "" });
    }, 1500);
  };

  const hasItems = cartItems.length > 0;

  const addItem = (it) => {
    setPlacedMsg("");
    setErr("");
    setCallMsg("");

    //  toast instead of opening cart
    showToast(`Dodano “${it.name}”`);

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

    if (!hasItems) {
      setErr("Korpa je prazna.");
      return;
    }

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
      if (token) body.token = token;

      const res = await fetch(`${api}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setCart({});
      setPlacedMsg("Vaša narudžba za sobu je poslana.");
      setCartOpen(false);
      setSelectedCategory(null); // optional: back to categories
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
      if (token) body.token = token;

      const res = await fetch(`${api}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setCallMsg("Vaš zahtjev je poslan osoblju.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const requestBill = async () => {
    setErr("");
    setCallMsg("");
    setPlacedMsg("");

    try {
      const body = { tableId, type: "bill" };
      if (token) body.token = token;

      const res = await fetch(`${api}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setCallMsg("Račun je zatražen.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const accentFromName = (name) => {
    // Stable-ish hash -> HSL color (visual only)
    const str = String(name || "");
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    // Keep within warm range for a premium feel
    const hue = (h % 60) + 25; // 25..85
    return `hsl(${hue} 70% 55%)`;
  };

  return (
    <div className="tp-page">
      <div className="tp-ambient" aria-hidden="true" />
      <div className="tp-shell">
        {/* Header */}
        <div className="tp-header">
          <div>
            <div className="tp-kicker">Posluga u sobu</div>
            <h1 className="tp-h1">Soba {tableId}</h1>
            <div className="tp-sub">
              {selectedCategory
                ? "Odaberite artikle i dodajte ih u svoju narudžbu"
                : "Pregledajte meni ili zatražite hotelske usluge"}
            </div>
          </div>

          <div className="tp-headerActions">
            <button onClick={callWaiter} className="tp-btn tp-btn--secondary">
              <span className="tp-btnIcon" aria-hidden="true">🔔</span>
              Pozovi osoblje
            </button>
            {/* <button onClick={requestBill} className="tp-btn tp-btn--secondary">
              <span className="tp-btnIcon" aria-hidden="true">🧾</span>
              Zatraži pomoć
            </button> */}

           
          </div>
        </div>

        {toast.open && (
          <div className="tp-toast" role="status" aria-live="polite">
            {toast.text}
          </div>
        )}

        {/* Alerts */}
        <div className="tp-alerts">
          {err && (
            <div className="tp-alert tp-alert--error">
              <div className="tp-alertTitle">Greška</div>
              <div className="tp-alertBody">{err}</div>
            </div>
          )}
          {placedMsg && (
            <div className="tp-alert tp-alert--success">
              <div className="tp-alertTitle">Narudžba</div>
              <div className="tp-alertBody">{placedMsg}</div>
            </div>
          )}
          {callMsg && (
            <div className="tp-alert tp-alert--success">
              <div className="tp-alertTitle">Obavijest</div>
              <div className="tp-alertBody">{callMsg}</div>
            </div>
          )}
        </div>

        {/* MAIN CARD */}
        <div className="tp-card">
          {selectedCategory && (
            <button
              className="tp-backButton"
              onClick={() => setSelectedCategory(null)}
            >
              ← Nazad na meni
            </button>
          )}
          <div className="tp-cardHeader">
            {selectedCategory ? (
              <>
                <div>
                  <div className="tp-kicker">Kategorija</div>
                  <h2 className="tp-h2" style={{ marginTop: 6 }}>
                    {selectedCategory}
                  </h2>
                </div>
              </>
            ) : (
              <>
                <h2 className="tp-h2">Meni</h2>
                <div className="tp-badge">{categories.length} ukupno</div>
              </>
            )}
          </div>

          {loading && (
            <div className="tp-loading" style={{ padding: 14 }}>
              <div className="tp-skeletonRow" />
              <div className="tp-skeletonRow" />
              <div className="tp-skeletonRow" />
            </div>
          )}

          {!loading && !selectedCategory && (
            <div className="tp-categoriesGrid">
              {categories.map((cat) => {
                const count = menu.find((c) => c.name === cat)?.items?.length || 0;
                const accent = accentFromName(cat);
                return (
                  <button
                    key={cat}
                    className="tp-categoryCard"
                    onClick={() => setSelectedCategory(cat)}
                    style={{ "--tp-accent": accent }}
                  >
                    <div className="tp-categoryTop">
                      <div className="tp-categoryArrow" aria-hidden="true">→</div>
                    </div>
                    <div className="tp-categoryName">{cat}</div>
                    <div className="tp-categoryMeta">{count} artikala</div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && selectedCategory && (
            <div className="tp-menuList">
              {itemsForSelected.map((it) => (
                <div key={it.id} className="tp-menuItem">
                  <div className="tp-itemLeft">
                    <div className="tp-itemName">{it.name}</div>
                    <div className="tp-itemMeta">
                      <span className="tp-metaPill">{selectedCategory}</span>
                    </div>
                  </div>

                  <div className="tp-itemRight">
                    <div className="tp-price">{it.price.toFixed(2)} KM</div>
                    <button onClick={() => addItem(it)} className="tp-btn tp-btn--primary">
                      <span className="tp-btnIcon" aria-hidden="true">＋</span>
                      Dodaj u narudžbu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CART DRAWER */}
        {cartOpen && (
          <div className="tp-drawerOverlay" onClick={() => setCartOpen(false)}>
            <div className="tp-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="tp-drawerHeader">
                <div>
                  <div className="tp-kicker">Vaša narudžba</div>
                  <h2 className="tp-h2" style={{ marginTop: 6 }}>
                    Korpa
                  </h2>
                </div>

                <button
                  className="tp-btn tp-btn--icon"
                  onClick={() => setCartOpen(false)}
                  aria-label="Zatvori korpu"
                  title="Zatvori"
                >
                  ✕
                </button>
              </div>

              <div className="tp-drawerBody">
                {!hasItems ? (
                  <div className="tp-empty">
                    <div className="tp-emptyTitle">Još nema artikala</div>
                    <div className="tp-muted">Dodajte nešto iz menija.</div>
                  </div>
                ) : (
                  <div className="tp-cartList">
                    {cartItems.map((ci) => (
                      <div key={ci.itemId} className="tp-cartItem">
                        <div className="tp-cartTop">
                          <div className="tp-cartName">
                            {ci.name} <span className="tp-qty">× {ci.qty}</span>
                          </div>
                          <div className="tp-cartPrice">
                            {(ci.price * ci.qty).toFixed(2)} KM
                          </div>
                        </div>

                        <div className="tp-qtyRow">
                          <button
                            onClick={() => removeOne(ci.itemId)}
                            className="tp-btn tp-btn--icon"
                            aria-label="Smanji količinu"
                          >
                            −
                          </button>
                          <button
                            onClick={() =>
                              addItem({ id: ci.itemId, name: ci.name, price: ci.price })
                            }
                            className="tp-btn tp-btn--icon"
                            aria-label="Povećaj količinu"
                          >
                            +
                          </button>
                        </div>

                        <div className="tp-noteBlock">
                          <div className="tp-inputLabel">Napomena (opcionalno)</div>
                          <input
                            value={ci.note}
                            onChange={(e) => setNote(ci.itemId, e.target.value)}
                            placeholder="npr. zobeno mlijeko, bez šećera…"
                            className="tp-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

{hasItems && !cartOpen && (
  <button
    type="button"
    className="tp-stickyCartBar"
    onClick={() => setCartOpen(true)}
    aria-label="Otvori korpu"
  >
    <span className="tp-stickyCartCount">{cartQty}</span>
    <span className="tp-stickyCartLabel">Vidi korpu</span>
    <span className="tp-stickyCartPrice">{total.toFixed(2)} KM</span>
  </button>
)}
              
              <div className="tp-drawerFooter">
                <div className="tp-totalRow">
                  <div className="tp-totalLabel">Ukupno</div>
                  <div className="tp-totalValue">{total.toFixed(2)} KM</div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing || !hasItems}
                  className="tp-btn tp-btn--checkout"
                >
                  {placing ? "Slanje…" : "Završi narudžbu"}
                </button>

                <div className="tp-finePrint">Vaša narudžba se odmah šalje hotelskom osoblju.</div>
              </div>
            </div>
          </div>
        )}

        <div className="tp-footerHint">Savjet: koristite dugme Korpa za pregled narudžbe.</div>
      </div>
    </div>
  );
}
