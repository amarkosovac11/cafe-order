import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "../css/TablePage.css";

export default function TablePage() {
  const { tableId } = useParams();
  const api = import.meta.env.VITE_API_URL;

  const [menu, setMenu] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedMsg, setPlacedMsg] = useState("");
  const [callMsg, setCallMsg] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

    showToast(`Dodano: ${it.name}`);

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
      setPlacedMsg("Vaša narudžba je uspješno poslana.");
      setCartOpen(false);
      setSelectedCategory(null);
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

      setCallMsg("Poziv osoblju je poslan.");
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

  return (
    <div className="tp-page">
      <div className="tp-shell">

        <div className="tp-header">
          <div>
            <div className="tp-kicker">Room Service</div>
            <h1 className="tp-h1">Soba {tableId}</h1>
            <div className="tp-sub">
              {selectedCategory
                ? "Odaberite artikle i dodajte ih u narudžbu"
                : "Pregledajte meni ili zatražite uslugu"}
            </div>
          </div>

          <div className="tp-headerActions">
            <button onClick={callWaiter} className="tp-btn tp-btn--secondary">
              🔔 Pozovi osoblje
            </button>
            <button onClick={requestBill} className="tp-btn tp-btn--secondary">
              🧾 Zatraži račun
            </button>
            <button onClick={() => setCartOpen(true)} className="tp-btn tp-btn--secondary">
              🛒 Korpa ({cartQty})
            </button>
          </div>
        </div>

        {err && <div style={{ color: "red" }}>{err}</div>}
        {placedMsg && <div style={{ color: "green" }}>{placedMsg}</div>}
        {callMsg && <div style={{ color: "green" }}>{callMsg}</div>}

        {!loading && !selectedCategory && (
          <div>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {!loading && selectedCategory && (
          <div>
            <button onClick={() => setSelectedCategory(null)}>← Nazad</button>

            {itemsForSelected.map((it) => (
              <div key={it.id}>
                {it.name} - {it.price} KM
                <button onClick={() => addItem(it)}>Dodaj</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}