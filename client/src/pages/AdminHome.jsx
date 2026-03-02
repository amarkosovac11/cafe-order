import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isAdminLoggedIn } from "../adminAuth";
import "../css/AdminHome.css";

export default function AdminHome() {
  const nav = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn()) nav("/admin");
  }, [nav]);

  return (
    <div className="adminHomePage">
      <div className="adminHomeWrap">
        <div className="adminHomeHeader">
          <div>
            <h1 className="adminHomeTitle">Admin Panel</h1>
            <p className="adminHomeSubtitle">Tables overview + manage waiters.</p>
          </div>

          {/* Optional: quick action button */}
          <Link className="adminHomeBtn" to="/waiter">
            Open Dashboard
          </Link>
        </div>

        <div className="adminHomeGrid">
          <Link to="/admin/tables" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🪑</span>
              <span className="adminHomeCardTitle">See Tables</span>
            </div>
            <div className="adminHomeCardDesc">
              View tables and open table pages (with token).
            </div>
          </Link>

          <Link to="/admin/waiters" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">🧑‍🍳</span>
              <span className="adminHomeCardTitle">Manage Waiters</span>
            </div>
            <div className="adminHomeCardDesc">Add / disable / delete waiters.</div>
          </Link>

          <Link to="/waiter" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">📺</span>
              <span className="adminHomeCardTitle">Waiter Dashboard</span>
            </div>
            <div className="adminHomeCardDesc">Monitor orders + calls live.</div>
          </Link>

          <Link to="/admin/menu" className="adminHomeCard">
            <div className="adminHomeCardTop">
              <span className="adminHomeIcon">📋</span>
              <span className="adminHomeCardTitle">Manage Menu</span>
            </div>
            <div className="adminHomeCardDesc">
              Add / edit / delete categories and menu items.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}