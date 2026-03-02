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

  const hasItems = cartItems.length > 0;

  const addItem = (it) => {
    setPlacedMsg("");
    setErr("");
    setCallMsg("");

    // Optional nice UX: open cart when user adds first item
    setCartOpen(true);

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
      setErr("Cart is empty.");
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
      setPlacedMsg("✅ Order sent! Waiter will see it now.");
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

      setCallMsg("✅ Waiter has been notified.");
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

      setCallMsg("✅ Bill requested.");
    } catch (e) {
      setErr(e.message);
    }
  };

  // Visual helpers (no logic change — only UI)
 /*  const categoryIcon = (name) => {
    const n = String(name || "").toLowerCase();
    if (n.includes("coffee") || n.includes("hot drinks")) return "☕";
    if (n.includes("tea")) return "🍵";
    if (n.includes("cold")) return "🧊";
    if (n.includes("breakfast")) return "🍳";
    if (n.includes("sandwich")) return "🥪";
    if (n.includes("dessert")) return "🍰";
    if (n.includes("pizza")) return "🍕";
    if (n.includes("pasta")) return "🍝";
    if (n.includes("burger")) return "🍔";
    if (n.includes("salad")) return "🥗";
    if (n.includes("soup")) return "🥣";
    if (n.includes("seafood")) return "🦐";
    if (n.includes("grill") || n.includes("main")) return "🔥";
    if (n.includes("kids")) return "🧒";
    if (n.includes("cocktail")) return "🍸";
    if (n.includes("beer") || n.includes("wine") || n.includes("alcohol")) return "🍷";
    if (n.includes("side")) return "🍟";
    if (n.includes("starter")) return "✨";
    return "🍽️";
  }; */

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
            <div className="tp-kicker">Cafe Menu</div>
            <h1 className="tp-h1">Table {tableId}</h1>
            <div className="tp-sub">
              {selectedCategory ? "Pick items and add to cart" : "Choose a category to start"}
            </div>
          </div>

          <div className="tp-headerActions">
            <button onClick={callWaiter} className="tp-btn tp-btn--secondary">
              <span className="tp-btnIcon" aria-hidden="true">🔔</span>
              Call waiter
            </button>
            <button onClick={requestBill} className="tp-btn tp-btn--secondary">
              <span className="tp-btnIcon" aria-hidden="true">🧾</span>
              Request bill
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="tp-btn tp-btn--secondary tp-cartBtn"
            >
              <span className="tp-btnIcon" aria-hidden="true">🛒</span>
              Cart
              <span className="tp-cartCount">{cartQty}</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="tp-alerts">
          {err && (
            <div className="tp-alert tp-alert--error">
              <div className="tp-alertTitle">Error</div>
              <div className="tp-alertBody">{err}</div>
            </div>
          )}
          {placedMsg && (
            <div className="tp-alert tp-alert--success">
              <div className="tp-alertTitle">Order</div>
              <div className="tp-alertBody">{placedMsg}</div>
            </div>
          )}
          {callMsg && (
            <div className="tp-alert tp-alert--success">
              <div className="tp-alertTitle">Notification</div>
              <div className="tp-alertBody">{callMsg}</div>
            </div>
          )}
        </div>

        {/* MAIN CARD */}
        <div className="tp-card">
          <div className="tp-cardHeader">
            {selectedCategory ? (
              <>
                <div>
                  <div className="tp-kicker">Category</div>
                  <h2 className="tp-h2" style={{ marginTop: 6 }}>
                    {selectedCategory}
                  </h2>
                </div>

                <button
                  className="tp-btn tp-btn--secondary"
                  onClick={() => setSelectedCategory(null)}
                >
                  ← Back
                </button>
              </>
            ) : (
              <>
                <h2 className="tp-h2">Categories</h2>
                <div className="tp-badge">{categories.length} total</div>
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
                      {/* <div className="tp-categoryIcon" aria-hidden="true">
                        {categoryIcon(cat)}
                      </div> */}
                      <div className="tp-categoryArrow" aria-hidden="true">→</div>
                    </div>
                    <div className="tp-categoryName">{cat}</div>
                    <div className="tp-categoryMeta">{count} items</div>
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
                      Add
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
                  <div className="tp-kicker">Your Order</div>
                  <h2 className="tp-h2" style={{ marginTop: 6 }}>
                    Cart
                  </h2>
                </div>

                <button
                  className="tp-btn tp-btn--icon"
                  onClick={() => setCartOpen(false)}
                  aria-label="Close cart"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="tp-drawerBody">
                {!hasItems ? (
                  <div className="tp-empty">
                    <div className="tp-emptyTitle">No items yet</div>
                    <div className="tp-muted">Add something from the menu.</div>
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
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <button
                            onClick={() =>
                              addItem({ id: ci.itemId, name: ci.name, price: ci.price })
                            }
                            className="tp-btn tp-btn--icon"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="tp-noteBlock">
                          <div className="tp-inputLabel">Note (optional)</div>
                          <input
                            value={ci.note}
                            onChange={(e) => setNote(ci.itemId, e.target.value)}
                            placeholder="e.g. oat milk, no sugar…"
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
                  <div className="tp-totalLabel">Total</div>
                  <div className="tp-totalValue">{total.toFixed(2)} KM</div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing || !hasItems}
                  className="tp-btn tp-btn--checkout"
                >
                  {placing ? "Sending…" : "Finish order"}
                </button>

                <div className="tp-finePrint">Order goes instantly to the waiter.</div>
              </div>
            </div>
          </div>
        )}

        <div className="tp-footerHint">Tip: use Cart button to review your order.</div>
      </div>
    </div>
  );
}
