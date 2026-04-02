import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import "../css/TablePage.css";

export default function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL;

  const [menu, setMenu] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // cart: { [itemId]: { itemId, name, price, qty, note } }
  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedMsg, setPlacedMsg] = useState("");
  const [callMsg, setCallMsg] = useState("");
  const [orderPopupOpen, setOrderPopupOpen] = useState(false);
  const [staffPopupOpen, setStaffPopupOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // jezik: 0 = osnovni name, 1 = name1, 2 = name2, 3 = name3, 4 = name4
  const [lang, setLang] = useState(0);

  // Token (optional)
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const token = searchParams.get("token") || "";

  const getItemName = (item) => {
    if (!item) return "";
    if (lang === 1 && item.name1) return item.name1;
    if (lang === 2 && item.name2) return item.name2;
    if (lang === 3 && item.name3) return item.name3;
    if (lang === 4 && item.name4) return item.name4;
    return item.name;
  };

  const openCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", cat);
    setSearchParams(params);
  };

  const goBackToMenu = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.delete("category");
    setSearchParams(params);
  };

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

    const translatedName = getItemName(it);
    showToast(`Dodano “${translatedName}”`);

    setCart((prev) => {
      const existing = prev[it.id];
      const qty = existing ? existing.qty + 1 : 1;
      return {
        ...prev,
        [it.id]: {
          itemId: it.id,
          name: translatedName,
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
      setPlacedMsg("Vaša narudžba je uspješno poslana.");
      setOrderPopupOpen(true);
      setCartOpen(false);

      const params = new URLSearchParams(searchParams);
      params.delete("category");
      setSearchParams(params);
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

      setCallMsg("Hotelsko osoblje je obaviješteno i uskoro će doći do Vaše sobe.");
      setStaffPopupOpen(true);
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
    const str = String(name || "");
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    const hue = (h % 60) + 25;
    return `hsl(${hue} 70% 55%)`;
  };

  return (
    <div className="tp-page">
      <div className="tp-ambient" aria-hidden="true" />
      <div className="tp-shell">
        <div className="tp-header">
          <div>
            <div className="tp-kicker">Posluga u sobu</div>
            <h1 className="tp-h1">Soba {tableId}</h1>
            <div className="tp-sub">
              {selectedCategory
                ? "Odaberite artikle za svoju narudžbu"
                : "Pregledajte meni i kontaktirajte osoblje po potrebi"}
            </div>
          </div>

          <div className="tp-headerActions tp-headerActions--vertical">
            <button onClick={callWaiter} className="tp-btn tp-btn--secondary">
              Pozovi osoblje
            </button>

           <div className="tp-langWrapper">
  <select
    value={lang}
    onChange={(e) => setLang(Number(e.target.value))}
    className="tp-langSelect"
  >
    <option value={0}>Bosnian</option>
    <option value={1}>English</option>
    <option value={2}>German</option>
    <option value={3}>Arabic</option>
    <option value={4}>French</option>
  </select>
</div>
          </div>
        </div>

        {toast.open && (
          <div className="tp-toast" role="status" aria-live="polite">
            {toast.text}
          </div>
        )}

        <div className="tp-alerts">
          {err && (
            <div className="tp-alert tp-alert--error">
              <div className="tp-alertTitle">Greška</div>
              <div className="tp-alertBody">{err}</div>
            </div>
          )}
        </div>

        <div className="tp-card">
          {selectedCategory && (
            <button className="tp-backButton" onClick={goBackToMenu}>
              ← Nazad
            </button>
          )}

          <div className="tp-cardHeader">
            {selectedCategory ? (
              <div>
                <div className="tp-kicker">Kategorija</div>
                <h2 className="tp-h2" style={{ marginTop: 6 }}>
                  {selectedCategory}
                </h2>
              </div>
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
                    onClick={() => openCategory(cat)}
                    style={{ "--tp-accent": accent }}
                  >
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
                    <div className="tp-itemName">{getItemName(it)}</div>
                    <div className="tp-itemMeta">
                      <span className="tp-metaPill">{selectedCategory}</span>
                    </div>
                  </div>

                  <div className="tp-itemRight">
                    <div className="tp-price">{it.price.toFixed(2)} KM</div>
                    <button
                      onClick={() => addItem(it)}
                      className="tp-btn tp-btn--primary"
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                              addItem({
                                id: ci.itemId,
                                name: ci.name,
                                price: ci.price,
                              })
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

                <div className="tp-finePrint">
                  Vaša narudžba se odmah šalje hotelskom osoblju.
                </div>
              </div>
            </div>
          </div>
        )}

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

        {orderPopupOpen && (
          <div
            className="tp-modalOverlay"
            onClick={() => setOrderPopupOpen(false)}
          >
            <div
              className="tp-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tp-modalIcon">✓</div>
              <h3 className="tp-modalTitle">Narudžba poslana</h3>
              <p className="tp-modalText">{placedMsg}</p>

              <button
                className="tp-btn tp-btn--checkout"
                onClick={() => setOrderPopupOpen(false)}
              >
                U redu
              </button>
            </div>
          </div>
        )}

        {staffPopupOpen && (
          <div
            className="tp-modalOverlay"
            onClick={() => setStaffPopupOpen(false)}
          >
            <div
              className="tp-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tp-modalIcon">✓</div>
              <h3 className="tp-modalTitle">Osoblje je obaviješteno</h3>
              <p className="tp-modalText">{callMsg}</p>

              <button
                className="tp-btn tp-btn--checkout"
                onClick={() => setStaffPopupOpen(false)}
              >
                U redu
              </button>
            </div>
          </div>
        )}

        <div className="tp-footerHint">
          Nakon dodavanja artikla, dolje će se pojaviti pregled korpe.
        </div>
      </div>
    </div>
  );
}